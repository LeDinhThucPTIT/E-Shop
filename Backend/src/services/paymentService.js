const mongoose = require('mongoose');
const { randomBytes } = require('node:crypto');
const Order = require('../models/Orders');
const Attempt = require('../models/PaymentAttempt');
const gateway = require('./momoGateway');
const { fail, requireId } = require('../utils/http');

async function create(userId, orderId) {
  gateway.config();
  requireId(orderId);
  let attempt;
  await mongoose.connection.transaction(async session => {
    const order = await Order.findOne({ _id: orderId, user: userId }).session(session);
    if (!order) throw fail(404, 'Không tìm thấy đơn hàng');
    if (order.paymentMethod !== 'momo' || order.orderStatus !== 'pending' || order.paymentStatus === 'paid')
      throw fail(409, 'Đơn hàng không thể thanh toán MoMo');
    if (order.paymentNeedsReview) throw fail(409, 'Giao dịch cần đối soát, vui lòng liên hệ cửa hàng');
    gateway.validateAmount(order.totalPrice);
    if (!order.paymentExpiresAt || order.paymentExpiresAt <= new Date())
      throw fail(409, 'Đã hết thời gian tạo thanh toán. Vui lòng kiểm tra trạng thái đơn hàng.');
    const unresolved = await Attempt.findOne({ order: order._id, status: { $in: ['pending', 'review', 'paid'] } }).session(session);
    if (unresolved) {
      if (unresolved.provider !== 'momo' || unresolved.status !== 'pending')
        throw fail(409, 'Giao dịch đang chờ đối soát, vui lòng kiểm tra lại sau');
      attempt = unresolved;
    } else {
      [attempt] = await Attempt.create([{
        order: order._id, user: userId, provider: 'momo', reference: randomBytes(16).toString('hex'),
        requestId: randomBytes(16).toString('hex'), amount: order.totalPrice, expiresAt: order.paymentExpiresAt,
      }], { session });
    }
    // Serialize attempt allocation with cancellation, IPN and concurrent checkout.
    order.paymentRevision += 1;
    order.paymentStatus = 'pending';
    await order.save({ session });
  });
  if (attempt.paymentUrl) return { paymentUrl: attempt.paymentUrl, expiresAt: attempt.expiresAt };

  // Keep network requests outside transactions. A persisted lease prevents concurrent creates.
  const token = randomBytes(16).toString('hex');
  const claimed = await Attempt.findOneAndUpdate({ _id: attempt._id, status: 'pending', paymentUrl: { $exists: false },
    $or: [{ initiationUntil: { $exists: false } }, { initiationUntil: { $lt: new Date() } }] },
  { $set: { initiationToken: token, initiationUntil: new Date(Date.now() + 45000) } }, { returnDocument: 'after' });
  if (!claimed) {
    const latest = await Attempt.findById(attempt._id);
    if (latest?.status === 'pending' && latest.paymentUrl) return { paymentUrl: latest.paymentUrl, expiresAt: latest.expiresAt };
    throw fail(409, 'MoMo đang xử lý yêu cầu. Vui lòng cập nhật trạng thái đơn hàng rồi thử lại.');
  }
  try {
    // A timeout retry keeps the same orderId/requestId, never allocates a second charge.
    const data = await gateway.create(claimed);
    if (Number(data.resultCode) !== 0) {
      if (gateway.isFinalFailure(data.resultCode)) await applyResult(data);
      throw fail(400, `MoMo chưa tạo được thanh toán (mã ${data.resultCode}). Vui lòng kiểm tra cấu hình hoặc thử lại từ đơn hàng.`);
    }
    const saved = await Attempt.findOneAndUpdate({ _id: claimed._id, status: 'pending', initiationToken: token },
      { $set: { paymentUrl: data.payUrl }, $unset: { initiationToken: 1, initiationUntil: 1 } }, { returnDocument: 'after' });
    if (!saved) throw fail(409, 'Giao dịch đã thay đổi trạng thái. Vui lòng cập nhật đơn hàng.');
    return { paymentUrl: saved.paymentUrl, expiresAt: saved.expiresAt };
  } catch (error) {
    if (error.status) throw error;
    throw fail(400, 'Chưa nhận được kết quả từ MoMo. Vui lòng mở đơn hàng để kiểm tra trước khi thử lại.');
  } finally {
    await Attempt.updateOne({ _id: claimed._id, initiationToken: token }, { $unset: { initiationToken: 1, initiationUntil: 1 } });
  }
}

async function applyResult(params, fromQuery = false) {
  await mongoose.connection.transaction(async session => {
    const payment = await Attempt.findOne({ provider: 'momo', reference: params.orderId }).session(session);
    if (!payment) throw fail(404, 'Không tìm thấy giao dịch MoMo');
    if (!gateway.integer(params.amount) || Number(params.amount) !== payment.amount || params.partnerCode !== gateway.config().partnerCode)
      throw fail(400, 'Thông tin thanh toán MoMo không khớp');
    if (!fromQuery && params.requestId !== payment.requestId) throw fail(400, 'Mã yêu cầu MoMo không khớp');
    if (payment.status === 'paid' || payment.status === 'review') return;
    const order = await Order.findById(payment.order).session(session);
    if (!order || order.paymentMethod !== 'momo') throw fail(409, 'Đơn hàng không khớp giao dịch MoMo');
    const success = Number(params.resultCode) === 0;
    const failed = gateway.isFinalFailure(params.resultCode);
    // Authorization (9000), processing, not-found and unknown errors retain stock for reconciliation.
    if (!success && !failed) return;
    if (success && (!gateway.integer(params.transId) || Number(params.transId) <= 0)) throw fail(400, 'Mã giao dịch MoMo không hợp lệ');
    payment.responseCode = String(params.resultCode);
    payment.lastCheckedAt = new Date();
    if (success) {
      payment.transactionId = String(params.transId);
      payment.paidAt = new Date();
      payment.status = order.orderStatus === 'cancelled' || (order.paymentStatus === 'paid' && order.transactionId !== payment.transactionId) ? 'review' : 'paid';
      if (payment.status === 'review') order.paymentNeedsReview = true;
      if (payment.status === 'paid') {
        order.paymentStatus = 'paid';
        order.transactionId = payment.transactionId;
        order.paidAt = payment.paidAt;
      }
    } else if (payment.status === 'pending') {
      payment.status = 'failed';
      if (order.paymentStatus !== 'paid') {
        const otherPending = await Attempt.exists({ order: order._id, _id: { $ne: payment._id }, status: 'pending' }).session(session);
        order.paymentStatus = otherPending ? 'pending' : 'failed';
      }
    }
    order.paymentRevision += 1;
    await payment.save({ session });
    await order.save({ session });
  });
}
async function ipn(params) {
  if (!gateway.verify(params)) throw fail(400, 'Chữ ký MoMo không hợp lệ');
  return applyResult(params);
}
async function reconcile(payment) {
  await Attempt.updateOne({ _id: payment._id }, { $set: { lastCheckedAt: new Date() } });
  const data = await gateway.query(payment);
  await applyResult(data, true);
}
async function status(userId, id) {
  const order = await Order.findOne({ _id: requireId(id), user: userId });
  if (!order) throw fail(404, 'Không tìm thấy đơn hàng');
  const attempts = await Attempt.find({ order: order._id }).sort({ createdAt: -1 }).select('reference provider status expiresAt transactionId responseCode');
  return { orderCode: order.orderCode, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus, expiresAt: order.paymentExpiresAt, needsReview: order.paymentNeedsReview || attempts.some(a => a.status === 'review'), attempts };
}
async function sweep() {
  const pending = await Attempt.find({ provider: 'momo', status: 'pending', createdAt: { $lte: new Date(Date.now() - 60000) },
    $or: [{ lastCheckedAt: { $exists: false } }, { lastCheckedAt: { $lt: new Date(Date.now() - 60000) } }] }).sort({ lastCheckedAt: 1 }).limit(20);
  for (const payment of pending) {
    try { await reconcile(payment); } catch { console.warn('MoMo reconciliation pending:', payment.reference); }
  }
  const expired = await Order.find({ paymentMethod: 'momo', orderStatus: 'pending', paymentStatus: { $ne: 'paid' }, paymentExpiresAt: { $lt: new Date() } }).limit(50);
  for (const order of expired) {
    try { await require('./orderService').cancelOrder(order.user, String(order._id), 'Hết thời gian thanh toán MoMo'); }
    catch (error) { if (error.status !== 409) console.error('MoMo expiry failed:', error.message); }
  }
}
function startWorker() {
  try { gateway.config(); } catch { return () => {}; }
  let running = false;
  const run = async () => { if (running) return; running = true; try { await sweep(); } catch (error) { console.error('MoMo worker:', error.message); } finally { running = false; } };
  const timer = setInterval(run, 60000);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}
module.exports = { create, ipn, status, sweep, startWorker };

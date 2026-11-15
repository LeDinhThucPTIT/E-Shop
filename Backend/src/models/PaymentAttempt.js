const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reference: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  // Missing provider on attempts from the previous integration means legacy VNPay.
  provider: { type: String, enum: ['momo', 'vnpay'], default: 'vnpay', index: true },
  requestId: String,
  paymentUrl: String,
  initiationToken: String,
  initiationUntil: Date,
  status: { type: String, enum: ['pending', 'paid', 'failed', 'review'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  gatewayCreatedDate: String,
  ipAddress: String,
  transactionId: String,
  responseCode: String,
  transactionStatus: String,
  paidAt: Date,
  lastCheckedAt: Date,
}, { timestamps: true });
schema.index({ status: 1, expiresAt: 1 });
module.exports = mongoose.model('PaymentAttempt', schema);

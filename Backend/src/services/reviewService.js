const mongoose = require("mongoose");
const Product = require("../models/Products");
const Review = require("../models/Reviews");
const Order = require("../models/Orders");
const { fail, requireId } = require("../utils/http");

async function createReview(productId, userId, body) {
  requireId(productId);
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5 ||
      typeof body.title !== "string" || !body.title.trim() || body.title.length > 120 ||
      typeof body.content !== "string" || !body.content.trim() || body.content.length > 2000)
    throw fail(400, "Nhập điểm từ 1–5, tiêu đề tối đa 120 và nội dung tối đa 2000 ký tự");
  return mongoose.connection.transaction(async (session) => {
    // Serialize review writes for each product, including duplicate checks and totals.
    const product = await Product.findOneAndUpdate(
      { _id: productId, isActive: true }, { $inc: { __v: 1 } },
      { session, returnDocument: "after" },
    );
    if (!product) throw fail(404, "Không tìm thấy sản phẩm");
    if (await Review.exists({ product: productId, user: userId }).session(session))
      throw fail(409, "Bạn đã đánh giá sản phẩm này");
    const verified = !!(await Order.exists({
      user: userId, "items.product": productId, orderStatus: "delivered",
    }).session(session));
    await Review.create([{
      product: productId, user: userId, rating: body.rating,
      title: body.title.trim(), comment: body.content.trim(), verified,
    }], { session });
    const [summary] = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).session(session);
    await Product.updateOne({ _id: productId }, {
      $set: { rating: summary.rating, reviewCount: summary.count },
    }, { session });
    return { success: true };
  });
}
module.exports = { createReview };

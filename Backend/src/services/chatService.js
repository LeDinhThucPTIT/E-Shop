const Product = require("../models/Products");
const { fail } = require("../utils/http");
const { respond } = require("../chat/rules");
const validateRequest = (body) => {
  if (
    typeof body.message !== "string" ||
    !body.message.trim() ||
    body.message.length > 2000
  )
    throw fail(400, "Tin nhắn phải có từ 1 đến 2000 ký tự");
  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > 12)
    throw fail(400, "Lịch sử hội thoại không hợp lệ (tối đa 12 lượt)");
  for (const turn of history) {
    if (
      !turn ||
      !["user", "assistant"].includes(turn.role) ||
      typeof turn.content !== "string" ||
      turn.content.length > 2000 ||
      (turn.productIds !== undefined &&
        (!Array.isArray(turn.productIds) ||
          turn.productIds.length > 5 ||
          turn.productIds.some(
            (id) => typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id),
          )))
    )
      throw fail(400, "Lịch sử hội thoại không hợp lệ");
  }
  return { message: body.message.trim(), history };
};
const chat = async (body) => {
  const { message, history } = validateRequest(body);
  // Public catalog only: never include user, payment or order data in chatbot context.
  const products = await Product.find({ isActive: true })
    .select(
      "name slug sku description price discountPrice stock images thumbnail category brand specifications variants warranty tags rating featured isActive",
    )
    .populate("category", "name slug")
    .populate("brand", "name")
    .sort({ _id: 1 })
    .lean();
  return respond(message, history, products);
};
module.exports = { chat, validateRequest };

const Cart = require("../models/Cart");
const Product = require("../models/Products");
const { fail, requireId } = require("../utils/http");
const resolveItem = async (productId, sku, quantity, session) => {
  requireId(productId);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999)
    throw fail(400, "Số lượng phải là số nguyên từ 1 đến 999");
  const product = await Product.findById(productId).session(session || null);
  if (!product || !product.isActive)
    throw fail(404, "Sản phẩm không còn kinh doanh");
  const variant = product.variants.length
    ? product.variants.find((v) => v.sku === sku)
    : null;
  if (product.variants.length && !variant)
    throw fail(400, "Vui lòng chọn phiên bản sản phẩm");
  const selectedSku = variant?.sku || product.sku || String(product._id);
  if (!variant && sku && sku !== selectedSku)
    throw fail(400, "SKU không hợp lệ");
  const stock = variant ? variant.stock : product.stock;
  const price = variant
    ? variant.price
    : (product.discountPrice ?? product.price);
  if (!Number.isSafeInteger(stock) || stock < quantity)
    throw fail(409, "Số lượng vượt quá tồn kho");
  if (!Number.isSafeInteger(price) || price < 0)
    throw fail(400, "Giá sản phẩm chưa hợp lệ");
  return { product, variant, sku: selectedSku, stock, price };
};
const getCartUser = async (userId) =>
  (await Cart.findOne({ user: userId }).populate("items.product")) || {
    items: [],
  };
const mutate = async (userId, productId, sku, quantity, mode) => {
  const resolved = await resolveItem(productId, sku, quantity);
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });
  const existing = cart.items.find(
    (i) => String(i.product) === productId && i.sku === resolved.sku,
  );
  if (mode === "update" && !existing)
    throw fail(404, "Sản phẩm không có trong giỏ");
  const nextQuantity =
    mode === "add" ? (existing?.quantity || 0) + quantity : quantity;
  if (nextQuantity > resolved.stock || nextQuantity > 999)
    throw fail(409, "Số lượng vượt quá tồn kho");
  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product: productId, sku: resolved.sku, quantity });
  await cart.save();
  return getCartUser(userId);
};
const removeItem = async (userId, productId, sku) => {
  requireId(productId);
  if (typeof sku !== "string" || !sku) throw fail(400, "Thiếu SKU");
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { product: productId, sku } }, $inc: { __v: 1 } },
    { returnDocument: "after" },
  ).populate("items.product");
  return cart || { items: [] };
};
const clearCart = async (userId) => {
  await Cart.updateOne(
    { user: userId },
    { $set: { items: [] }, $inc: { __v: 1 } },
  );
  return { items: [] };
};
module.exports = {
  resolveItem,
  getCartUser,
  addToCart: (u, p, s, q) => mutate(u, p, s, q, "add"),
  updateCart: (u, p, s, q) => mutate(u, p, s, q, "update"),
  removeItem,
  clearCart,
};

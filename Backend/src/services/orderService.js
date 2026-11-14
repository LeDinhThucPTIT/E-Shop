const mongoose = require("mongoose");
const { randomUUID, createHash } = require("node:crypto");
const Order = require("../models/Orders");
const Product = require("../models/Products");
const Cart = require("../models/Cart");
const { resolveItem } = require("./cartService");
const { fail, requireId, pagination } = require("../utils/http");
const findOrder = (value) =>
  mongoose.isObjectIdOrHexString(value) ? { _id: value } : { orderCode: value };
const pageOrders = async (filter, query) => {
  const { page, limit, skip } = pagination(query);
  const [data, totalItems] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
const createOrder = async (userId, data, key) => {
  if (typeof key !== "string" || key.length < 8 || key.length > 100)
    throw fail(400, "Thiếu Idempotency-Key hợp lệ");
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify({
        items: Array.isArray(data.items)
          ? data.items.map((i) => ({
              product: i?.product,
              sku: i?.sku,
              quantity: i?.quantity,
            }))
          : null,
        shippingAddress: [
          "name",
          "phone",
          "email",
          "street",
          "ward",
          "district",
          "province",
        ].map((key) => data.shippingAddress?.[key] || ""),
        shippingMethod: data.shippingMethod,
        paymentMethod: data.paymentMethod,
      }),
    )
    .digest("hex");
  const replay = (order) => {
    if (order.requestHash !== requestHash)
      throw fail(
        409,
        "Yêu cầu đặt hàng đã thay đổi. Vui lòng dùng Idempotency-Key mới",
      );
    return order;
  };
  const existing = await Order.findOne({ user: userId, idempotencyKey: key });
  if (existing) return replay(existing);
  if (data.paymentMethod !== "cod")
    throw fail(400, "Hiện chỉ hỗ trợ thanh toán khi nhận hàng (COD)");
  if (!["standard", "express"].includes(data.shippingMethod))
    throw fail(400, "Phương thức vận chuyển không hợp lệ");
  const address = data.shippingAddress;
  if (
    !address ||
    ["name", "phone", "street", "ward", "district", "province"].some(
      (key) => typeof address[key] !== "string" || !address[key].trim(),
    )
  )
    throw fail(400, "Vui lòng nhập đầy đủ địa chỉ giao hàng");
  if (!/^\d{9,11}$/.test(address.phone))
    throw fail(400, "Số điện thoại không hợp lệ");
  if (
    !Array.isArray(data.items) ||
    !data.items.length ||
    data.items.length > 100
  )
    throw fail(400, "Đơn hàng phải có từ 1 đến 100 dòng sản phẩm");
  const seen = new Set();
  let result;
  try {
    await mongoose.connection.transaction(async (session) => {
      const duplicate = await Order.findOne({
        user: userId,
        idempotencyKey: key,
      }).session(session);
      if (duplicate) {
        result = replay(duplicate);
        return;
      }
      const items = [];
      seen.clear();
      for (const item of data.items) {
        if (!item || typeof item !== "object")
          throw fail(400, "Dòng sản phẩm không hợp lệ");
        const { product, variant, sku, price } = await resolveItem(
          item.product,
          item.sku,
          item.quantity,
          session,
        );
        const identity = `${product._id}:${sku}`;
        if (seen.has(identity))
          throw fail(400, "Sản phẩm bị trùng trong đơn hàng");
        seen.add(identity);
        const filter = { _id: product._id, isActive: true };
        const changes = { soldCount: item.quantity, __v: 1 };
        if (variant) {
          filter.variants = {
            $elemMatch: { sku, stock: { $gte: item.quantity } },
          };
          changes["variants.$.stock"] = -item.quantity;
        } else filter.stock = { $gte: item.quantity };
        changes.stock = -item.quantity;
        const updated = await Product.updateOne(
          filter,
          { $inc: changes },
          { session },
        );
        if (!updated.modifiedCount)
          throw fail(409, "Sản phẩm vừa hết hàng, vui lòng kiểm tra lại");
        items.push({
          product: product._id,
          sku,
          variantName: variant
            ? [variant.color, variant.storage].filter(Boolean).join(" - ") ||
              sku
            : "Tiêu chuẩn",
          name: product.name,
          image:
            variant?.image ||
            product.images[0] ||
            product.thumbnail ||
            "/favicon.svg",
          price,
          quantity: item.quantity,
          subtotal: price * item.quantity,
        });
      }
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingFee =
        data.shippingMethod === "express"
          ? 80000
          : subtotal > 20000000
            ? 0
            : 50000;
      const tax = Math.round(subtotal * 0.08);
      [result] = await Order.create(
        [
          {
            user: userId,
            orderCode: `ORD-${randomUUID().toUpperCase()}`,
            idempotencyKey: key,
            requestHash,
            items,
            shippingAddress: address,
            shippingMethod: data.shippingMethod,
            paymentMethod: "cod",
            subtotal,
            shippingFee,
            tax,
            discount: 0,
            totalPrice: subtotal + shippingFee + tax,
          },
        ],
        { session },
      );
      // Preserve any cart items added concurrently or not included in this order.
      for (const item of items) {
        await Cart.updateOne(
          { user: userId },
          {
            $pull: {
              items: {
                product: item.product,
                sku: item.sku,
                quantity: item.quantity,
              },
            },
            $inc: { __v: 1 },
          },
          { session },
        );
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Order.findOne({
        user: userId,
        idempotencyKey: key,
      });
      if (duplicate) return replay(duplicate);
    }
    throw error;
  }
  return result;
};
const getOrderDetails = async (userId, code) => {
  const order = await Order.findOne({ ...findOrder(code), user: userId });
  if (!order) throw fail(404, "Không tìm thấy đơn hàng");
  return order;
};
const restoreStock = async (order, session) => {
  for (const item of order.items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) throw fail(409, "Không thể hoàn kho cho sản phẩm đã bị xóa");
    const changes = { stock: item.quantity, soldCount: -item.quantity, __v: 1 };
    const filter = { _id: item.product };
    if (product.variants.length) {
      if (!product.variants.some((v) => v.sku === item.sku))
        throw fail(409, "Phiên bản sản phẩm đã thay đổi");
      filter["variants.sku"] = item.sku;
      changes["variants.$.stock"] = item.quantity;
    }
    await Product.updateOne(filter, { $inc: changes }, { session });
  }
};
const changeStatus = async (id, status, userId, reason = "") => {
  requireId(id);
  let result;
  await mongoose.connection.transaction(async (session) => {
    const order = await Order.findOne({
      _id: id,
      ...(userId ? { user: userId } : {}),
    }).session(session);
    if (!order) throw fail(404, "Không tìm thấy đơn hàng");
    if (userId && status !== "cancelled")
      throw fail(403, "Không được thay đổi trạng thái");
    if (order.orderStatus === status) {
      result = order;
      return;
    }
    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    if (
      !transitions[order.orderStatus]?.includes(status) ||
      (userId && order.orderStatus !== "pending")
    )
      throw fail(409, "Không thể chuyển trạng thái đơn hàng");
    if (status === "cancelled") {
      if (typeof reason !== "string" || !reason.trim())
        throw fail(400, "Vui lòng nhập lý do hủy");
      await restoreStock(order, session);
      order.cancelReason = reason;
      order.cancelledAt = new Date();
    }
    if (status === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    }
    order.orderStatus = status;
    result = await order.save({ session });
  });
  return result;
};
module.exports = {
  createOrder,
  getMyOrders: (userId, query) => pageOrders({ user: userId }, query),
  getOrderDetails,
  cancelOrder: (userId, id, reason) =>
    changeStatus(id, "cancelled", userId, reason),
  getAllOrders: (query) =>
    pageOrders(
      {
        ...(query.orderStatus ? { orderStatus: query.orderStatus } : {}),
        ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      },
      query,
    ),
  getOrderDetailsAdmin: async (id) => {
    const order = await Order.findById(requireId(id));
    if (!order) throw fail(404, "Không tìm thấy đơn hàng");
    return order;
  },
  updateOrderStatusAdmin: (id, status, reason) =>
    changeStatus(id, status, null, reason),
};

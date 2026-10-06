const Order = require("../models/Orders");

// user-----------------------------

// tạo đơn hàng
const createOrder = async (orderData) => {
  return await Order.create(orderData);
};

//lấy danh sách đơn hàng của người dùng
const getOrdersByUserId = async (userId) => {
  return await Order.find({ user: userId }).populate("items.product");
};

// đếm số lượng đơn hàng của người dùng
const countOrdersByUserId = async (userId) => {
  return await Order.countDocuments({ user: userId });
};

// lấy chi tiết đơn hàng của người dùng
const getOrderById = async (userId, orderId) => {
  return await Order.findById({ user: userId }, orderId).populate(
    "items.product",
  );
};

// cập nhật trạng thái đơn hàng của người dùng
const updateOrderByUser = async (userId, orderId, status) => {
  return await Order.findByIdAndUpdate(
    { user: userId },
    orderId,
    { status: "pendding" },
    { new: true },
  );
};

//-------------------------------------
//admin

// lấy danh sách tất cả đơn hàng
const getAllOrders = async (filter, skip, limit, sort) => {
  return Order.find(filter)
    .populate("user", "email")
    .skip(skip)
    .limit(limit)
    .sort(sort);
};

// đếm số lượng đơn hàng
const countOrders = async (filter) => {
  return await Order.countDocuments(filter);
};

// lấy chi tiết đơn hàng theo id (admin)
const getOrderByIdAdmin = async (orderId) => {
  return await Order.findById(orderId)
    .populate("user", "email")
    .populate("items.product");
};

// cập nhật trạng thái đơn hàng (admin)
const updateOrderByAdmin = async (orderId, status) => {
  return await Order.findByIdAndUpdate(orderId, { status }, { new: true });
};

// xóa đơn hàng (admin)
const deleteOrderByAdmin = async (orderId) => {
  return await Order.findByIdAndDelete(orderId);
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  countOrdersByUserId,
  getOrderById,
  updateOrderByUser,
  getAllOrders,
  countOrders,
  getOrderByIdAdmin,
  updateOrderByAdmin,
  deleteOrderByAdmin,
};

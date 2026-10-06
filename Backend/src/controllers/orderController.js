const orderService = require("../services/orderService");

// tạo đơn hàng
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;
    const order = await orderService.createOrder(userId, orderData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// lấy đơn hàng của người dùng
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await orderService.getMyOrders(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderCode = req.params.orderCode; // VD: /api/orders/my-orders/DH-A7B2C9

    const order = await orderService.getMyOrderDetails(userId, orderCode);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Hàm để xóa đơn hàng
const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id; // ID của đơn hàng
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp lý do hủy đơn!" });
    }

    const updatedOrder = await orderService.cancelMyOrder(
      userId,
      orderId,
      cancelReason,
    );

    res.status(200).json({
      success: true,
      message: "Đã hủy đơn hàng thành công!",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// admin

// lấy toàn bộ đơn hàng
const getAllOrdersAdmin = async (req, res) => {
  try {
    // Đẩy toàn bộ query string (page, limit, status...) sang service xử lý
    const result = await orderService.getAllOrdersAdmin(req.query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Admin xem chi tiết 1 đơn hàng theo ID
const getOrderDetailsAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderService.getOrderDetailsAdmin(orderId);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

//  Admin cập nhật trạng thái đơn hàng
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp trạng thái mới!" });
    }

    const updatedOrder = await orderService.updateOrderStatusAdmin(
      orderId,
      orderStatus,
    );

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng thành: ${orderStatus}`,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderDetails,
  cancelMyOrder,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
};

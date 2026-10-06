const orderRepository = require("../repositories/orderRepository");

// hàm tự động sinh mã
const generateOrderCode = async () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${randomStr}`;
};

const createOrder = async (orderData) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    shippingFee = 30000,
    discount = 0,
    couponCode,
  } = orderData;

  if (!items || items.length === 0) {
    throw new Error("Đơn hàng phải có ít nhất 1 sản phẩm");
  }

  // 1. Backend TỰ TÍNH TOÁN LẠI tiền để chống gian lận (Hack giá từ Frontend)
  let calculatedSubtotal = 0;
  const processedItems = items.map((item) => {
    const itemSubtotal = item.price * item.quantity;
    calculatedSubtotal += itemSubtotal;
    return {
      ...item,
      subtotal: itemSubtotal, // Ghi đè subtotal chuẩn vào từng item
    };
  });

  const calculatedTotalPrice = calculatedSubtotal + shippingFee - discount;

  // 2. Tạo object đơn hàng hoàn chỉnh khớp với Schema
  const newOrderPayload = {
    orderCode: generateOrderCode(),
    user: userId,
    items: processedItems,
    shippingAddress,
    subtotal: calculatedSubtotal,
    shippingFee,
    discount,
    couponCode,
    totalPrice: calculatedTotalPrice,
    paymentMethod,
    paymentStatus: "pending", // Mặc định chưa thanh toán
    orderStatus: "pending", // Mặc định chờ xác nhận
  };

  // 3. Gọi Repository để lưu vào Database
  const savedOrder = await orderRepository.createOrder(newOrderPayload);

  // TODO: (Tùy chọn) Nếu mua từ giỏ hàng, bạn có thể gọi hàm clearCart ở đây

  return savedOrder;
};

const getMyOrders = async (query) => {
  const { userId, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    orderRepository.getOrderbyId(userId, skip, limit),
    orderRepository.countOrdersByUserId(userId),
  ]);

  return {
    data: orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getOrderDetails = async (userId, orderId) => {
  const order = await orderRepository.getOrderById(userId, orderId);
  if (!order) {
    throw new Error(
      "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.",
    );
  }
  return order;
};

const cancelOrder = async (userId, orderId, cancelReason) => {
  const updatedOrder = {
    orderStatus: "canceled",
    cancelReason,
    canceledAt: new Date(),
  };
  const updated = await orderRepository.updateOrderByUser(
    userId,
    orderId,
    updatedOrder,
  );
  if (!updated) {
    throw new Error(
      "Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn hàng này.",
    );
  }
  return updated;
};

// Admin services
const getAllOrders = async (query) => {
  const { page = 1, limit = 10, status, paymentStatus, sort = "desc" } = query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (orderStatus) {
    filter.status = orderStatus;
  }
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }
  const sortOptions = {};
  if (sortBy && sortOrder) {
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  const [orders, total] = await Promise.all([
    orderRepository.getAllOrders(filter, skip, limit, sortOptions),
    orderRepository.countOrders(filter),
  ]);
  return {
    data: orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getOrderDetailsAdmin = async (orderId) => {
  const order = await orderRepository.getOrderByIdAdmin(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng.");
  }
  return order;
};
const updateOrderStatusAdmin = async (orderId, newStatus) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "shipping",
    "delivered",
    "cancelled",
    "returned",
  ];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Trạng thái đơn hàng không hợp lệ");
  }

  const order = await orderRepository.updateByIdForAdmin(orderId, {
    orderStatus: newStatus,
  });
  if (!order) throw new Error("Cập nhật thất bại, không tìm thấy đơn hàng");

  return order;
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrders,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
};

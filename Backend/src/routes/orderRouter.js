const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// ==========================================
// USER ROUTES (Đường dẫn gốc: /api/orders)
// ==========================================

// Tạo đơn hàng mới
// Gọi qua: POST /api/orders
router.post("/", authMiddleware.verifyToken, orderController.createOrder);

// Xem lịch sử đơn hàng của mình
// Gọi qua: GET /api/orders/my-orders
router.get(
  "/my-orders",
  authMiddleware.verifyToken,
  orderController.getMyOrders,
);

// Xem chi tiết 1 đơn hàng (Bằng orderCode)
// Gọi qua: GET /api/orders/my-orders/DH-123456
router.get(
  "/my-orders/:orderCode",
  authMiddleware.verifyToken,
  orderController.getMyOrderDetails,
);

// Khách hàng chủ động hủy đơn
// Gọi qua: PUT /api/orders/my-orders/:id/cancel
router.put(
  "/my-orders/:id/cancel",
  authMiddleware.verifyToken,
  orderController.cancelMyOrder,
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Admin xem toàn bộ đơn hàng
// Gọi qua: GET /api/orders/admin
router.get(
  "/admin",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  orderController.getAllOrdersAdmin,
);

router.get(
  "/admin/stats",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  orderController.stats,
);

// Admin xem chi tiết 1 đơn hàng (Bằng ID MongoDB)
// Gọi qua: GET /api/orders/admin/:id
router.get(
  "/admin/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  orderController.getOrderDetailsAdmin,
);

// Admin cập nhật trạng thái đơn (Duyệt, Đang giao...)
// Gọi qua: PUT /api/orders/admin/:id/status
router.put(
  "/admin/:id/status",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  orderController.updateOrderStatusAdmin,
);

module.exports = router;

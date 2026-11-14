const service = require("../services/orderService");
const { handle } = require("../utils/http");
const result = (res, data) => res.json({ success: true, data });
module.exports = {
  stats: handle(async (req, res) =>
    res.json(await require("../services/dashboardService")()),
  ),
  createOrder: handle(async (req, res) =>
    res.status(201).json({
      success: true,
      data: await service.createOrder(
        req.user.id,
        req.body,
        req.get("Idempotency-Key"),
      ),
    }),
  ),
  getMyOrders: handle(async (req, res) =>
    res.json(await service.getMyOrders(req.user.id, req.query)),
  ),
  getMyOrderDetails: handle(async (req, res) =>
    result(
      res,
      await service.getOrderDetails(req.user.id, req.params.orderCode),
    ),
  ),
  cancelMyOrder: handle(async (req, res) =>
    result(
      res,
      await service.cancelOrder(
        req.user.id,
        req.params.id,
        req.body.cancelReason,
      ),
    ),
  ),
  getAllOrdersAdmin: handle(async (req, res) =>
    res.json(await service.getAllOrders(req.query)),
  ),
  getOrderDetailsAdmin: handle(async (req, res) =>
    result(res, await service.getOrderDetailsAdmin(req.params.id)),
  ),
  updateOrderStatusAdmin: handle(async (req, res) =>
    result(
      res,
      await service.updateOrderStatusAdmin(
        req.params.id,
        req.body.orderStatus,
        req.body.cancelReason,
      ),
    ),
  ),
};

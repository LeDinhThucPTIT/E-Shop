const service = require("../services/cartService");
const { handle } = require("../utils/http");
const result = (res, data) => res.json({ success: true, data });
module.exports = {
  getCartUser: handle(async (req, res) =>
    result(res, await service.getCartUser(req.user.id)),
  ),
  addToCart: handle(async (req, res) =>
    result(
      res,
      await service.addToCart(
        req.user.id,
        req.body.product,
        req.body.sku,
        req.body.quantity,
      ),
    ),
  ),
  updateCart: handle(async (req, res) =>
    result(
      res,
      await service.updateCart(
        req.user.id,
        req.body.product,
        req.body.sku,
        req.body.quantity,
      ),
    ),
  ),
  deleteCart: handle(async (req, res) =>
    result(
      res,
      await service.removeItem(
        req.user.id,
        req.params.productId,
        req.query.sku,
      ),
    ),
  ),
  deleteAllCarts: handle(async (req, res) =>
    result(res, await service.clearCart(req.user.id)),
  ),
};

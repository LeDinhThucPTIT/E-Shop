const router = require("express").Router();
const controller = require("../controllers/cartController");
router.use(require("../middlewares/authMiddleware").verifyToken);
router.get("/", controller.getCartUser);
router.post("/", controller.addToCart);
router.put("/", controller.updateCart);
router.delete("/", controller.deleteAllCarts);
router.delete("/:productId", controller.deleteCart);
module.exports = router;

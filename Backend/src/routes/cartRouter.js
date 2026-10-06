const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", cartController.getCartUser);
router.post("/", authMiddleware.verifyToken, cartController.addToCart);
router.put("/:id", authMiddleware.verifyToken, cartController.updateCart);
router.delete("/:id", authMiddleware.verifyToken, cartController.deleteCart);
module.exports = router;

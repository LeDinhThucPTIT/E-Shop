const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", productController.getAllProducts);
router.get(
  "/admin/all",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  productController.getAllProductsAdmin,
);
router.get("/:id/reviews", productController.getReviews);
router.post("/:id/reviews", authMiddleware.verifyToken, productController.createReview);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  productController.updateProduct,
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  productController.deleteProduct,
);

module.exports = router;

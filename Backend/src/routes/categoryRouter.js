const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
router.get("/", categoryController.getAllCategories);
router.get("/:categoryId", categoryController.getCategoryById);
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  categoryController.createCategory,
);
router.put(
  "/:categoryId",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  categoryController.updateCategory,
);
router.delete(
  "/:categoryId",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  categoryController.deleteCategory,
);

module.exports = router;

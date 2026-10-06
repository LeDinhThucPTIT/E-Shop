const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", brandController.getAllBrands);
router.get("/:brandId", brandController.getBrandById);
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  brandController.createBrand,
);
router.put(
  "/:brandId",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  brandController.updateBrand,
);
router.delete(
  "/:brandId",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  brandController.deleteBrand,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.getAllUsers,
);
router.get(
  "/count",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.countUsers,
);
router.get("/:id", authMiddleware.verifyToken, userController.getUserById);
router.put("/:id", authMiddleware.verifyToken, userController.updateUser);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.deleteUser,
);

router.post("/login", userController.loginUser);
router.post("/register", userController.registerUser);

module.exports = router;

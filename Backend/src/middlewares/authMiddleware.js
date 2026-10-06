const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập hoặc không có quyền truy cập!",
      });
    }

    const token = authHeader.split(" ")[1];
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // gan thông tin người dùng vào req.user
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn!",
      });
    }

    // kiểm tra admin
  },
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền truy cập!" });
    }
  },
};
module.exports = authMiddleware;

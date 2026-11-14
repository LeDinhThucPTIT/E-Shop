const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const { fail } = require("../utils/http");
const verifyToken = (req, res, next) =>
  Promise.resolve()
    .then(async () => {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw fail(401, "Vui lòng đăng nhập");
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        throw fail(401, "Phiên đăng nhập đã hết hạn");
      }
      const user = await User.findById(decoded.id).select("-password");
      if (!user?.isActive) throw fail(401, "Tài khoản không khả dụng");
      req.user = { id: String(user._id), role: user.role };
      next();
    })
    .catch(next);
const isAdmin = (req, res, next) =>
  req.user?.role === "admin"
    ? next()
    : next(fail(403, "Bạn không có quyền truy cập"));
module.exports = { verifyToken, isAdmin };

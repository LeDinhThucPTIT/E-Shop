const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./src/config/db.config");

const app = express();

// Middleware cơ bản
app.use(cors());
app.use(express.json()); // Xử lý dữ liệu JSON gửi từ Frontend

// Kích hoạt kết nối Database
connectDB();

// Định nghĩa các route
const apiRouter = require("./src/routes/index");
app.use("/api", apiRouter);

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

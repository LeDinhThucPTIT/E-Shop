# NEURALSTORE Frontend

React + TypeScript + Vite + Tailwind + Zustand. Frontend sử dụng backend Express/MongoDB cho xác thực, danh mục, sản phẩm, giỏ hàng, checkout COD, đơn hàng và quản trị.

Xem [hướng dẫn tại thư mục gốc](../README.md) để cấu hình MongoDB replica set, biến môi trường, tài khoản quản trị và hợp đồng API.

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

`VITE_API_BASE_URL` mặc định là `http://localhost:5000/api`. Các service chuẩn hóa MongoDB DTO sang dữ liệu giao diện; store không dùng dữ liệu demo để tạo giỏ hàng hoặc đơn hàng.

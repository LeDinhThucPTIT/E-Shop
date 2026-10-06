// src/services/axiosClient.ts
import axios from "axios";

// Khởi tạo axios instance
const axiosClient = axios.create({
  // Sử dụng biến môi trường của Vite
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho Request (Chạy trước khi gửi API lên server)
axiosClient.interceptors.request.use(
  (config) => {
    // Ví dụ: Lấy token từ localStorage và đính kèm vào header để xác thực
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor cho Response (Chạy trước khi trả dữ liệu về component)
axiosClient.interceptors.response.use(
  (response) => {
    // Nếu backend  luôn bọc data trong response.data,
    //  có thể return thẳng response.data ở đây để component code gọn hơn.
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi chung toàn hệ thống ở đây (VD: Token hết hạn (401) thì tự động logout)
    if (error.response?.status === 401) {
      console.log("Token hết hạn, vui lòng đăng nhập lại!");
      // Code xử lý logout, clear localStorage...
    }
    return Promise.reject(error);
  },
);

export default axiosClient;

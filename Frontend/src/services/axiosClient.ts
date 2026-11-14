import axios from "axios";
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
});
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization ===
        `Bearer ${localStorage.getItem("access_token")}` &&
      !/\/users\/(login|register)$/.test(error.config?.url || "")
    ) {
      localStorage.removeItem("access_token");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message ||
      "Không thể kết nối máy chủ. Vui lòng thử lại."
    : error instanceof Error
      ? error.message
      : "Đã xảy ra lỗi";
export default axiosClient;

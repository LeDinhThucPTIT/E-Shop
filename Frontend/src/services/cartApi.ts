import axiosClient from "./axiosClient";
import type { Cart } from "../types";

// (Tùy chọn) Bạn có thể bỏ CartQueryParams đi vì Giỏ hàng thường không cần tìm kiếm hay phân trang

export const cartApi = {
  // Lấy giỏ hàng: GET /api/cart
  getCart: (): Promise<any> => {
    return axiosClient.get("/cart");
  },

  // Thêm vào giỏ: POST /api/cart/add
  // data gồm: { product: string, sku: string, quantity: number }
  addToCart: (data: any): Promise<any> => {
    return axiosClient.post("/cart/add", data); // Sửa lại URL
  },

  // Cập nhật số lượng: PUT /api/cart/update
  updateQuantity: (data: any): Promise<any> => {
    return axiosClient.put("/cart/update", data); // Sửa lại URL
  },

  // Xóa 1 sản phẩm: DELETE /api/cart/remove
  removeItem: (productId: string, sku: string): Promise<any> => {
    return axiosClient.delete(`/cart/remove?product=${productId}&sku=${sku}`); // Sửa lại URL
  },

  // Xóa toàn bộ giỏ hàng trên Server (API mới thêm ở bài trước)
  clearCart: (): Promise<any> => {
    return axiosClient.delete("/cart/clear");
  },

  // Dọn dẹp LocalStorage (Chỉ dùng ở Frontend)
  clearCartLocal: (): void => {
    localStorage.removeItem("cart");
  },
};

import { create } from "zustand";
import cartApi from "../services/cartApi";

// 1. Cập nhật lại Type khớp với dữ liệu từ MongoDB (đã populate)
export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
  };
  sku: string;
  quantity: number;
  _id?: string;
}

// 2. Định nghĩa bản hợp đồng (Interface) cho Store
interface CartState {
  items: CartItem[];
  isLoading: boolean;

  // Các action tương tác với API
  fetchCart: () => Promise<void>;
  addItem: (productId: string, sku: string, quantity?: number) => Promise<void>;
  updateQuantity: (
    productId: string,
    sku: string,
    quantity: number,
  ) => Promise<void>;
  removeItem: (productId: string, sku: string) => Promise<void>;
  clearCartLocal: () => void;
  clearCart: () => Promise<void>;

  // Các hàm tính toán nhanh cho UI
  subtotal: () => number;
  totalItems: () => number;
}

// 3. Khởi tạo Zustand Store
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  // Lấy toàn bộ giỏ hàng từ Database
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await cartApi.getCart();
      // Đảm bảo an toàn nếu giỏ hàng trống (chưa có)
      set({ items: response.data?.items || [], isLoading: false });
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
      set({ isLoading: false });
    }
  },

  // Thêm sản phẩm vào giỏ
  addItem: async (productId, sku, quantity = 1) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.addToCart({
        product: productId,
        sku,
        quantity,
      });
      set({ items: response.data?.items || [], isLoading: false });
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ:", error);
      set({ isLoading: false });
    }
  },

  // Tăng/giảm số lượng
  updateQuantity: async (productId, sku, quantity) => {
    // Nếu giảm về 0 thì gọi luôn hàm xóa
    if (quantity <= 0) {
      return get().removeItem(productId, sku);
    }

    try {
      const response = await cartApi.updateQuantity({
        product: productId,
        sku,
        quantity,
      });
      set({ items: response.data?.items || [] });
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  },

  // Xóa 1 biến thể sản phẩm
  removeItem: async (productId, sku) => {
    try {
      const response = await cartApi.removeItem(productId, sku);
      set({ items: response.data?.items || [] });
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
    }
  },
  // Xóa toàn bộ giỏ hàng trên Server (API mới thêm ở bài trước)
  clearCart: async () => {
    try {
      const response = await cartApi.clearCart();
      set({ items: response.data?.items || [] });
    } catch (error) {
      console.error("Lỗi khi xóa toàn bộ giỏ hàng:", error);
    }
  },

  // Chỉ dùng hàm này để dọn dẹp bộ nhớ UI khi người dùng bấm Đăng xuất
  clearCartLocal: () => set({ items: [] }),

  // Tính tổng số lượng hiển thị trên icon giỏ hàng (Góc phải màn hình)
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  // Tính tổng tiền hiển thị (Dựa vào giá tiền chuẩn xác từ Backend gửi về)
  subtotal: () =>
    get().items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0),
}));

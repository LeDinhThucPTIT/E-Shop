export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "vnpay" | "momo" | "bank-transfer";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  done: boolean;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingMethod: "standard" | "express";
  address: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  createdAt: string;
  estimatedDelivery: string;
  timeline: OrderTimelineEvent[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  recommendedProducts?: string[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
}
//=======================================================================================================================================
// Đã sửa
export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: String;
  description: String;
  image: String;
  isActive: Boolean;
  createdAt: String;
  updatedAt: String;
}

export interface ProductSpec {
  _id?: string; // Mongoose tự sinh _id cho các item trong mảng
  name: string;
  value: string;
}

export interface ProductVariant {
  _id?: string;
  sku?: string;
  color?: string;
  storage?: string;
  price?: number;
  stock?: number;
  image?: string;
}

export interface Product {
  _id: string; // Mongoose mặc định dùng _id thay vì id
  id?: string;
  name: string;
  slug?: string;
  sku?: string;
  description?: string;

  price?: number;
  discountPrice?: number;
  originalPrice?: number;
  discount?: number;
  stock?: number;

  images?: string[];
  thumbnail?: string;

  // LƯU Ý TRỌNG TÂM: Khai báo linh hoạt cho brand và category
  category?: string | Category;
  brand?: string | Brand;

  specifications?: ProductSpec[];
  variants?: ProductVariant[];

  warranty?: number;
  tags?: string[];

  rating?: number;
  reviewCount?: number;
  soldCount?: number;

  featured?: boolean;
  trending?: boolean;
  isActive?: boolean;

  // Do bạn có dùng { timestamps: true } trong Mongoose
  createdAt?: string;
  updatedAt?: string;
}

// Interface cho từng item trong giỏ hàng
export interface CartItem {
  _id?: string; // Mongoose tự sinh ID cho sub-document trong mảng items
  product: string; // ObjectId dưới dạng string (hoặc IProduct nếu đã populate)
  sku: string;
  quantity: number;
}

// Interface đầy đủ cho Giỏ hàng
export interface Cart {
  _id: string;
  user: string; // ObjectId dưới dạng string (hoặc IUser nếu đã populate)
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

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
  "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

export type PaymentMethod = "cod" | "vnpay" | "momo" | "bank-transfer";

export interface OrderItem {
  productId: string;
  sku: string;
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
  _id: string;
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentExpiresAt?: string;
  paymentNeedsReview?: boolean;
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
  productSnapshots?: Product[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  isActive?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
}
export interface Category {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  productCount?: number;
  sortOrder?: number;
  isActive?: boolean;
}
export interface ProductSpec {
  _id?: string;
  name: string;
  label: string;
  value: string;
}
export interface ProductVariant {
  sku: string;
  color?: string;
  storage?: string;
  price: number;
  stock: number;
  image?: string;
}
export interface Product {
  version: number;
  _id: string;
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  basePrice: number;
  discountPrice?: number | null;
  originalPrice?: number;
  discount: number;
  stock: number;
  images: string[];
  thumbnail?: string;
  category: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  brandId: string;
  specifications: ProductSpec[];
  variants: ProductVariant[];
  warranty: number;
  warrantyMonths: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  featured: boolean;
  trending: boolean;
  isActive: boolean;
}
export interface CartItem {
  _id?: string;
  product: Product | null;
  sku: string;
  quantity: number;
}
export interface Cart {
  items: CartItem[];
}

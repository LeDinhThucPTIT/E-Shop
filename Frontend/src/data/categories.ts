import type { Category } from "../types";

export const categories: Category[] = [
  { id: "cat-laptop", name: "Laptop", slug: "laptop", icon: "Laptop", productCount: 5 },
  { id: "cat-smartphone", name: "Smartphone", slug: "smartphone", icon: "Smartphone", productCount: 2 },
  { id: "cat-ai-hardware", name: "AI Hardware", slug: "ai-hardware", icon: "Cpu", productCount: 2 },
  { id: "cat-pc-components", name: "Linh kiện PC", slug: "pc-components", icon: "MemoryStick", productCount: 4 },
  { id: "cat-wearables", name: "Thiết bị đeo", slug: "smartwatch", icon: "Watch", productCount: 3 },
  { id: "cat-headphones", name: "Tai nghe", slug: "headphones", icon: "Headphones", productCount: 3 },
  { id: "cat-smart-home", name: "Nhà thông minh", slug: "smart-home", icon: "Home", productCount: 1 },
  { id: "cat-dev-gear", name: "Đồ nghề Dev", slug: "accessories", icon: "Keyboard", productCount: 3 },
];

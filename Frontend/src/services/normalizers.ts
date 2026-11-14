import type { Product, Category, Order, OrderStatus } from "../types";
// Raw Mongo documents are converted once at the API boundary.
export function normalizeProduct(raw: Record<string, any>): Product {
  const id = String(raw._id ?? raw.id ?? "");
  const price = raw.discountPrice ?? raw.price ?? 0;
  return {
    ...raw,
    version: raw.__v || 0,
    id,
    _id: id,
    slug: raw.slug || id,
    sku: raw.sku || id,
    name: raw.name || "",
    description: raw.description || "",
    shortDescription: raw.shortDescription || "",
    price,
    basePrice: raw.price ?? 0,
    originalPrice: raw.discountPrice != null ? raw.price : raw.originalPrice,
    discount:
      raw.price > price
        ? Math.round(((raw.price - price) / raw.price) * 100)
        : raw.discount || 0,
    images: raw.images?.length ? raw.images : [raw.thumbnail || "/favicon.svg"],
    brand:
      typeof raw.brand === "object" ? raw.brand?.name || "" : raw.brand || "",
    brandId:
      typeof raw.brand === "object" ? raw.brand?._id || "" : raw.brand || "",
    category:
      typeof raw.category === "object"
        ? raw.category?.slug || ""
        : raw.category || "",
    categoryId:
      typeof raw.category === "object"
        ? raw.category?._id || ""
        : raw.category || "",
    categoryName:
      typeof raw.category === "object"
        ? raw.category?.name || ""
        : raw.category || "",
    stock: raw.stock || 0,
    variants: raw.variants || [],
    specifications: (raw.specifications || []).map(
      (s: Record<string, string>) => ({
        name: s.name || s.label,
        label: s.name || s.label,
        value: s.value,
      }),
    ),
    tags: raw.tags || [],
    rating: raw.rating || 0,
    reviewCount: raw.reviewCount || 0,
    soldCount: raw.soldCount || 0,
    warranty: raw.warranty ?? raw.warrantyMonths ?? 0,
    warrantyMonths: raw.warranty ?? raw.warrantyMonths ?? 0,
    featured: !!raw.featured,
    trending: !!raw.trending,
    isActive: raw.isActive !== false,
  };
}
export const normalizeCategory = (raw: Record<string, any>): Category =>
  ({ ...raw, id: raw._id || raw.id, _id: raw._id || raw.id }) as Category;
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
};
export function normalizeOrder(raw: Record<string, any>): Order {
  const address = raw.shippingAddress || {};
  const statuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipping",
    "delivered",
  ];
  const status = raw.orderStatus as OrderStatus;
  const timelineStatuses =
    status === "cancelled"
      ? (["pending", "cancelled"] as OrderStatus[])
      : statuses;
  return {
    _id: raw._id,
    id: raw.orderCode,
    status,
    createdAt: raw.createdAt,
    items: raw.items.map((i: Record<string, any>) => ({
      productId: typeof i.product === "object" ? i.product._id : i.product,
      sku: i.sku,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: raw.subtotal,
    shipping: raw.shippingFee,
    discount: raw.discount,
    tax: raw.tax || 0,
    total: raw.totalPrice,
    paymentMethod: raw.paymentMethod,
    shippingMethod: raw.shippingMethod || "standard",
    address: {
      fullName: address.name,
      phone: address.phone,
      email: address.email || "",
      address: address.street,
      city: address.province,
      district: address.district,
      ward: address.ward,
    },
    estimatedDelivery: new Date(
      new Date(raw.createdAt).getTime() +
        (raw.shippingMethod === "express" ? 2 : 5) * 86400000,
    ).toISOString(),
    timeline: timelineStatuses.map((s, i) => ({
      status: s,
      label: STATUS_LABELS[s],
      timestamp: s === "cancelled" ? raw.cancelledAt : raw.createdAt,
      done: status === "cancelled" || i <= statuses.indexOf(status),
    })),
  };
}

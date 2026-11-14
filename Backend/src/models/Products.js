const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true }, // [MỚI] Mã quản lý kho tổng
    description: String,

    // Giá và tồn kho mặc định (dùng để hiển thị ngoài trang chủ)
    price: { type: Number, min: 0, required: true },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },

    images: [String],
    thumbnail: String, // [MỚI] Nên tách ảnh bìa riêng để load nhanh ở trang danh sách

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },

    // Hỗ trợ mọi loại thiết bị: { name: "Switch", value: "Cherry Red" }
    specifications: [
      {
        name: String,
        value: String,
      },
    ],

    // [MỚI] Quản lý biến thể (Variants)
    variants: [
      {
        sku: String, // Mã kho riêng cho biến thể này
        color: String, // VD: "Titan tự nhiên"
        storage: String, // VD: "256GB"
        price: { type: Number, min: 0, required: true }, // Giá riêng của phiên bản này
        stock: { type: Number, min: 0, default: 0 }, // Tồn kho riêng của phiên bản này
        image: String, // Ảnh riêng cho màu này
      },
    ],

    warranty: Number, // [MỚI] VD: "12 Tháng chính hãng"
    tags: [String], // [MỚI] VD: ["New", "Bán chạy", "Flash Sale"]

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false }, // [MỚI]
    trending: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

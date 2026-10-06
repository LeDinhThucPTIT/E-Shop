const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String, // Ví dụ: 'apple', 'samsung' dùng để query URL
      required: true,
      unique: true,
    },
    logo: {
      type: String, // URL ảnh logo
      default: "",
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true, // Để ẩn/hiện thương hiệu tạm thời
    },
  },
  { timestamps: true },
);

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
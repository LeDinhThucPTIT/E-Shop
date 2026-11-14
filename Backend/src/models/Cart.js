const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    // Mỗi user chỉ nên có 1 giỏ hàng duy nhất (unique: true)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        // Trỏ đến Sản phẩm gốc để lấy thông tin chung (Tên, Ảnh, Slug)
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // BẮT BUỘC: Mã phiên bản chi tiết khách đã chọn (VD: IP15-BLK-256)
        // Dựa vào SKU này để lấy đúng giá tiền và tồn kho của bản màu Đen 256GB
        sku: {
          type: String,
          required: true,
        },

        // Số lượng khách muốn mua
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  { timestamps: true, optimisticConcurrency: true },
); // Tự động tạo createdAt và updatedAt

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;

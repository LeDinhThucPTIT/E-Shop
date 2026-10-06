const mongoose = require("mongoose");

// 1. Schema cho từng sản phẩm trong đơn hàng (Tách ra cho dễ nhìn)
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, required: true }, // Mã phiên bản chi tiết (VD: IP15-256-BLK)
    variantName: { type: String, required: true }, // Tên phiên bản hiển thị (VD: "Màu Đen - 256GB")
    name: { type: String, required: true }, // Snapshot tên sản phẩm
    image: { type: String, required: true }, // Snapshot ảnh sản phẩm
    price: { type: Number, required: true }, // Giá BÁN tại thời điểm mua
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }, // price * quantity
  },
  { _id: false },
); // Không cần tạo _id thừa thãi cho từng item

// 2. Schema địa chỉ nhận hàng (Snapshot)
const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true }, // Đổi 'city' thành 'province' cho chuẩn hành chính VN
    notes: { type: String, default: "" }, // Ghi chú của khách (Giao giờ hành chính, gọi trước...)
  },
  { _id: false },
);

// 3. MAIN ORDER SCHEMA
const orderSchema = new mongoose.Schema(
  {
    // --- 1. ĐỊNH DANH ĐƠN HÀNG ---
    orderCode: { type: String, required: true, unique: true }, // Mã đơn hàng ngắn gọn để hiển thị cho khách (VD: #DH-9A8B7C)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- 2. THÔNG TIN SẢN PHẨM & ĐỊA CHỈ ---
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,

    // --- 3. TIỀN NONG (KẾ TOÁN) ---
    subtotal: { type: Number, required: true }, // Tổng tiền hàng chưa tính phí ship
    shippingFee: { type: Number, required: true }, // Phí vận chuyển
    discount: { type: Number, default: 0 }, // Số tiền được giảm
    couponCode: { type: String, default: null }, // Mã voucher đã dùng (nếu có)
    totalPrice: { type: Number, required: true }, // TỔNG TIỀN CUỐI CÙNG KHÁCH PHẢI TRẢ

    // --- 4. THANH TOÁN (PAYMENT) ---
    paymentMethod: {
      type: String,
      enum: ["cod", "vnpay", "momo", "zalopay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String }, // LƯU Ý: Mã giao dịch trả về từ VNPay/MoMo để sau này đối soát/hoàn tiền
    paidAt: { type: Date }, // Thời điểm thanh toán thành công

    // --- 5. VẬN CHUYỂN (SHIPPING) ---
    shippingProvider: { type: String }, // Đơn vị vận chuyển (VD: "GHTK", "Viettel Post")
    trackingNumber: { type: String }, // Mã vận đơn để khách tra cứu hành trình

    // --- 6. TRẠNG THÁI ĐƠN HÀNG (ORDER LIFECYCLE) ---
    orderStatus: {
      type: String,
      enum: [
        "pending", // Chờ xác nhận
        "confirmed", // Đã xác nhận, đang chuẩn bị hàng (processing)
        "shipping", // Đang giao hàng
        "delivered", // Giao thành công
        "cancelled", // Đã hủy
        "returned", // Khách hoàn trả hàng
      ],
      default: "pending",
    },

    // --- 7. HỦY/HOÀN ĐƠN ---
    cancelReason: { type: String }, // Lý do hủy đơn (Khách đổi ý, hết hàng, sai giá...)
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

// Tạo Index để search nhanh theo User và Mã đơn hàng
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderCode: 1 });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

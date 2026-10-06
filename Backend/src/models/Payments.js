const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPay", "MoMo", "ZaloPay", "CreditCard"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    transactionId: {
      type: String, // Mã giao dịch trả về từ VNPay, MoMo...
      default: null,
    },
    paymentGatewayResponse: {
      type: Object, // Lưu toàn bộ JSON response từ cổng thanh toán để đối soát khi có lỗi
      default: {},
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;

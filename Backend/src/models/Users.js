const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  province: { type: String, required: true }, // Tỉnh/Thành phố
  district: { type: String, required: true }, // Quận/Huyện
  ward: { type: String, required: true }, // Phường/Xã
  detailedAddress: { type: String, required: true }, // Số nhà, tên đường
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    address: [addressSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;

const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, default: "" },
    images: [String],
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Review", schema);

const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    icon: { type: String, default: "Laptop" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Category", schema);

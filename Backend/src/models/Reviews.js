const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  _id: ObjectId,

  user: ObjectId,

  product: ObjectId,

  rating: Number,

  comment: String,

  images: [String],

  createdAt: Date,

  updatedAt: Date,
});

const Review = mongoose.model("Review", orderSchema);
module.exports = Review;

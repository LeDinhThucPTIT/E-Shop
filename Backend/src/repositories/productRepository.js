const mongoose = require("mongoose");
const Product = require("../models/Products");

const getAllProducts = async (filter, skip, limit, sort) => {
  return await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .populate("category")
    .populate("brand");
};
const getProductById = async (productId) => {
  // 1. Tạo câu truy vấn (Chưa lấy dữ liệu vội)
  const query = mongoose.Types.ObjectId.isValid(productId)
    ? Product.findById(productId)
    : Product.findOne({ slug: productId });

  // 2. Gắn populate và chạy lấy dữ liệu cùng lúc
  const product = await query.populate("category").populate("brand");

  if (!product) return null;

  return product;
};

const createProduct = async (productData) => {
  return await Product.create(productData);
};

const updateProduct = async (productId, productData) => {
  return await Product.findByIdAndUpdate(productId, productData, { new: true });
};

const deleteProduct = async (productId) => {
  return await Product.findByIdAndDelete(productId);
};

const countProducts = async (filter) => {
  return await Product.countDocuments(filter);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  countProducts,
};

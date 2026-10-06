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
  return await Product.findById(productId)
    .populate("category")
    .populate("brand");
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

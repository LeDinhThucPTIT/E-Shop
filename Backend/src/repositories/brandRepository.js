const Brand = require("../models/Brands");

const getAllBrands = async () => {
  return await Brand.find();
};

const getBrandById = async (brandId) => {
  return await Brand.findById(brandId);
};

const createBrand = async (brandData) => {
  return await Brand.create(brandData);
};

const updateBrand = async (brandId, brandData) => {
  return await Brand.findByIdAndUpdate(brandId, brandData);
};

const deleteBrand = async (brandId) => {
  return await Brand.findByIdAndDelete(brandId);
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};

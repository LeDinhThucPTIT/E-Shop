const brandRepository = require("../repositories/brandRepository");

const getAllBrands = async () => {
  return await brandRepository.getAllBrands();
};

const getBrandById = async (brandId) => {
  return await brandRepository.getBrandById(brandId);
};

const createBrand = async (brandData) => {
  return await brandRepository.createBrand(brandData);
};

const updateBrand = async (brandId, brandData) => {
  return await brandRepository.updateBrand(brandId, brandData);
};

const deleteBrand = async (brandId) => {
  return await brandRepository.deleteBrand(brandId);
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};

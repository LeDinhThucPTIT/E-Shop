const categoryRepository = require("../repositories/categoryRepository");

const getAllCategories = async () => {
  return await categoryRepository.getAllCategories();
};

const getCategoryById = async (categoryId) => {
  return await categoryRepository.getCategoryById(categoryId);
};

const createCategory = async (categoryData) => {
  return await categoryRepository.createCategory(categoryData);
};

const updateCategory = async (categoryId, categoryData) => {
  return await categoryRepository.updateCategory(categoryId, categoryData);
};

const deleteCategory = async (categoryId) => {
  return await categoryRepository.deleteCategory(categoryId);
};
module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

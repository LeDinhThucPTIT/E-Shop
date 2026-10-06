const categoryService = require("../services/categoryService");

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving categories" });
  }
};

const getCategoryById = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const category = await categoryService.getCategoryById(categoryId);
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving category" });
  }
};

const createCategory = async (req, res) => {
  const categoryData = req.body;
  try {
    const newCategory = await categoryService.createCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: "Error creating category" });
  }
};

const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const categoryData = req.body;
  try {
    const updatedCategory = await categoryService.updateCategory(
      categoryId,
      categoryData,
    );
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: "Error updating category" });
  }
};

const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const deletedCategory = await categoryService.deleteCategory(categoryId);
    res.status(200).json(deletedCategory);
  } catch (error) {
    res.status(500).json({ error: "Error deleting category" });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

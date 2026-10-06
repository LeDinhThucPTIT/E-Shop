const brandService = require("../services/brandService");

const getAllBrands = async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving brands" });
  }
};

const getBrandById = async (req, res) => {
  const { brandId } = req.params;
  try {
    const brand = await brandService.getBrandById(brandId);
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving brand" });
  }
};

const createBrand = async (req, res) => {
  const brandData = req.body;
  try {
    const newBrand = await brandService.createBrand(brandData);
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ error: "Error creating brand" });
  }
};

const updateBrand = async (req, res) => {
  const { brandId } = req.params;
  const brandData = req.body;
  try {
    const updatedBrand = await brandService.updateBrand(brandId, brandData);
    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ error: "Error updating brand" });
  }
};

const deleteBrand = async (req, res) => {
  const { brandId } = req.params;
  try {
    const deletedBrand = await brandService.deleteBrand(brandId);
    res.status(200).json(deletedBrand);
  } catch (error) {
    res.status(500).json({ error: "Error deleting brand" });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};

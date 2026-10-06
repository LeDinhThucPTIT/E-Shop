const productRepository = require("../repositories/productRepository");

const getAllProducts = async (query) => {
  const {
    brand,
    category,
    minPrice,
    maxPrice,
    minRating,
    availability,
    search,
    page = 1,
    limit = 12,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (brand) {
    const brandIds = Array.isArray(brand) ? brand : String(brand).split(",");
    filter.brand = { $in: brandIds };
  }

  if (category) {
    const categoryIds = Array.isArray(category)
      ? category
      : String(category).split(",");
    filter.category = { $in: categoryIds };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  if (minRating !== undefined) {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  if (availability === "in-stock") {
    filter.stock = { $gt: 0 };
  } else if (availability === "out-of-stock") {
    filter.stock = { $eq: 0 };
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const sort = {};
  sort[sortBy] = order === "asc" ? 1 : -1; // 1 là tăng dần, -1 là giảm dần

  const result = await productRepository.getAllProducts(
    filter,
    skip,
    limitNumber,
    sort,
  );

  const totalItems = await productRepository.countProducts(filter);

  return {
    data: result,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limitNumber),
    },
  };
};
const getProductById = async (productId) => {
  return await productRepository.getProductById(productId);
};

const createProduct = async (productData) => {
  return await productRepository.createProduct(productData);
};

const updateProduct = async (productId, productData) => {
  return await productRepository.updateProduct(productId, productData);
};

const deleteProduct = async (productId) => {
  return await productRepository.deleteProduct(productId);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

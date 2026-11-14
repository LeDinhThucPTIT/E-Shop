const service = require("../services/productService");
const { handle } = require("../utils/http");
module.exports = {
  createReview: handle(async (req, res) => {
    const { createReview } = require("../services/reviewService");
    res.status(201).json(await createReview(req.params.id, req.user.id, req.body));
  }),
  getReviews: handle(async (req, res) => {
    const product = await service.getProductById(req.params.id);
    const { page, limit, skip } = require("../utils/http").pagination(
      req.query,
    );
    const Review = require("../models/Reviews");
    const [reviews, totalItems] = await Promise.all([
      Review.find({ product: product._id })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: product._id }),
    ]);
    res.json({
      data: reviews.map((r) => ({
        id: String(r._id),
        productId: String(product._id),
        author: r.user?.name || "Khách hàng",
        rating: r.rating,
        title: r.title,
        content: r.comment,
        date: r.createdAt,
        verified: r.verified,
        helpful: 0,
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  }),
  getAllProducts: handle(async (req, res) =>
    res.json(await service.getAllProducts(req.query)),
  ),
  getAllProductsAdmin: handle(async (req, res) =>
    res.json(await service.getAllProducts(req.query, true)),
  ),
  getProductById: handle(async (req, res) =>
    res.json(await service.getProductById(req.params.id)),
  ),
  createProduct: handle(async (req, res) =>
    res.status(201).json(await service.createProduct(req.body)),
  ),
  updateProduct: handle(async (req, res) =>
    res.json(await service.updateProduct(req.params.id, req.body)),
  ),
  deleteProduct: handle(async (req, res) =>
    res.json(await service.deleteProduct(req.params.id)),
  ),
};

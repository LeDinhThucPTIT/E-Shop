const Product = require("../models/Products");
const Model = require("../models/Categories");
const { handle, fail, requireId, pick } = require("../utils/http");
const fields = ["name", "slug", "description", "image", "icon", "isActive", "sortOrder"];
module.exports = {
  getAllCategories: handle(async (req, res) => {
    const [categories, counts] = await Promise.all([
      Model.find({
        ...(req.query.isActive !== undefined
          ? { isActive: req.query.isActive === "true" }
          : {}),
      }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);
    const byCategory = new Map(counts.map((row) => [String(row._id), row.count]));
    res.json(categories.map((category) => ({
      ...category,
      productCount: byCategory.get(String(category._id)) || 0,
    })));
  }),
  getCategoryById: handle(async (req, res) => {
    const item = await Model.findById(requireId(req.params.categoryId));
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
  createCategory: handle(async (req, res) =>
    res.status(201).json(await Model.create(pick(req.body, fields))),
  ),
  updateCategory: handle(async (req, res) => {
    const item = await Model.findByIdAndUpdate(
      requireId(req.params.categoryId),
      pick(req.body, fields),
      { returnDocument: "after", runValidators: true },
    );
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
  deleteCategory: handle(async (req, res) => {
    const item = await Model.findByIdAndUpdate(
      requireId(req.params.categoryId),
      { isActive: false },
      { returnDocument: "after" },
    );
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
};

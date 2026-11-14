const Model = require("../models/Categories");
const { handle, fail, requireId, pick } = require("../utils/http");
const fields = ["name", "slug", "description", "image", "icon", "isActive"];
module.exports = {
  getAllCategories: handle(async (req, res) =>
    res.json(
      await Model.find({
        ...(req.query.isActive !== undefined
          ? { isActive: req.query.isActive === "true" }
          : {}),
      }).sort({ name: 1 }),
    ),
  ),
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

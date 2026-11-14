const Model = require("../models/Brands");
const { handle, fail, requireId, pick } = require("../utils/http");
const fields = ["name", "slug", "description", "logo", "isActive"];
module.exports = {
  getAllBrands: handle(async (req, res) =>
    res.json(
      await Model.find({
        ...(req.query.isActive !== undefined
          ? { isActive: req.query.isActive === "true" }
          : {}),
      }).sort({ name: 1 }),
    ),
  ),
  getBrandById: handle(async (req, res) => {
    const item = await Model.findById(requireId(req.params.brandId));
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
  createBrand: handle(async (req, res) =>
    res.status(201).json(await Model.create(pick(req.body, fields))),
  ),
  updateBrand: handle(async (req, res) => {
    const item = await Model.findByIdAndUpdate(
      requireId(req.params.brandId),
      pick(req.body, fields),
      { returnDocument: "after", runValidators: true },
    );
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
  deleteBrand: handle(async (req, res) => {
    const item = await Model.findByIdAndUpdate(
      requireId(req.params.brandId),
      { isActive: false },
      { returnDocument: "after" },
    );
    if (!item) throw fail(404, "Không tìm thấy dữ liệu");
    res.json(item);
  }),
};

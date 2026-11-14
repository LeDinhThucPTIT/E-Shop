const Product = require("../models/Products");
const Category = require("../models/Categories");
const Brand = require("../models/Brands");
const Order = require("../models/Orders");
const mongoose = require("mongoose");
const {
  fail,
  requireId,
  pagination,
  escapeRegex,
  pick,
} = require("../utils/http");
const fields = [
  "name",
  "slug",
  "sku",
  "description",
  "price",
  "discountPrice",
  "stock",
  "images",
  "thumbnail",
  "category",
  "brand",
  "specifications",
  "variants",
  "warranty",
  "tags",
  "featured",
  "trending",
  "isActive",
];
const validate = async (data) => {
  for (const field of ["price", "discountPrice", "stock", "warranty"])
    if (
      data[field] != null &&
      (!Number.isSafeInteger(data[field]) || data[field] < 0)
    )
      throw fail(400, `${field} phải là số nguyên không âm`);
  for (const [field, Model] of [
    ["category", Category],
    ["brand", Brand],
  ])
    if (data[field] && !(await Model.exists({ _id: requireId(data[field]) })))
      throw fail(400, `${field} không tồn tại`);
  if (data.variants !== undefined) {
    if (!Array.isArray(data.variants))
      throw fail(400, "Danh sách phiên bản không hợp lệ");
    const skus = new Set();
    for (const v of data.variants) {
      if (
        typeof v.sku !== "string" ||
        !v.sku.trim() ||
        skus.has(v.sku) ||
        !Number.isSafeInteger(v.price) ||
        v.price < 0 ||
        !Number.isSafeInteger(v.stock) ||
        v.stock < 0
      )
        throw fail(400, "SKU, giá hoặc tồn kho phiên bản không hợp lệ");
      skus.add(v.sku);
    }
    if (data.variants.length)
      data.stock = data.variants.reduce((sum, v) => sum + v.stock, 0);
  }
};
const getAllProducts = async (query = {}, admin = false) => {
  const { page, limit, skip } = pagination(query);
  const filter = admin ? {} : { isActive: true };
  for (const key of ["brand", "category", "ids"])
    if (query[key]) {
      const ids = String(query[key]).split(",");
      ids.forEach(requireId);
      filter[key === "ids" ? "_id" : key] = { $in: ids };
    }
  if (query.search)
    filter.name = { $regex: escapeRegex(query.search), $options: "i" };
  for (const [field, key, op] of [
    ["price", "minPrice", "$gte"],
    ["price", "maxPrice", "$lte"],
    ["rating", "minRating", "$gte"],
  ]) {
    if (query[key] !== undefined) {
      const n = Number(query[key]);
      if (!Number.isFinite(n) || n < 0) throw fail(400, `${key} không hợp lệ`);
      filter[field] = { ...filter[field], [op]: n };
    }
  }
  if (query.availability === "in-stock") filter.stock = { $gt: 0 };
  if (query.availability === "out-of-stock") filter.stock = 0;
  const sortBy = [
    "createdAt",
    "name",
    "price",
    "rating",
    "featured",
    "trending",
    "discountPrice",
    "soldCount",
  ].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const [data, totalItems] = await Promise.all([
    Product.find(filter)
      .populate("category brand")
      .sort({ [sortBy]: query.order === "asc" ? 1 : -1, _id: 1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
const getProductById = async (id, admin = false) => {
  const product = await Product.findOne({
    ...(mongoose.isObjectIdOrHexString(id) ? { _id: id } : { slug: id }),
    ...(!admin ? { isActive: true } : {}),
  }).populate("category brand");
  if (!product) throw fail(404, "Không tìm thấy sản phẩm");
  return product;
};
const createProduct = async (input) => {
  const data = pick(input, fields);
  await validate(data);
  const product = await Product.create(data);
  return getProductById(String(product._id), true);
};
const updateProduct = async (id, input) => {
  const data = pick(input, fields);
  const existing = await Product.findById(requireId(id));
  if (!existing) throw fail(404, "Không tìm thấy sản phẩm");
  if (
    existing.variants.length &&
    data.stock !== undefined &&
    data.variants === undefined
  ) {
    if (data.stock !== existing.stock)
      throw fail(400, "Vui lòng cập nhật tồn kho theo từng SKU");
    delete data.stock;
  }
  if (
    (data.stock !== undefined || data.variants !== undefined) &&
    (!Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion !== existing.__v)
  )
    throw fail(
      409,
      "Sản phẩm vừa thay đổi. Vui lòng tải lại trước khi cập nhật tồn kho",
    );
  if (data.variants) {
    const removed = existing.variants
      .filter((v) => !data.variants.some((next) => next.sku === v.sku))
      .map((v) => v.sku);
    if (
      removed.length &&
      (await Order.exists({
        orderStatus: { $in: ["pending", "confirmed", "shipping"] },
        items: { $elemMatch: { product: id, sku: { $in: removed } } },
      }))
    )
      throw fail(409, "Không thể đổi SKU đang có trong đơn chưa hoàn tất");
  }
  await validate(data);
  const filter = {
    _id: id,
    ...(input.expectedVersion !== undefined
      ? { __v: input.expectedVersion }
      : {}),
  };
  const product = await Product.findOneAndUpdate(
    filter,
    { $set: data, $inc: { __v: 1 } },
    { returnDocument: "after", runValidators: true },
  ).populate("category brand");
  if (!product) throw fail(409, "Sản phẩm vừa thay đổi. Vui lòng tải lại");
  return product;
};
const deleteProduct = (id) => updateProduct(id, { isActive: false });
module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

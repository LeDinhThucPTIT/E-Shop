const mongoose = require("mongoose");

const fail = (status, message) => Object.assign(new Error(message), { status });
const requireId = (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) throw fail(400, "ID không hợp lệ");
  return id;
};
const pagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );
  return { page, limit, skip: (page - 1) * limit };
};
const escapeRegex = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pick = (data, fields) =>
  Object.fromEntries(
    fields
      .filter((key) => Object.hasOwn(data, key))
      .map((key) => [key, data[key]]),
  );
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  if (["ValidationError", "CastError"].includes(err.name)) status = 400;
  if (err.name === "VersionError" || err.code === 11000) status = 409;
  if (err.type === "entity.parse.failed") status = 400;
  if (status >= 500) console.error(err);
  const message =
    err.code === 11000
      ? "Dữ liệu đã tồn tại"
      : status >= 500
        ? err.publicMessage || "Không thể xử lý yêu cầu. Vui lòng thử lại."
        : err.message;
  res.status(status).json({ success: false, message });
};
module.exports = {
  fail,
  requireId,
  pagination,
  escapeRegex,
  pick,
  handle,
  errorHandler,
};

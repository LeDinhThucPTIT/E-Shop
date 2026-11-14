const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  fail,
  requireId,
  pagination,
  pick,
  escapeRegex,
} = require("../utils/http");
const publicUser = (user) => ({
  id: String(user._id),
  fullName: user.name,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  address: user.address,
});
const loginUser = async (email, password) => {
  if (typeof email !== "string" || typeof password !== "string")
    throw fail(400, "Email và mật khẩu không hợp lệ");
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user?.isActive || !(await bcrypt.compare(password, user.password)))
    throw fail(401, "Email hoặc mật khẩu không đúng");
  const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return { userData: publicUser(user), token };
};
const registerUser = async (data) => {
  const name = data.fullName || data.name;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof data.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    typeof data.password !== "string" ||
    data.password.length < 6 ||
    typeof data.phone !== "string" ||
    !/^\d{9,11}$/.test(data.phone)
  )
    throw fail(
      400,
      "Vui lòng nhập họ tên, email, số điện thoại hợp lệ và mật khẩu ít nhất 6 ký tự",
    );
  const user = await User.create({
    name: name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone,
    password: await bcrypt.hash(data.password, 12),
  });
  return publicUser(user);
};
const getAllUsers = async (query = {}) => {
  const { page, limit, skip } = pagination(query);
  const filter = {};
  if (query.search)
    filter.$or = ["name", "email"].map((key) => ({
      [key]: { $regex: escapeRegex(query.search), $options: "i" },
    }));
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  const [users, totalItems] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  return {
    data: users.map(publicUser),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
const getUserById = async (id) => {
  const user = await User.findById(requireId(id)).select("-password");
  if (!user) throw fail(404, "Không tìm thấy người dùng");
  return publicUser(user);
};
const updateUser = async (id, data, actor) => {
  if (actor.id !== id && actor.role !== "admin")
    throw fail(403, "Bạn chỉ được sửa tài khoản của mình");
  if (
    actor.role === "admin" &&
    actor.id === id &&
    (data.isActive === false ||
      (data.role !== undefined && data.role !== "admin"))
  )
    throw fail(400, "Không thể tự khóa hoặc hạ quyền tài khoản quản trị");
  const updates = pick(data, ["name", "phone", "address"]);
  if (data.fullName !== undefined) updates.name = data.fullName;
  if (actor.role === "admin")
    Object.assign(updates, pick(data, ["role", "isActive"]));
  const user = await User.findById(requireId(id));
  if (!user) throw fail(404, "Không tìm thấy người dùng");
  if (data.password !== undefined) {
    if (
      actor.id !== id ||
      typeof data.currentPassword !== "string" ||
      !(await bcrypt.compare(data.currentPassword, user.password))
    )
      throw fail(400, "Mật khẩu hiện tại không đúng");
    if (typeof data.password !== "string" || data.password.length < 6)
      throw fail(400, "Mật khẩu phải có ít nhất 6 ký tự");
    updates.password = await bcrypt.hash(data.password, 12);
  }
  user.set(updates);
  await user.save();
  return publicUser(user);
};
const deleteUser = async (id, actor) => {
  if (id === actor.id) throw fail(400, "Không thể tự xóa tài khoản quản trị");
  const user = await User.findByIdAndUpdate(
    requireId(id),
    { isActive: false },
    { returnDocument: "after" },
  );
  if (!user) throw fail(404, "Không tìm thấy người dùng");
  return publicUser(user);
};
module.exports = {
  loginUser,
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  countUsers: async () => User.countDocuments(),
};

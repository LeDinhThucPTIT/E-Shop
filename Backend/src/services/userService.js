const userRepository = require("../repositories/userRepository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const buildUserFilter = ({ search, role, isActive }) => {
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  return filter;
};

const getAllUsers = async (query) => {
  const {
    search,
    role,
    isActive,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNumber = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 10),
  );
  const allowedSortFields = ["createdAt", "name", "email", "role", "isActive"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sort = { [safeSortBy]: order === "asc" ? 1 : -1 };
  const filter = buildUserFilter({ search, role, isActive });
  const skip = (pageNumber - 1) * limitNumber;

  const [users, totalItems] = await Promise.all([
    userRepository.getAllUsers(filter, skip, limitNumber, sort),
    userRepository.countUsers(filter),
  ]);

  return {
    data: users,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNumber),
    },
  };
};
const getUserById = async (userId) => {
  const user = await userRepository.getUserById(userId);
  return user;
};

const updateUser = async (userId, userData) => {
  const updates = { ...userData };
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  return userRepository.updateUser(userId, updates);
};
const deleteUser = async (userId) => {
  const deletedUser = await userRepository.deleteUser(userId);
  return deletedUser;
};

const countUsers = async (query) => {
  return userRepository.countUsers(buildUserFilter(query));
};

// user dang nhap / dang ky
//dang nhap
const loginUser = async (email, password) => {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: "1d" }, // Token có hạn dùng 1 ngày
  );

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return { userData, token };
};

//dang ky
const registerUser = async (userData) => {
  const { name, email, password, phone } = userData;
  if (!name || !email || !password || !phone) {
    throw new Error("Name, email, password, and phone are required");
  }

  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already in use");
  }
  const existingPhone = await userRepository.getUserByPhone(phone);
  if (existingPhone) {
    throw new Error("Phone number already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userRepository.createUser({
    name,
    email,
    password: hashedPassword,
    phone,
  });
  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  countUsers,
  loginUser,
  registerUser,
};

const User = require("../models/Users");

// admin
const getAllUsers = async (filter, skip, limit, sort) => {
  return User.find(filter).select("-password").skip(skip).limit(limit).sort(sort);
};

const getUserById = async (userId) => {
  return User.findById(userId).select("-password");
};

const updateUser = async (userId, userData) => {
  return User.findByIdAndUpdate(userId, userData, {
    new: true,
    runValidators: true,
  }).select("-password");
};

const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

// user count
const countUsers = async (filter) => {
  return await User.countDocuments(filter);
};

// user dang nhap / dang ky
const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const getUserByPhone = async (phone) => {
  return User.findOne({ phone });
};

const createUser = async (userData) => {
  return await User.create(userData);
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  countUsers,
  getUserByEmail,
  getUserByPhone,
  createUser,
};

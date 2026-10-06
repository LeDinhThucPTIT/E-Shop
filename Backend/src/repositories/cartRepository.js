const Cart = require("../models/Cart");

const getCartUser = async (userId) => {
  return await Cart.findOne({ user: userId }).populate("items.product");
};

const createCart = async (cartData) => {
  return await Cart.create(cartData);
};

const updateCart = async (cartId, cartData) => {
  return await Cart.findByIdAndUpdate(cartId, cartData, { new: true });
};

const deleteCart = async (userId, cartId) => {
  return await Cart.findOneAndDelete({ _id: cartId, user: userId });
};

module.exports = {
  getCartUser,
  createCart,
  updateCart,
  deleteCart,
};

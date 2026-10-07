const cartRepository = require("../repositories/cartRepository");

const getCartUser = async (userId) => {
  return await cartRepository.getCartUser(userId);
};

const addToCart = async (userId, product, sku, quantity) => {
  const cart = await cartRepository.getCartUser(userId);
  if (!cart) {
    const newCart = {
      userId: userId,
      products: [product, sku, quantity],
    };
    return await cartRepository.createCart(newCart);
  } else {
    const index = cart.products.findIndex(
      (item) =>
        item.productId.toString() === product.productId.toString() &&
        item.sku === product.sku,
    );
    if (index !== -1) {
      cart.products[index].quantity += product.quantity;
    } else {
      cart.products.push({ product, sku, quantity });
    }
    return await cartRepository.updateCart(cart._id, cart);
  }
};

const updateCart = async (userId, product, sku, quantity) => {
  const cart = await cartRepository.getCartUser(userId);
  if (!cart) {
    const newCart = {
      userId: userId,
      products: [product, sku, quantity],
    };
    return await cartRepository.createCart(newCart);
  } else {
    const index = cart.products.findIndex(
      (item) =>
        item.productId.toString() === product.productId.toString() &&
        item.sku === product.sku,
    );
    if (index !== -1) {
      cart.products[index].quantity = quantity;
    } else {
      throw new Error("Product not found in cart");
    }
  }
};

const deleteCart = async (userId, cartId) => {
  return await cartRepository.deleteCart(userId, cartId);
};

const deleteAllCarts = async (userId) => {
  return await cartRepository.deleteAllCarts(userId);
};
module.exports = {
  getCartUser,
  addToCart,
  updateCart,
  deleteCart,
  deleteAllCarts,
};

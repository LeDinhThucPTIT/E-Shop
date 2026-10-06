const cartService = require("../services/cartService");

const getCartUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCartUser(userId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product, sku, quantity } = req.body;
    const addToCart = await cartService.addToCart(
      userId,
      product,
      sku,
      quantity,
    );
    res.status(200).json({ success: true, data: addToCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product, sku, quantity } = req.body;
    const updateCart = await cartService.updateCart(
      userId,
      product,
      sku,
      quantity,
    );
    res.status(200).json({ success: true, data: updateCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCart = async (req, res) => {
  try {
    const deletedCart = await cartService.deleteCart(req.user.id, req.params.id);
    if (!deletedCart) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giỏ hàng." });
    }
    return res.status(200).json({ success: true, data: deletedCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCartUser,
  addToCart,
  updateCart,
  deleteCart,
};

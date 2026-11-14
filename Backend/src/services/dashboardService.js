const Order = require("../models/Orders");
const User = require("../models/Users");
const Product = require("../models/Products");
module.exports = async () => {
  const [orders, users, products, revenue, recent, bestsellers, monthly] =
    await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([
        {
          $match: { paymentStatus: "paid", orderStatus: { $ne: "cancelled" } },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderCode totalPrice orderStatus createdAt"),
      Product.find({ isActive: true })
        .sort({ soldCount: -1 })
        .limit(5)
        .select("name soldCount images"),
      Order.aggregate([
        {
          $match: { paymentStatus: "paid", orderStatus: { $ne: "cancelled" } },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$paidAt",
                timezone: "Asia/Bangkok",
              },
            },
            total: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
        { $sort: { _id: 1 } },
      ]),
    ]);
  return {
    orders,
    users,
    products,
    revenue: revenue[0]?.total || 0,
    recent,
    bestsellers,
    monthly,
  };
};

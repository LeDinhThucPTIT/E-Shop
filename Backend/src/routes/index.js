const express = require("express");
const router = express.Router();

const categoryRouter = require("./categoryRouter");
const brandRouter = require("./brandRouter");
const productRouter = require("./productRouter");
const userRouter = require("./userRouter");
const cartRouter = require("./cartRouter");

router.use("/categories", categoryRouter);
router.use("/brands", brandRouter);
router.use("/products", productRouter);
router.use("/users", userRouter);
router.use("/cart", cartRouter);

module.exports = router;

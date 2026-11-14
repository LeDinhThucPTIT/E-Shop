require("dotenv").config();
const mongoose = require("mongoose");
const start = async () => {
  if (
    !process.env.MONGO_URI ||
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  )
    throw new Error("Cần MONGO_URI và JWT_SECRET dài ít nhất 32 ký tự");
  await mongoose.connect(process.env.MONGO_URI);
  const topology = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!topology.setName && topology.msg !== "isdbgrid") {
    await mongoose.disconnect();
    throw new Error(
      "MongoDB replica set is required for orders. Use npm run db:dev or MongoDB Atlas.",
    );
  }
  await Promise.all(
    ["Users", "Products", "Cart", "Orders", "Categories", "Brands"].map(
      (name) => require(`./src/models/${name}`).init(),
    ),
  );
  const server = require("./app").listen(process.env.PORT || 5000, () =>
    console.log("API ready"),
  );
  const stop = () =>
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
};
if (require.main === module)
  start().catch(async (error) => {
    await mongoose.disconnect();
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { start };

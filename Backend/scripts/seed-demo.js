require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../src/models/Categories");
const Brand = require("../src/models/Brands");
const Product = require("../src/models/Products");

// Only insert missing fixtures. Never reset stock, prices or existing orders.
async function seed() {
  if (!process.env.DEMO_MONGO_URI)
    throw new Error("Set DEMO_MONGO_URI to a replica set URI for neuralstore_demo.");
  await mongoose.connect(process.env.DEMO_MONGO_URI);
  if (mongoose.connection.name !== "neuralstore_demo")
    throw new Error("Demo seeding is restricted to database neuralstore_demo.");
  const topology = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!topology.setName && topology.msg !== "isdbgrid")
    throw new Error("A replica set is required. Use db:dev or MongoDB Atlas.");
  await Promise.all([Category.init(), Brand.init(), Product.init()]);
  const fixtures = require("./demo-catalog.json");
  await mongoose.connection.transaction(async (session) => {
    const brand = await Brand.findOneAndUpdate(
      { slug: "neural-demo" },
      { $setOnInsert: { name: "Neural Demo", slug: "neural-demo", description: "Fictional portfolio products, not commercial offers." } },
      { upsert: true, returnDocument: "after", runValidators: true, session },
    );
    for (const category of fixtures.categories) {
      const saved = await Category.findOneAndUpdate(
        { slug: category.slug }, { $setOnInsert: category },
        { upsert: true, returnDocument: "after", runValidators: true, session },
      );
      for (const product of fixtures.products.filter((p) => p.category === category.slug)) {
        await Product.updateOne(
          { slug: product.slug },
          { $setOnInsert: { ...product, category: saved._id, brand: brand._id } },
          { upsert: true, runValidators: true, session },
        );
      }
    }
  });
  console.log("Demo catalog ready in neuralstore_demo. Existing records were preserved. No users or orders were created.");
}
if (require.main === module)
  seed().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
module.exports = { seed };

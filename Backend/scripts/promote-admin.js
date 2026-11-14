require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/Users");
async function main() {
  const email = process.argv[2];
  if (!email || !email.includes("@"))
    throw new Error(
      "Usage: npm run admin -- email@example.com (an existing registered account)",
    );
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { role: "admin", isActive: true } },
    { returnDocument: "after" },
  );
  if (!user)
    throw new Error("Account not found. Register in the application first.");
  console.log(
    "Administrator role granted. Sign in again to update the interface.",
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

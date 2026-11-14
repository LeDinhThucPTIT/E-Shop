const express = require("express");
const cors = require("cors");
const { errorHandler, fail } = require("./src/utils/http");
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
const { rateLimit } = require("./src/middlewares/rateLimit");
const authLimit = rateLimit({ limit: 100, windowMs: 15 * 60 * 1000 });
app.use(["/api/users/login", "/api/users/register"], authLimit);
app.use("/api/chat", rateLimit({ limit: 30, windowMs: 60 * 1000 }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim()),
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
  )
    return next(fail(400, "Nội dung yêu cầu phải là JSON object"));
  next();
});
app.get("/api/health", (req, res) => res.json({ success: true }));
app.use("/api", require("./src/routes"));
app.use((req, res, next) => next(fail(404, "Không tìm thấy API")));
app.use(errorHandler);
module.exports = app;

const router = require("express").Router();
const { handle } = require("../utils/http");
const { chat } = require("../services/chatService");
router.post(
  "/",
  handle(async (req, res) =>
    res.json({ success: true, data: await chat(req.body) }),
  ),
);
module.exports = router;

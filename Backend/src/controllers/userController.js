const service = require("../services/userService");
const { handle, fail } = require("../utils/http");
module.exports = {
  loginUser: handle(async (req, res) =>
    res.json(await service.loginUser(req.body.email, req.body.password)),
  ),
  registerUser: handle(async (req, res) =>
    res.status(201).json({ user: await service.registerUser(req.body) }),
  ),
  getAllUsers: handle(async (req, res) =>
    res.json(await service.getAllUsers(req.query)),
  ),
  countUsers: handle(async (req, res) =>
    res.json({ count: await service.countUsers(req.query) }),
  ),
  getUserById: handle(async (req, res) => {
    const id = req.params.id === "me" ? req.user.id : req.params.id;
    if (id !== req.user.id && req.user.role !== "admin")
      throw fail(403, "Bạn không có quyền truy cập");
    res.json(await service.getUserById(id));
  }),
  updateUser: handle(async (req, res) =>
    res.json(
      await service.updateUser(
        req.params.id === "me" ? req.user.id : req.params.id,
        req.body,
        req.user,
      ),
    ),
  ),
  deleteUser: handle(async (req, res) =>
    res.json(await service.deleteUser(req.params.id, req.user)),
  ),
};

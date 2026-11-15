const router = require('express').Router();
const service = require('../services/paymentService');
const auth = require('../middlewares/authMiddleware');
const { handle } = require('../utils/http');
const { rateLimit } = require('../middlewares/rateLimit');
router.post('/momo/ipn', handle(async (req, res) => {
  await service.ipn(req.body);
  res.status(204).end();
}));
router.post('/momo/create', auth.verifyToken, rateLimit({ limit: 20, windowMs: 60000 }), handle(async (req, res) => {
  res.json({ success: true, data: await service.create(req.user.id, req.body.orderId) });
}));
router.get('/orders/:id', auth.verifyToken, handle(async (req, res) => {
  res.json({ success: true, data: await service.status(req.user.id, req.params.id) });
}));
router.get('/momo/result/:reference', auth.verifyToken, handle(async (req, res) => {
  const payment = await require('../models/PaymentAttempt').findOne({ provider: 'momo', reference: req.params.reference, user: req.user.id });
  if (!payment) throw require('../utils/http').fail(404, 'Không tìm thấy giao dịch');
  res.json({ success: true, data: await service.status(req.user.id, String(payment.order)) });
}));
module.exports = router;

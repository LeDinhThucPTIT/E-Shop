// Per-process fixed windows. Configure a shared limiter at the gateway for multiple replicas.
function rateLimit({ limit, windowMs, maxKeys = 10000, now = Date.now }) {
  const clients = new Map();
  return (req, res, next) => {
    const time = now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    for (const [address, entry] of clients)
      if (entry.reset <= time) clients.delete(address);
    let entry = clients.get(key);
    if (!entry && clients.size >= maxKeys) {
      res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ success: false, message: "Hệ thống đang bận. Vui lòng thử lại sau." });
    }
    if (!entry) {
      entry = { count: 0, reset: time + windowMs };
      clients.set(key, entry);
    }
    if (++entry.count > limit) {
      res.set("Retry-After", String(Math.ceil((entry.reset - time) / 1000)));
      return res.status(429).json({ success: false, message: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau." });
    }
    next();
  };
}
module.exports = { rateLimit };

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { rateLimit } = require("../src/middlewares/rateLimit");
test("limiter isolates clients, returns retry time and resets expired windows", () => {
  let time = 0;
  const middleware = rateLimit({ limit: 2, windowMs: 1000, now: () => time });
  const call = (ip) => {
    const result = { status: 200, headers: {} };
    const res = { set: (k, v) => { result.headers[k] = v; },
      status: (status) => { result.status = status; return res; }, json: () => result };
    middleware({ ip }, res, () => {});
    return result;
  };
  assert.equal(call("a").status, 200);
  assert.equal(call("a").status, 200);
  assert.equal(call("a").headers["Retry-After"], "1");
  assert.equal(call("a").status, 429);
  assert.equal(call("b").status, 200);
  time = 1000;
  assert.equal(call("a").status, 200);
});

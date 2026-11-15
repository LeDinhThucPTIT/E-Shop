const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { once } = require("node:events");
const { execFile } = require("node:child_process");
const runFile = require("node:util").promisify(execFile);
const mongoose = require("mongoose");
let mongod,
  server,
  folder,
  base,
  adminToken,
  userToken,
  otherToken,
  user,
  other,
  product,
  variantProduct;
async function request(method, url, body, token, key) {
  const response = await fetch(base + "/api" + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
const address = {
  name: "Test Recipient",
  phone: "0901234567",
  street: "123 Test",
  ward: "Ward",
  district: "District",
  province: "HCM",
  email: "test@example.com",
};
const input = (id, sku, quantity = 1) => ({
  items: [{ product: String(id), sku, quantity, price: 1 }],
  shippingAddress: address,
  shippingMethod: "standard",
  paymentMethod: "cod",
  discount: 999999999,
  shippingFee: 0,
});
test("demo seed restricts its database and preserves edited fixtures on repeat runs", async () => {
  // Reuse only the temporary replica set created by this suite, never .env.
  const origin = `mongodb://${mongoose.connection.host}:${mongoose.connection.port}`;
  const script = path.join(__dirname, "../scripts/seed-demo.js");
  const runSeed = (database) => runFile(process.execPath, [script], {
    env: { ...process.env, DEMO_MONGO_URI: `${origin}/${database}?replicaSet=api-test` },
    windowsHide: true,
  });
  await assert.rejects(runSeed("neuralstore_test"), /restricted to database/);
  await runSeed("neuralstore_demo");
  const demo = await mongoose.createConnection(`${origin}/neuralstore_demo?replicaSet=api-test`).asPromise();
  try {
    const products = demo.collection("products");
    assert.equal(await products.countDocuments(), 8);
    assert.equal(await demo.collection("categories").countDocuments(), 4);
    assert.equal(await demo.collection("brands").countDocuments(), 1);
    assert.equal(await demo.collection("users").countDocuments(), 0);
    assert.equal(await demo.collection("orders").countDocuments(), 0);
    await products.updateOne({ sku: "DEMO-LAP-AIR" }, { $set: { stock: 3, price: 12345678 } });
    await runSeed("neuralstore_demo");
    assert.equal(await products.countDocuments(), 8);
    const edited = await products.findOne({ sku: "DEMO-LAP-AIR" });
    assert.equal(edited.stock, 3);
    assert.equal(edited.price, 12345678);
    for (const product of await products.find().toArray()) {
      assert.ok(await demo.collection("categories").findOne({ _id: product.category }));
      assert.ok(await demo.collection("brands").findOne({ _id: product.brand }));
      for (const image of product.images)
        await fs.access(path.join(__dirname, "../../Frontend/public", image));
    }
  } finally {
    await demo.close();
  }
});
before(
  async () => {
    process.env.JWT_SECRET = "test-only-secret-with-at-least-32-characters";
    folder = await fs.mkdtemp(path.join(os.tmpdir(), "neuralstore-api-test-"));
    const reservation = net.createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = reservation.address().port;
    await new Promise((r) => reservation.close(r));
    mongod = spawn(
      process.env.MONGOD_BINARY || "mongod",
      [
        "--dbpath",
        folder,
        "--port",
        String(port),
        "--bind_ip",
        "127.0.0.1",
        "--replSet",
        "api-test",
        "--logpath",
        path.join(folder, "mongo.log"),
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    let spawnError;
    mongod.on("error", (e) => {
      spawnError = e;
    });
    const direct = new mongoose.mongo.MongoClient(
      `mongodb://127.0.0.1:${port}/?directConnection=true`,
      { serverSelectionTimeoutMS: 500 },
    );
    try {
      for (let attempt = 0; ; attempt++) {
        if (spawnError)
          throw new Error(
            `Set MONGOD_BINARY to mongod executable: ${spawnError.message}`,
          );
        try {
          await direct.connect();
          break;
        } catch (e) {
          if (attempt > 30) throw e;
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      await direct.db("admin").command({
        replSetInitiate: {
          _id: "api-test",
          members: [{ _id: 0, host: `127.0.0.1:${port}` }],
        },
      });
    } finally {
      await direct.close();
    }
    await mongoose.connect(
      `mongodb://127.0.0.1:${port}/neuralstore_test?replicaSet=api-test`,
      { serverSelectionTimeoutMS: 20000 },
    );
    for (const name of [
      "Users",
      "Products",
      "Orders",
      "Cart",
      "Brands",
      "Categories",
      "PaymentAttempt",
    ])
      await require(`../src/models/${name}`).init();
    server = require("../app").listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${server.address().port}`;
    const signup = async (email, phone) => {
      const registration = await request("POST", "/users/register", {
        fullName: "Test User",
        email,
        password: "password123",
        phone,
        role: "admin",
      });
      assert.equal(registration.status, 201);
      assert.equal(registration.body.user.role, "user");
      const login = await request("POST", "/users/login", {
        email,
        password: "password123",
      });
      assert.equal(login.status, 200);
      return { ...login.body, user: registration.body.user };
    };
    const a = await signup("admin@test.vn", "0900000001");
    await require("../src/models/Users").findByIdAndUpdate(a.user.id, {
      role: "admin",
    });
    adminToken = a.token;
    const b = await signup("user@test.vn", "0900000002");
    user = b.user;
    userToken = b.token;
    const c = await signup("other@test.vn", "0900000003");
    other = c.user;
    otherToken = c.token;
    const p = await request(
      "POST",
      "/products",
      {
        name: "Test Laptop",
        slug: "test-laptop",
        sku: "LAPTOP",
        price: 1000000,
        discountPrice: 900000,
        stock: 20,
        images: ["https://example.com/laptop.png"],
      },
      adminToken,
    );
    assert.equal(p.status, 201);
    product = p.body;
    const v = await request(
      "POST",
      "/products",
      {
        name: "Test Phone",
        slug: "test-phone",
        price: 2000000,
        variants: [
          { sku: "PHONE-BLACK", color: "Black", price: 2200000, stock: 3 },
          { sku: "PHONE-WHITE", color: "White", price: 2100000, stock: 2 },
        ],
        images: ["https://example.com/phone.png"],
      },
      adminToken,
    );
    assert.equal(v.status, 201);
    variantProduct = v.body;
  },
  { timeout: 60000 },
);
after(async () => {
  if (server)
    await new Promise((r) => {
      server.closeAllConnections();
      server.close(r);
    });
  await mongoose.disconnect();
  if (mongod?.pid && mongod.exitCode === null) {
    const stopped = once(mongod, "exit");
    mongod.kill();
    await stopped;
  }
  if (folder)
    await fs.rm(folder, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
});
test('MoMo checkout validates IPN, idempotency, timeouts, retries, expiry and reconciliation', async () => {
  const gateway = require('../src/services/momoGateway');
  const Attempt = require('../src/models/PaymentAttempt');
  const Order = require('../src/models/Orders');
  const Product = require('../src/models/Products');
  const { createHmac } = require('node:crypto');
  const env = { MOMO_PARTNER_CODE: 'MOMO_TEST', MOMO_ACCESS_KEY: 'test-access', MOMO_SECRET_KEY: 'integration-test-secret', MOMO_REDIRECT_URL: 'http://localhost:5173/checkout/payment-result', MOMO_IPN_URL: 'https://shop.example/api/payments/momo/ipn', MOMO_API_BASE_URL: 'https://test-payment.momo.vn/v2/gateway/api' };
  const savedEnv = Object.fromEntries(Object.keys(env).map(k => [k, process.env[k]]));
  Object.assign(process.env, env);
  const originalFetch = global.fetch;
  let createCalls = 0;
  let createMode = 'ok';
  let queryCode = 1000;
  global.fetch = async (url, options) => {
    if (!String(url).startsWith(env.MOMO_API_BASE_URL)) return originalFetch(url, options);
    const body = JSON.parse(options.body);
    if (String(url).endsWith('/query')) {
      const attempt = await Attempt.findOne({ reference: body.orderId });
      return { ok: true, json: async () => ({ partnerCode: env.MOMO_PARTNER_CODE, requestId: body.requestId, orderId: body.orderId, amount: attempt.amount, resultCode: queryCode, transId: 777 }) };
    }
    createCalls++;
    if (createMode === 'timeout') throw new Error('Simulated connection timeout');
    const data = { partnerCode: env.MOMO_PARTNER_CODE, requestId: body.requestId, orderId: body.orderId, amount: body.amount, resultCode: 0, responseTime: Date.now(), message: 'Successful', payUrl: `https://test-payment.momo.vn/v2/gateway/pay?orderId=${body.orderId}` };
    const raw = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${data.amount}&message=${data.message}&orderId=${data.orderId}&partnerCode=${data.partnerCode}&payUrl=${data.payUrl}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}`;
    data.signature = createHmac('sha256', env.MOMO_SECRET_KEY).update(raw).digest('hex');
    return { ok: true, json: async () => data };
  };
  const p = await Product.create({ name: 'MoMo test', slug: 'momo-test', sku: 'MOMO-TEST', price: 100000, stock: 20, images: ['/favicon.svg'] });
  const place = async key => {
    const response = await request('POST', '/orders', { ...input(p._id, p.sku), paymentMethod: 'momo' }, userToken, key);
    assert.equal(response.status, 201);
    return response.body.data;
  };
  const notify = async (attempt, changes = {}, invalidSignature = false) => {
    const params = { partnerCode: env.MOMO_PARTNER_CODE, orderId: attempt.reference, requestId: attempt.requestId, amount: attempt.amount, resultCode: 0, transId: 123456, orderInfo: `Thanh toan ${attempt.reference}`, orderType: 'momo_wallet', payType: 'qr', responseTime: Date.now(), extraData: '', message: 'Successful', ...changes };
    const raw = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId}`;
    params.signature = invalidSignature ? 'bad' : createHmac('sha256', env.MOMO_SECRET_KEY).update(raw).digest('hex');
    return request('POST', '/payments/momo/ipn', params);
  };
  const initiate = id => request('POST', '/payments/momo/create', { orderId: id }, userToken);
  try {
    delete process.env.MOMO_SECRET_KEY;
    assert.equal((await request('POST', '/orders', { ...input(p._id, p.sku), paymentMethod: 'momo' }, userToken, 'momo-missing-config')).status, 400);
    process.env.MOMO_SECRET_KEY = env.MOMO_SECRET_KEY;
    assert.equal((await Product.findById(p._id)).stock, 20);
    assert.equal((await request('POST', '/orders', { ...input(p._id, p.sku), paymentMethod: 'vnpay' }, userToken, 'disabled-vnpay')).status, 400);
    await Product.updateOne({ _id: p._id }, { $set: { price: 50000000 } });
    assert.equal((await request('POST', '/orders', { ...input(p._id, p.sku), paymentMethod: 'momo' }, userToken, 'momo-high-amount')).status, 400);
    assert.equal((await Product.findById(p._id)).stock, 20);
    await Product.updateOne({ _id: p._id }, { $set: { price: 100000 } });

    const order = await place('momo-order-1');
    assert.equal((await place('momo-order-1'))._id, order._id);
    assert.equal((await Product.findById(p._id)).stock, 19);
    assert.equal((await request('POST', '/payments/momo/create', { orderId: order._id }, otherToken)).status, 404);
    const creates = await Promise.all([1, 2].map(() => initiate(order._id)));
    assert.ok(creates.some(res => res.status === 200));
    for (const res of creates) assert.ok([200, 409].includes(res.status));
    assert.equal(createCalls, 1);
    const cached = await initiate(order._id);
    assert.equal(cached.status, 200);
    assert.equal(createCalls, 1);
    assert.equal(await Attempt.countDocuments({ order: order._id }), 1);
    const attempt = await Attempt.findOne({ order: order._id });
    assert.equal((await request('GET', `/payments/momo/result/${attempt.reference}`, undefined, otherToken)).status, 404);
    assert.equal((await notify(attempt, {}, true)).status, 400);
    assert.equal((await notify(attempt, { amount: 1 })).status, 400);
    assert.equal((await notify(attempt, { partnerCode: 'WRONG' })).status, 400);
    assert.equal((await notify(attempt, { requestId: 'WRONG' })).status, 400);
    assert.equal((await Order.findById(order._id)).paymentStatus, 'pending');
    assert.equal((await request('PUT', `/orders/admin/${order._id}/status`, { orderStatus: 'confirmed' }, adminToken)).status, 409);
    assert.equal((await request('PUT', `/orders/my-orders/${order._id}/cancel`, { cancelReason: 'cancel' }, userToken)).status, 409);
    for (const resultCode of [1000, 7000, 7002, 9000, 42, 9999]) {
      assert.equal((await notify(attempt, { resultCode })).status, 204);
      assert.equal((await Order.findById(order._id)).paymentStatus, 'pending');
    }
    assert.equal((await notify(attempt)).status, 204);
    assert.equal((await notify(attempt)).status, 204);
    assert.equal((await Order.findById(order._id)).paymentStatus, 'paid');
    assert.equal((await Product.findById(p._id)).stock, 19);
    assert.equal((await initiate(order._id)).status, 409);
    assert.equal((await request('GET', `/payments/momo/result/${attempt.reference}`, undefined, userToken)).body.data.paymentStatus, 'paid');
    assert.equal((await request('PUT', `/orders/admin/${order._id}/status`, { orderStatus: 'confirmed' }, adminToken)).status, 200);

    const retryOrder = await place('momo-order-retry');
    await initiate(retryOrder._id);
    const failed = await Attempt.findOne({ order: retryOrder._id });
    assert.equal((await notify(failed, { resultCode: 1006 })).status, 204);
    assert.equal((await initiate(retryOrder._id)).status, 200);
    const next = await Attempt.findOne({ order: retryOrder._id, status: 'pending' });
    assert.notEqual(next.reference, failed.reference);
    await notify(failed, { transId: 444 });
    await notify(next, { transId: 555 });
    assert.equal((await Order.findById(retryOrder._id)).paymentNeedsReview, true);
    assert.equal((await Attempt.findById(next._id)).status, 'review');
    assert.equal((await request('PUT', `/orders/admin/${retryOrder._id}/status`, { orderStatus: 'confirmed' }, adminToken)).status, 409);

    const expiring = await place('momo-order-expiry');
    await Order.updateOne({ _id: expiring._id }, { $set: { paymentExpiresAt: new Date(0) } });
    await require('../src/services/paymentService').sweep();
    await require('../src/services/paymentService').sweep();
    assert.equal((await Order.findById(expiring._id)).orderStatus, 'cancelled');
    assert.equal((await Product.findById(p._id)).stock, 18);

    const unknown = await place('momo-order-unknown');
    createMode = 'timeout';
    assert.equal((await initiate(unknown._id)).status, 400);
    const unresolved = await Attempt.findOne({ order: unknown._id });
    createMode = 'ok';
    assert.equal((await initiate(unknown._id)).status, 200);
    assert.equal(await Attempt.countDocuments({ order: unknown._id }), 1);
    assert.equal((await Attempt.findById(unresolved._id)).requestId, unresolved.requestId);
    await Order.updateOne({ _id: unknown._id }, { $set: { paymentExpiresAt: new Date(0) } });
    await Attempt.collection.updateOne({ _id: unresolved._id }, { $set: { createdAt: new Date(0) } });
    await require('../src/services/paymentService').sweep();
    assert.equal((await Order.findById(unknown._id)).orderStatus, 'pending');
    queryCode = 1005;
    await Attempt.updateOne({ _id: unresolved._id }, { $unset: { lastCheckedAt: 1 } });
    await require('../src/services/paymentService').sweep();
    assert.equal((await Order.findById(unknown._id)).orderStatus, 'cancelled');
    await notify(unresolved, { transId: 999 });
    assert.equal((await Attempt.findById(unresolved._id)).status, 'review');
    assert.equal((await Order.findById(unknown._id)).orderStatus, 'cancelled');
    assert.equal((await Product.findById(p._id)).stock, 18);

    const queried = await place('momo-query-success');
    await initiate(queried._id);
    const queryAttempt = await Attempt.findOne({ order: queried._id });
    await Attempt.collection.updateOne({ _id: queryAttempt._id }, { $set: { createdAt: new Date(0) } });
    queryCode = 0;
    await require('../src/services/paymentService').sweep();
    assert.equal((await Order.findById(queried._id)).paymentStatus, 'paid');
  } finally {
    global.fetch = originalFetch;
    await Attempt.deleteMany({ order: { $in: (await Order.find({ 'items.product': p._id }).select('_id')).map(o => o._id) } });
    await Order.deleteMany({ 'items.product': p._id });
    await Product.deleteOne({ _id: p._id });
    for (const [k, v] of Object.entries(savedEnv)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test("authentication, ownership and role escalation are enforced", async () => {
  assert.equal((await request("GET", "/cart")).status, 401);
  assert.equal(
    (await request("GET", "/users/me", undefined, "invalid")).status,
    401,
  );
  assert.equal(
    (
      await request("POST", "/users/login", {
        email: "user@test.vn",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("GET", `/users/${other.id}`, undefined, userToken)).status,
    403,
  );
  assert.equal(
    (await request("PUT", `/users/${other.id}`, { name: "Hacked" }, userToken))
      .status,
    403,
  );
  const updated = await request(
    "PUT",
    "/users/me",
    { fullName: "Customer", role: "admin", isActive: false },
    userToken,
  );
  assert.equal(updated.body.role, "user");
  assert.equal(updated.body.isActive, true);
  assert.equal(
    (await request("GET", "/users", undefined, userToken)).status,
    403,
  );
  const me = await request("GET", "/users/me", undefined, userToken);
  assert.equal(me.body.fullName, "Customer");
  assert.equal(me.body.password, undefined);
});
test("password changes require current password", async () => {
  assert.equal(
    (await request("PUT", "/users/me", { password: "newpassword" }, userToken))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        "PUT",
        "/users/me",
        { currentPassword: "password123", password: "newpassword" },
        userToken,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request("POST", "/users/login", {
        email: "user@test.vn",
        password: "password123",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("POST", "/users/login", {
        email: "user@test.vn",
        password: "newpassword",
      })
    ).status,
    200,
  );
});
test("cart CRUD enforces SKU, quantity, stock and ownership", async () => {
  const item = { product: product._id, sku: "LAPTOP", quantity: 2 };
  for (const quantity of [-1, 1.5])
    assert.equal(
      (await request("POST", "/cart", { ...item, quantity }, userToken)).status,
      400,
    );
  assert.equal(
    (await request("POST", "/cart", { ...item, sku: "wrong" }, userToken))
      .status,
    400,
  );
  const added = await request("POST", "/cart", item, userToken);
  assert.equal(added.body.data.items[0].quantity, 2);
  assert.equal(added.body.data.items[0].product._id, product._id);
  await request("POST", "/cart", item, userToken);
  const updated = await request(
    "PUT",
    "/cart",
    { ...item, quantity: 3 },
    userToken,
  );
  assert.equal(updated.body.data.items[0].quantity, 3);
  assert.equal(
    (await request("PUT", "/cart", { ...item, quantity: 999 }, userToken))
      .status,
    409,
  );
  assert.equal(
    (await request("GET", "/cart", undefined, otherToken)).body.data.items
      .length,
    0,
  );
  assert.equal(
    (
      await request(
        "DELETE",
        `/cart/${product._id}?sku=LAPTOP`,
        undefined,
        userToken,
      )
    ).body.data.items.length,
    0,
  );
  await request("POST", "/cart", item, userToken);
  assert.equal(
    (await request("DELETE", "/cart", undefined, userToken)).body.data.items
      .length,
    0,
  );
});
test("taxonomy CRUD generates IDs and active filter works", async () => {
  for (const url of ["/categories", "/brands"]) {
    assert.equal(
      (
        await request(
          "POST",
          url,
          { name: "Denied", slug: "denied" },
          userToken,
        )
      ).status,
      403,
    );
    const created = await request(
      "POST",
      url,
      { name: "Example", slug: "example" },
      adminToken,
    );
    assert.equal(created.status, 201);
    assert.ok(created.body._id);
    assert.equal(
      (
        await request(
          "PUT",
          `${url}/${created.body._id}`,
          { name: "Renamed" },
          adminToken,
        )
      ).body.name,
      "Renamed",
    );
    assert.equal(
      (
        await request(
          "DELETE",
          `${url}/${created.body._id}`,
          undefined,
          adminToken,
        )
      ).status,
      200,
    );
    assert.equal((await request("GET", `${url}?isActive=true`)).body.length, 0);
  }
});
test("category metadata counts active products and hiding preserves products", async () => {
  const Product = require("../src/models/Products");
  const created = await request("POST", "/categories", {
    name: "Catalog metadata", slug: "catalog-metadata", sortOrder: 7,
    image: "https://example.com/category.png",
  }, adminToken);
  assert.equal(created.status, 201);
  const categoryId = created.body._id;
  const fixtures = await Product.create([
    { name: "Visible fixture", slug: "category-visible-fixture", price: 100, stock: 1, category: categoryId, isActive: true },
    { name: "Hidden fixture", slug: "category-hidden-fixture", price: 100, stock: 1, category: categoryId, isActive: false },
  ]);
  try {
    const listed = (await request("GET", "/categories?isActive=true")).body.find((c) => c._id === categoryId);
    assert.equal(listed.productCount, 1);
    assert.equal(listed.sortOrder, 7);
    assert.equal(listed.image, "https://example.com/category.png");
    assert.equal((await request("DELETE", `/categories/${categoryId}`, undefined, adminToken)).status, 200);
    assert.equal((await request("GET", "/categories?isActive=true")).body.some((c) => c._id === categoryId), false);
    assert.equal((await Product.findById(fixtures[0]._id)).isActive, true);
  } finally {
    await Product.deleteMany({ category: categoryId });
  }
});
test("order uses server price, deduplicates concurrent retries and restores stock exactly once", async () => {
  await request(
    "POST",
    "/cart",
    { product: product._id, sku: "LAPTOP", quantity: 2 },
    userToken,
  );
  const [a, b] = await Promise.all([
    request(
      "POST",
      "/orders",
      input(product._id, "LAPTOP", 2),
      userToken,
      "checkout-test-1",
    ),
    request(
      "POST",
      "/orders",
      input(product._id, "LAPTOP", 2),
      userToken,
      "checkout-test-1",
    ),
  ]);
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal(a.body.data._id, b.body.data._id);
  const order = a.body.data;
  assert.equal(order.subtotal, 1800000);
  assert.equal(order.shippingFee, 50000);
  assert.equal(order.discount, 0);
  assert.equal(order.tax, 144000);
  assert.equal(order.totalPrice, 1994000);
  assert.equal(order.paymentStatus, "pending");
  assert.equal(
    (await request("GET", `/products/${product._id}`)).body.stock,
    18,
  );
  assert.equal(
    (await request("GET", "/cart", undefined, userToken)).body.data.items
      .length,
    0,
  );
  assert.equal(
    (await request("GET", "/orders/my-orders", undefined, userToken)).body
      .pagination.totalItems,
    1,
  );
  assert.equal(
    (
      await request(
        "GET",
        `/orders/my-orders/${order.orderCode}`,
        undefined,
        userToken,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "GET",
        `/orders/my-orders/${order.orderCode}`,
        undefined,
        otherToken,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/my-orders/${order._id}/cancel`,
        { cancelReason: "Unauthorized" },
        otherToken,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/my-orders/${order._id}/cancel`,
        { cancelReason: "Changed mind" },
        userToken,
      )
    ).body.data.orderStatus,
    "cancelled",
  );
  await request(
    "PUT",
    `/orders/my-orders/${order._id}/cancel`,
    { cancelReason: "Retry" },
    userToken,
  );
  assert.equal(
    (await request("GET", `/products/${product._id}`)).body.stock,
    20,
  );
});
test("failed multi-item checkout rolls back earlier stock writes", async () => {
  const data = input(product._id, "LAPTOP");
  data.items.push({
    product: variantProduct._id,
    sku: "PHONE-BLACK",
    quantity: 100,
  });
  assert.equal(
    (await request("POST", "/orders", data, userToken, "rollback-test")).status,
    409,
  );
  assert.equal(
    (await request("GET", `/products/${product._id}`)).body.stock,
    20,
  );
});
test("concurrent checkout cannot oversell SKU and cancellation restores variant stock", async () => {
  const data = input(variantProduct._id, "PHONE-BLACK", 2);
  const results = await Promise.all([
    request("POST", "/orders", data, userToken, "variant-test-1"),
    request("POST", "/orders", data, otherToken, "variant-test-2"),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const current = (await request("GET", `/products/${variantProduct._id}`))
    .body;
  assert.equal(current.stock, 3);
  assert.equal(current.variants[0].stock, 1);
  const index = results.findIndex((r) => r.status === 201);
  const order = results[index].body.data;
  assert.equal(order.items[0].price, 2200000);
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/my-orders/${order._id}/cancel`,
        { cancelReason: "Test" },
        index === 0 ? userToken : otherToken,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("GET", `/products/${variantProduct._id}`)).body.variants[0]
      .stock,
    3,
  );
});
test("admin lifecycle enforces transitions and records COD revenue at delivery", async () => {
  const placed = await request(
    "POST",
    "/orders",
    input(product._id, "LAPTOP"),
    userToken,
    "lifecycle-test",
  );
  const id = placed.body.data._id;
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/admin/${id}/status`,
        { orderStatus: "delivered" },
        adminToken,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/admin/${id}/status`,
        { orderStatus: "confirmed" },
        userToken,
      )
    ).status,
    403,
  );
  for (const orderStatus of ["confirmed", "shipping", "delivered"])
    assert.equal(
      (
        await request(
          "PUT",
          `/orders/admin/${id}/status`,
          { orderStatus },
          adminToken,
        )
      ).status,
      200,
    );
  const delivered = await request(
    "GET",
    `/orders/admin/${id}`,
    undefined,
    adminToken,
  );
  assert.equal(delivered.body.data.paymentStatus, "paid");
  assert.equal(
    (
      await request(
        "PUT",
        `/orders/admin/${id}/status`,
        { orderStatus: "cancelled", cancelReason: "Invalid" },
        adminToken,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request("GET", "/orders/admin/stats", undefined, adminToken)).body
      .revenue,
    delivered.body.data.totalPrice,
  );
});
test("invalid bodies, IDs, payments, addresses and filters return client errors", async () => {
  assert.equal(
    (
      await request(
        "POST",
        "/orders",
        { ...input(product._id, "LAPTOP"), paymentMethod: "unsupported" },
        userToken,
        "payment-test",
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("POST", "/orders", input(product._id, "LAPTOP"), userToken))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/orders",
        { ...input(product._id, "LAPTOP"), shippingAddress: {} },
        userToken,
        "address-test",
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/cart",
        { product: "invalid", quantity: 1 },
        userToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("POST", "/cart", undefined, userToken)).status,
    400,
  );
  assert.equal(
    (await request("GET", "/products?minPrice=invalid")).status,
    400,
  );
  assert.equal((await request("GET", "/missing")).status, 404);
});
test("soft deletion preserves historical data and revocation checks the live user", async () => {
  assert.equal(
    (await request("DELETE", `/products/${product._id}`, undefined, adminToken))
      .status,
    200,
  );
  assert.equal((await request("GET", `/products/${product._id}`)).status, 404);
  assert.equal(
    (await request("GET", "/products/admin/all", undefined, adminToken)).body
      .data.length,
    2,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/cart",
        { product: product._id, sku: "LAPTOP", quantity: 1 },
        userToken,
      )
    ).status,
    404,
  );
  await request("PUT", `/users/${other.id}`, { isActive: false }, adminToken);
  assert.equal(
    (await request("GET", "/cart", undefined, otherToken)).status,
    401,
  );
});

test("catalog version protects stock against stale administrative updates", async () => {
  const current = (
    await request("GET", "/products/admin/all", undefined, adminToken)
  ).body.data.find((p) => p._id === variantProduct._id);
  assert.equal(
    (
      await request(
        "PUT",
        `/products/${current._id}`,
        { stock: 10 },
        adminToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "PUT",
        `/products/${current._id}`,
        { variants: current.variants, expectedVersion: current.__v - 1 },
        adminToken,
      )
    ).status,
    409,
  );
  const saved = await request(
    "PUT",
    `/products/${current._id}`,
    {
      name: "Updated Phone",
      variants: current.variants,
      expectedVersion: current.__v,
    },
    adminToken,
  );
  assert.equal(saved.status, 200);
  assert.equal(saved.body.__v, current.__v + 1);
  assert.equal(
    (
      await request(
        "PUT",
        `/products/${current._id}`,
        { variants: current.variants, expectedVersion: current.__v },
        adminToken,
      )
    ).status,
    409,
  );
});
test("a reused checkout key cannot be attached to changed contents", async () => {
  const changed = input(product._id, "LAPTOP", 3);
  assert.equal(
    (await request("POST", "/orders", changed, userToken, "checkout-test-1"))
      .status,
    409,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/orders",
        { ...input(variantProduct._id, "PHONE-BLACK"), items: [null] },
        userToken,
        "invalid-item-test",
      )
    ).status,
    400,
  );
});
test("admin cannot lock or demote their own account", async () => {
  assert.equal(
    (await request("PUT", "/users/me", { role: "user" }, adminToken)).status,
    400,
  );
  assert.equal(
    (await request("PUT", "/users/me", { isActive: false }, adminToken)).status,
    400,
  );
});
test("product reviews are loaded from MongoDB rather than demo fixtures", async () => {
  const Review = require("../src/models/Reviews");
  await Review.create({
    user: user.id,
    product: variantProduct._id,
    rating: 4,
    title: "Real review",
    comment: "Saved review",
    verified: false,
  });
  const result = await request(
    "GET",
    `/products/${variantProduct._id}/reviews`,
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].content, "Saved review");
  assert.equal(result.body.data[0].verified, false);
});

test("review submission enforces authentication, validation, uniqueness and server-owned verification", async () => {
  const Product = require("../src/models/Products");
  const item = await Product.create({ name: "Review target", slug: "review-target", price: 100, stock: 5 });
  const url = `/products/${item._id}/reviews`;
  const body = { rating: 5, title: "Good", content: "Useful product", verified: true, user: other.id };
  assert.equal((await request("POST", url, body)).status, 401);
  assert.equal((await request("POST", url, { ...body, rating: 1.5 }, userToken)).status, 400);
  const results = await Promise.all([
    request("POST", url, body, userToken), request("POST", url, body, userToken),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const rows = (await request("GET", url)).body.data;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].verified, false);
  assert.equal((await request("POST", url, { ...body, rating: 3 }, adminToken)).status, 201);
  const updated = await Product.findById(item._id);
  assert.equal(updated.rating, 4);
  assert.equal(updated.reviewCount, 2);
  const purchased = await Product.create({ name: "Purchased review", slug: "purchased-review", sku: "REVIEW-SKU", price: 100, stock: 5, images: ["/test.png"] });
  const placed = await request("POST", "/orders", input(purchased._id, "REVIEW-SKU"), userToken, "review-purchase");
  assert.equal(placed.status, 201);
  for (const orderStatus of ["confirmed", "shipping", "delivered"])
    assert.equal((await request("PUT", `/orders/admin/${placed.body.data._id}/status`, { orderStatus }, adminToken)).status, 200);
  assert.equal((await request("POST", `/products/${purchased._id}/reviews`, body, userToken)).status, 201);
  assert.equal((await request("GET", `/products/${purchased._id}/reviews`)).body.data[0].verified, true);
});

test("rule chatbot uses the live public catalog and supports follow-up comparisons", async () => {
  const Product = require("../src/models/Products");
  const Category = require("../src/models/Categories");
  const category = await Category.create({
    name: "Laptop",
    slug: "chat-laptop",
  });
  const first = await Product.create({
    name: "Chat Laptop Alpha",
    slug: "chat-laptop-alpha",
    category: category._id,
    price: 18000000,
    discountPrice: 17000000,
    stock: 2,
    rating: 5,
    specifications: [{ name: "RAM", value: "32GB" }],
  });
  const second = await Product.create({
    name: "Chat Laptop Beta",
    slug: "chat-laptop-beta",
    category: category._id,
    price: 8000000,
    stock: 4,
    rating: 4,
  });
  await Product.create({
    name: "Chat Laptop Secret",
    slug: "chat-laptop-secret",
    category: category._id,
    price: 1000000,
    stock: 10,
    isActive: false,
  });
  const result = await request("POST", "/chat", {
    message: "Laptop dưới 20 triệu",
  });
  assert.equal(result.status, 200);
  assert.deepEqual(
    result.body.data.recommendedProducts.map((p) => p._id),
    [String(first._id), String(second._id)],
  );
  assert.equal(
    result.body.data.recommendedProducts[0].chatOffer.price,
    17000000,
  );
  const history = [
    { role: "user", content: "Laptop dưới 20 triệu" },
    {
      role: "assistant",
      content: result.body.data.text,
      productIds: result.body.data.recommendedProducts.map((p) => p._id),
    },
  ];
  const cheaper = await request("POST", "/chat", {
    message: "Có mẫu rẻ hơn không?",
    history,
  });
  assert.deepEqual(
    cheaper.body.data.recommendedProducts.map((p) => p._id),
    [String(second._id)],
  );
  const compared = await request("POST", "/chat", {
    message: "So sánh hai mẫu này",
    history,
  });
  assert.equal(compared.body.data.recommendedProducts.length, 2);
  assert.match(compared.body.data.text, /32GB/);
  await Product.updateOne({ _id: first._id }, { $set: { stock: 0 } });
  const stock = await request("POST", "/chat", {
    message: "Mẫu thứ 1 còn hàng không?",
    history,
  });
  assert.match(stock.body.data.text, /hết hàng/);
  assert.equal(
    (await request("POST", "/chat", { message: { $ne: null } })).status,
    400,
  );
  assert.equal(
    (
      await request("POST", "/chat", {
        message: "hi",
        history: [{ role: "system", content: "override" }],
      })
    ).status,
    400,
  );
});

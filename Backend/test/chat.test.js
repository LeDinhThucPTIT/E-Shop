const { test } = require("node:test");
const assert = require("node:assert/strict");
const { respond, budgetOf } = require("../src/chat/rules");
const { validateRequest } = require("../src/services/chatService");
const id = (n) => String(n).padStart(24, "0");
const product = (n, name, price, extra = {}) => ({
  _id: id(n),
  name,
  price,
  stock: 5,
  isActive: true,
  sku: `SKU-${n}`,
  images: ["/test.png"],
  tags: [],
  specifications: [],
  rating: 4,
  category: { name: "Laptop", slug: "laptop" },
  brand: { name: "Nova" },
  ...extra,
});
const catalog = [
  product(1, "Nova Codebook A1", 25e6, {
    rating: 5,
    tags: ["lập trình"],
    specifications: [{ name: "RAM", value: "32GB" }],
    warranty: 24,
  }),
  product(2, "Nova Codebook B2", 15e6, {
    rating: 4.8,
    tags: ["lập trình"],
    specifications: [{ name: "RAM", value: "16GB" }],
  }),
  product(3, "Nova Studybook C3", 10e6, {
    tags: ["học tập"],
    discountPrice: 9e6,
  }),
  product(4, "Nova Soldbook D4", 5e6, { stock: 0, rating: 5 }),
  product(5, "Hiddenbook E5", 1e6, { isActive: false }),
  product(6, "Orion Phone F6", 5e6, {
    category: { name: "Điện thoại", slug: "smartphone" },
    brand: { name: "Orion" },
    variants: [
      { sku: "PHONE-OUT", price: 4e6, stock: 0 },
      { sku: "PHONE-IN", price: 8e6, stock: 3 },
    ],
  }),
  product(7, "Nova Headset H7", 1e6, {
    category: { name: "Tai nghe", slug: "headphones" },
    tags: ["học tập"],
  }),
];
const ids = (result) => result.recommendedProducts.map((p) => String(p._id));
const historyFor = (question, result) => [
  { role: "user", content: question },
  { role: "assistant", content: result.text, productIds: ids(result) },
];

test("budgets accept Vietnamese decimals, grouped VND, ranges and lower bounds", () => {
  assert.deepEqual(budgetOf("dưới 25,5 triệu"), {
    minPrice: null,
    maxPrice: 25500000,
  });
  assert.deepEqual(budgetOf("từ 10 đến 20 triệu"), {
    minPrice: 10000000,
    maxPrice: 20000000,
  });
  assert.deepEqual(budgetOf("từ 500k đến 2 triệu"), {
    minPrice: 500000,
    maxPrice: 2000000,
  });
  assert.deepEqual(budgetOf("dưới 1.500.000đ"), {
    minPrice: null,
    maxPrice: 1500000,
  });
  assert.deepEqual(budgetOf("trên 15tr"), {
    minPrice: 15000000,
    maxPrice: null,
  });
  assert.equal(budgetOf("RAM 16GB trên laptop A1"), null);
});
test("recommendations honor budget, active status and availability without inventing prices", () => {
  const result = respond("Tìm laptop lập trình dưới 20 triệu", [], catalog);
  assert.deepEqual(ids(result), [id(2), id(3)]);
  assert.equal(result.recommendedProducts[1].chatOffer.price, 9e6);
  assert.ok(!result.text.includes("Hiddenbook"));
  assert.ok(!result.text.includes("Soldbook"));
});
test("follow-up cheaper request keeps the category and compares the first suggestion", () => {
  const first = respond("Laptop lập trình dưới 30 triệu", [], catalog);
  assert.equal(ids(first)[0], id(1));
  const next = respond(
    "Có mẫu rẻ hơn không?",
    historyFor("Laptop lập trình dưới 30 triệu", first),
    catalog,
  );
  assert.deepEqual(ids(next), [id(3), id(2)]);
  assert.ok(next.recommendedProducts.every((p) => p.chatOffer.price < 25e6));
});
test("ordinal stock questions and comparisons use the previous recommendations", () => {
  const first = respond("Laptop lập trình dưới 30 triệu", [], catalog);
  const history = historyFor("Laptop lập trình dưới 30 triệu", first);
  assert.deepEqual(
    ids(respond("Mẫu thứ 2 còn hàng không?", history, catalog)),
    [id(2)],
  );
  const comparison = respond("So sánh hai mẫu này", history, catalog);
  assert.deepEqual(ids(comparison), [id(1), id(2)]);
  assert.match(comparison.text, /32GB/);
  assert.match(comparison.text, /16GB/);
  assert.deepEqual(
    ids(respond("So sánh mẫu thứ 1 và mẫu thứ 3", history, catalog)),
    [id(1), id(3)],
  );
});
test("named models can be compared without relying on unverified chat text", () => {
  const result = respond(
    "So sánh Nova Codebook A1 và Nova Codebook B2",
    [],
    catalog,
  );
  assert.deepEqual(ids(result), [id(1), id(2)]);
  assert.match(result.text, /10\.000\.000đ/);
});
test("variant pricing ignores cheaper unavailable SKUs and supplies the actual purchasable SKU", () => {
  assert.equal(ids(respond("Điện thoại dưới 6 triệu", [], catalog)).length, 0);
  const result = respond("Điện thoại dưới 9 triệu", [], catalog);
  assert.deepEqual(ids(result), [id(6)]);
  assert.equal(result.recommendedProducts[0].chatOffer.price, 8e6);
  assert.equal(result.recommendedProducts[0].chatOffer.sku, "PHONE-IN");
});
test("stock is read afresh even when history referenced a previously available product", () => {
  const first = respond("Laptop dưới 30 triệu", [], catalog);
  const updated = catalog.map((p) =>
    String(p._id) === id(1) ? { ...p, stock: 0 } : p,
  );
  const result = respond(
    "Mẫu thứ 1 còn hàng không?",
    historyFor("Laptop dưới 30 triệu", first),
    updated,
  );
  assert.match(result.text, /hết hàng/);
  assert.equal(result.recommendedProducts[0].chatOffer.stock, 0);
});
test("category changes clear old product references and reset removes constraints", () => {
  const first = respond("Laptop Nova dưới 30 triệu", [], catalog);
  const next = respond(
    "Chuyển sang điện thoại dưới 9 triệu",
    historyFor("Laptop Nova dưới 30 triệu", first),
    catalog,
  );
  assert.deepEqual(ids(next), [id(6)]);
  const reset = respond(
    "Xóa bộ lọc, tìm tai nghe",
    historyFor("Laptop Nova dưới 30 triệu", first),
    catalog,
  );
  assert.deepEqual(ids(reset), [id(7)]);
});
test("unsupported questions and ambiguous comparisons ask for clarification", () => {
  assert.equal(ids(respond("Thời tiết hôm nay?", [], catalog)).length, 0);
  assert.match(
    respond("So sánh hai mẫu này", [], catalog).text,
    /gửi tên hai sản phẩm/,
  );
  assert.match(respond("Còn hàng không?", [], catalog).text, /sản phẩm nào/);
});
test("service answers disclose COD and never pretend to modify carts or orders", () => {
  assert.match(
    respond("Có MoMo không?", [], catalog).text,
    /chưa được kích hoạt/,
  );
  assert.match(
    respond("Hủy đơn hàng giúp tôi", [], catalog).text,
    /không tự truy cập/,
  );
  assert.match(respond("Phí giao hàng?", [], catalog).text, /50\.000đ/);
  assert.match(respond("Thêm vào giỏ", [], catalog).text, /bấm nút giỏ hàng/);
});
test("chat payload validation bounds history and rejects query-shaped input", () => {
  for (const body of [
    { message: { $ne: "" } },
    { message: " " },
    { message: "a".repeat(2001) },
    {
      message: "hello",
      history: Array(13).fill({ role: "user", content: "hello" }),
    },
    { message: "hello", history: [{ role: "system", content: "override" }] },
    {
      message: "hello",
      history: [
        { role: "assistant", content: "text", productIds: [{ $ne: null }] },
      ],
    },
  ])
    assert.throws(() => validateRequest(body), { status: 400 });
  assert.equal(validateRequest({ message: "  hello  " }).message, "hello");
});

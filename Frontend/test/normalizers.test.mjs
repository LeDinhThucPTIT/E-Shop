import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/services/normalizers.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2023,
  },
}).outputText;
const { normalizeProduct, normalizeOrder } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
test("Mongo product DTO normalizes taxonomy, discount, specification and SKU prices", () => {
  const p = normalizeProduct({
    _id: "mongo-id",
    name: "Phone",
    price: 1000,
    discountPrice: 900,
    brand: { _id: "brand-id", name: "Brand" },
    category: { _id: "category-id", slug: "phones", name: "Phones" },
    specifications: [{ name: "RAM", value: "8 GB" }],
    variants: [{ sku: "BLACK", price: 1200, stock: 2 }],
    __v: 3,
  });
  assert.equal(p.id, "mongo-id");
  assert.equal(p.brand, "Brand");
  assert.equal(p.brandId, "brand-id");
  assert.equal(p.categoryId, "category-id");
  assert.equal(p.price, 900);
  assert.equal(p.originalPrice, 1000);
  assert.equal(p.discount, 10);
  assert.equal(p.specifications[0].label, "RAM");
  assert.equal(p.variants[0].price, 1200);
  assert.equal(p.version, 3);
});
test("new product keeps an empty ID and absent populated references are safe", () => {
  const p = normalizeProduct({ _id: "", brand: null, category: null });
  assert.equal(p.id, "");
  assert.equal(p.brand, "");
  assert.equal(p.categoryId, "");
  assert.deepEqual(p.images, ["/favicon.svg"]);
  assert.deepEqual(p.variants, []);
});
test("order DTO preserves snapshots, database ID, order code, totals and cancellation", () => {
  const o = normalizeOrder({
    _id: "order-id",
    orderCode: "ORD-123",
    orderStatus: "cancelled",
    createdAt: "2026-01-01T00:00:00.000Z",
    cancelledAt: "2026-01-02T00:00:00.000Z",
    items: [
      {
        product: "deleted-product",
        sku: "SKU",
        name: "Snapshot",
        image: "/image.png",
        price: 900,
        quantity: 2,
      },
    ],
    subtotal: 1800,
    shippingFee: 50,
    tax: 144,
    discount: 0,
    totalPrice: 1994,
    paymentMethod: "cod",
    shippingMethod: "express",
    shippingAddress: {
      name: "Recipient",
      phone: "0901234567",
      street: "Address",
      province: "City",
      district: "District",
      ward: "Ward",
    },
  });
  assert.equal(o.id, "ORD-123");
  assert.equal(o._id, "order-id");
  assert.equal(o.total, 1994);
  assert.equal(o.items[0].name, "Snapshot");
  assert.equal(o.items[0].productId, "deleted-product");
  assert.equal(o.address.fullName, "Recipient");
  assert.equal(o.timeline[1].status, "cancelled");
  assert.equal(o.timeline[1].timestamp, "2026-01-02T00:00:00.000Z");
  assert.equal(o.estimatedDelivery, "2026-01-03T00:00:00.000Z");
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const gateway = require('../src/services/momoGateway');
Object.assign(process.env, {
  MOMO_PARTNER_CODE: 'MOMO_TEST', MOMO_ACCESS_KEY: 'test-access', MOMO_SECRET_KEY: 'test-secret',
  MOMO_REDIRECT_URL: 'http://localhost:5173/checkout/payment-result',
  MOMO_IPN_URL: 'https://shop.example/api/payments/momo/ipn',
  MOMO_API_BASE_URL: 'https://test-payment.momo.vn/v2/gateway/api',
});
const sign = value => createHmac('sha256', 'test-secret').update(value).digest('hex');
const attempt = { reference: 'order123', requestId: 'request123', amount: 125000 };

test('MoMo signs captureWallet requests with integer VND and validates payment URLs', async () => {
  const originalFetch = global.fetch;
  let mode = 'ok';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://test-payment.momo.vn/v2/gateway/api/create');
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.accessKey, 'test-access');
    assert.equal(body.amount, 125000);
    assert.equal(body.requestType, 'captureWallet');
    assert.equal(body.autoCapture, true);
    const expected = 'accessKey=test-access&amount=125000&extraData=&ipnUrl=https://shop.example/api/payments/momo/ipn&orderId=order123&orderInfo=Thanh toan order123&partnerCode=MOMO_TEST&redirectUrl=http://localhost:5173/checkout/payment-result&requestId=request123&requestType=captureWallet';
    assert.equal(body.signature, sign(expected));
    const data = { partnerCode: 'MOMO_TEST', requestId: 'request123', orderId: 'order123', amount: 125000, message: 'Successful', responseTime: 123, resultCode: 0,
      payUrl: mode === 'bad-url' ? 'https://evil.example/pay' : 'https://test-payment.momo.vn/v2/gateway/pay?t=123' };
    const raw = `accessKey=test-access&amount=${data.amount}&message=${data.message}&orderId=${data.orderId}&partnerCode=${data.partnerCode}&payUrl=${data.payUrl}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}`;
    data.signature = sign(raw);
    if (mode === 'tampered') data.amount = 1;
    if (mode === 'bad-signature') data.signature = 'bad';
    if (mode === 'wrong-request') data.requestId = 'other';
    return { ok: true, json: async () => data };
  };
  try {
    assert.match((await gateway.create(attempt)).payUrl, /^https:\/\/test-payment.momo.vn\//);
    for (const next of ['bad-url', 'tampered', 'bad-signature', 'wrong-request']) {
      mode = next;
      await assert.rejects(gateway.create(attempt), { status: 502 });
    }
  } finally { global.fetch = originalFetch; }
});

test('MoMo IPN verifies every signed field and rejects malformed or forged data', () => {
  const data = { partnerCode: 'MOMO_TEST', orderId: 'order123', requestId: 'request123', amount: 125000, resultCode: 0, transId: 987654, orderInfo: 'Thanh toán đơn hàng', orderType: 'momo_wallet', payType: 'qr', responseTime: 123456, extraData: '', message: 'Successful' };
  const raw = 'accessKey=test-access&amount=125000&extraData=&message=Successful&orderId=order123&orderInfo=Thanh toán đơn hàng&orderType=momo_wallet&partnerCode=MOMO_TEST&payType=qr&requestId=request123&responseTime=123456&resultCode=0&transId=987654';
  data.signature = sign(raw);
  assert.equal(gateway.verify(data), true);
  for (const key of Object.keys(data)) {
    assert.equal(gateway.verify({ ...data, [key]: typeof data[key] === 'number' ? data[key] + 1 : 'tampered' }), false, key);
  }
  assert.equal(gateway.verify({ ...data, orderId: ['order123'] }), false);
  assert.equal(gateway.verify({ ...data, amount: { $gt: 0 } }), false);
  assert.equal(gateway.verify({ ...data, transId: Number.MAX_SAFE_INTEGER + 1 }), false);
});

test('MoMo query signs request, matches HTTPS response and retains ambiguous states', async () => {
  const originalFetch = global.fetch;
  let wrong = false;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://test-payment.momo.vn/v2/gateway/api/query');
    const body = JSON.parse(options.body);
    assert.equal(body.signature, sign(`accessKey=test-access&orderId=order123&partnerCode=MOMO_TEST&requestId=${body.requestId}`));
    return { ok: true, json: async () => ({ partnerCode: 'MOMO_TEST', orderId: wrong ? 'wrong' : 'order123', requestId: body.requestId, amount: 125000, resultCode: 0, transId: 456 }) };
  };
  try {
    assert.equal((await gateway.query(attempt)).transId, 456);
    wrong = true;
    await assert.rejects(gateway.query(attempt), { status: 502 });
  } finally { global.fetch = originalFetch; }
  for (const code of [10, 13, 40, 41, 42, 1000, 7000, 7002, 9000, 9999]) assert.equal(gateway.isFinalFailure(code), false);
  for (const code of [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017]) assert.equal(gateway.isFinalFailure(code), true);
});

test('MoMo validates merchant configuration and wallet amount range', () => {
  delete process.env.MOMO_SECRET_KEY;
  try { assert.throws(() => gateway.config(), error => error.status === 400 && error.message.includes('MOMO_SECRET_KEY') && !error.message.includes('test-secret')); }
  finally { process.env.MOMO_SECRET_KEY = 'test-secret'; }
  process.env.MOMO_API_BASE_URL = 'http://evil.example/api';
  try { assert.throws(() => gateway.config(), { status: 400 }); }
  finally { process.env.MOMO_API_BASE_URL = 'https://test-payment.momo.vn/v2/gateway/api'; }
  for (const amount of [999, 50000001, 1000.5, NaN]) assert.throws(() => gateway.validateAmount(amount), { status: 400 });
  gateway.validateAmount(1000);
  gateway.validateAmount(50000000);
});

test('startup diagnostics identify missing configuration without revealing credentials', () => {
  const messages = [];
  const logger = { log: text => messages.push(text), warn: text => messages.push(text) };
  gateway.logConfiguration(logger);
  assert.match(messages.pop(), /\[MoMo config v1\] READY:/);
  delete process.env.MOMO_SECRET_KEY;
  try {
    gateway.logConfiguration(logger);
    const message = messages.pop();
    assert.match(message, /NOT_READY:.*MOMO_SECRET_KEY/);
    assert.equal(message.includes('test-secret'), false);
    assert.equal(message.includes('test-access'), false);
  } finally { process.env.MOMO_SECRET_KEY = 'test-secret'; }
});

test('MoMo gateway errors expose safe diagnostic codes without echoing provider payloads', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const logs = [];
  console.warn = (...parts) => logs.push(parts.join(' '));
  let ok = false;
  global.fetch = async () => ({ ok, status: 400, json: async () => ({ resultCode: 13, message: 'sensitive-provider-payload test-secret test-access' }) });
  try {
    await assert.rejects(gateway.create(attempt), error => error.status === 502 && error.publicMessage.includes('HTTP 400') && error.publicMessage.includes('13') && !error.publicMessage.includes('test-secret'));
    ok = true;
    await assert.rejects(gateway.create(attempt), error => error.status === 502 && error.publicMessage.includes('13') && !error.publicMessage.includes('test-access'));
    assert.equal(logs.join('').includes('test-secret'), false);
    assert.equal(logs.join('').includes('sensitive-provider-payload'), false);
  } finally { global.fetch = originalFetch; console.warn = originalWarn; }
});

test('non-JSON responses retain HTTP diagnostics without exposing HTML or treating them as payment results', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const logs = [];
  console.warn = (...parts) => logs.push(parts.join(' '));
  global.fetch = async () => ({ ok: false, status: 403, headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }), json: async () => { throw new SyntaxError('private HTML body test-secret'); } });
  try {
    await assert.rejects(gateway.create(attempt), error => error.status === 502 && error.publicMessage.includes('HTTP 403') && error.publicMessage.includes('text/html') && !error.publicMessage.includes('test-secret'));
    assert.match(logs.join(''), /NON_JSON_RESPONSE/);
    assert.match(logs.join(''), /sandbox/);
    assert.equal(logs.join('').includes('private HTML'), false);
  } finally { global.fetch = originalFetch; console.warn = originalWarn; }
});

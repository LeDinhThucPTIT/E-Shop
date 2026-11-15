const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const https = require('node:https');
const transport = require('../src/services/momoTransport');

test('native MoMo HTTPS sends byte-accurate JSON and parses only after all chunks arrive', async () => {
  const original = https.request;
  const body = JSON.stringify({ orderInfo: 'Thanh toán đơn hàng', amount: 50000 });
  https.request = (url, options, callback) => {
    assert.equal(url.hostname, 'test-payment.momo.vn');
    assert.equal(url.pathname, '/v2/gateway/api/create');
    assert.equal(options.headers['Content-Length'], Buffer.byteLength(body));
    assert.equal(options.headers['Content-Type'], 'application/json');
    const req = new EventEmitter();
    req.end = sent => {
      assert.equal(sent, body);
      queueMicrotask(() => {
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headers = { 'content-type': 'application/json' };
        callback(res);
        const response = Buffer.from(JSON.stringify({ resultCode: 0, message: 'Thành công', payUrl: 'https://test-payment.momo.vn/pay' }));
        // Split every byte, including multibyte Vietnamese characters.
        for (const byte of response) res.emit('data', Buffer.from([byte]));
        res.emit('end');
      });
    };
    return req;
  };
  try {
    const response = await transport.request('https://test-payment.momo.vn/v2/gateway/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
    assert.equal((await response.json()).message, 'Thành công');
  } finally { https.request = original; }
});

test('native MoMo HTTPS retains HTML 403 metadata for gateway diagnostics', async () => {
  const original = https.request;
  https.request = (_url, _options, callback) => {
    const req = new EventEmitter();
    req.end = () => queueMicrotask(() => {
      const res = new EventEmitter();
      res.statusCode = 403; res.headers = { 'content-type': 'text/html' };
      callback(res); res.emit('data', Buffer.from('<html>Forbidden</html>')); res.emit('end');
    });
    return req;
  };
  try {
    const response = await transport.request('https://test-payment.momo.vn/v2/gateway/api/create', { method: 'POST', headers: {}, body: '{}' });
    assert.equal(response.ok, false);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('content-type'), 'text/html');
    await assert.rejects(response.json(), SyntaxError);
  } finally { https.request = original; }
});

const { createHmac, timingSafeEqual, randomBytes } = require('node:crypto');
const { fail } = require('../utils/http');

function config() {
  const partnerCode = process.env.MOMO_PARTNER_CODE?.trim();
  const accessKey = process.env.MOMO_ACCESS_KEY?.trim();
  const secretKey = process.env.MOMO_SECRET_KEY?.trim();
  const redirectUrl = process.env.MOMO_REDIRECT_URL?.trim();
  const ipnUrl = process.env.MOMO_IPN_URL?.trim();
  const required = { MOMO_PARTNER_CODE: partnerCode, MOMO_ACCESS_KEY: accessKey, MOMO_SECRET_KEY: secretKey, MOMO_REDIRECT_URL: redirectUrl, MOMO_IPN_URL: ipnUrl };
  const missing = Object.keys(required).filter(key => !required[key]);
  if (missing.length)
    throw fail(400, `MoMo chưa được cấu hình. Backend chưa nhận được: ${missing.join(', ')}. Vui lòng kiểm tra Environment và triển khai lại backend.`);
  const apiBase = (process.env.MOMO_API_BASE_URL || 'https://test-payment.momo.vn/v2/gateway/api').replace(/\/$/, '');
  try {
    if (!['https://test-payment.momo.vn/v2/gateway/api', 'https://payment.momo.vn/v2/gateway/api'].includes(apiBase)) throw new Error();
    for (const value of [redirectUrl, ipnUrl]) {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error();
    }
  } catch { throw fail(400, 'Cấu hình URL MoMo không hợp lệ'); }
  return { partnerCode, accessKey, secretKey, redirectUrl, ipnUrl, apiBase };
}
function logConfiguration(logger = console) {
  // The fixed marker identifies deployments with diagnostics; never log credentials.
  try {
    config();
    logger.log('[MoMo config v1] READY: da nhan du bien va URL hop le; chua kiem tra ket noi MoMo.');
  } catch (error) {
    logger.warn(`[MoMo config v1] NOT_READY: ${error.message}`);
  }
}
const raw = (fields, data) => fields.map(key => `${key}=${data[key] ?? ''}`).join('&');
const hash = (data, secret) => createHmac('sha256', secret).update(data, 'utf8').digest('hex');
const ipnFields = ['accessKey', 'amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId'];
const createFields = ['accessKey', 'amount', 'extraData', 'ipnUrl', 'orderId', 'orderInfo', 'partnerCode', 'redirectUrl', 'requestId', 'requestType'];
const createResponseFields = ['accessKey', 'amount', 'message', 'orderId', 'partnerCode', 'payUrl', 'requestId', 'responseTime', 'resultCode'];
function equalHash(actual, expected) {
  return typeof actual === 'string' && /^[a-f0-9]{64}$/i.test(actual) &&
    timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
const integer = value => (typeof value === 'number' || typeof value === 'string') && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value));
function verify(params) {
  if (!params || ipnFields.slice(1).some(key => !['string', 'number'].includes(typeof params[key]))) return false;
  const cfg = config();
  return params.partnerCode === cfg.partnerCode && integer(params.amount) && integer(params.resultCode) && integer(params.transId) && integer(params.responseTime) &&
    equalHash(params.signature, hash(raw(ipnFields, { ...params, accessKey: cfg.accessKey }), cfg.secretKey));
}
function validateAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 50000000)
    throw fail(400, 'MoMo hỗ trợ số tiền từ 1.000đ đến 50.000.000đ. Vui lòng chọn COD cho đơn này.');
}
async function post(path, body) {
  const cfg = config();
  // No redirects: credentials must only be sent to the configured MoMo API.
  const response = await fetch(`${cfg.apiBase}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw fail(502, 'Chưa thể kết nối MoMo. Giao dịch sẽ được kiểm tra lại.');
  return response.json();
}
function matches(data, payment, requestId) {
  return data && data.partnerCode === config().partnerCode && data.orderId === payment.reference && data.requestId === requestId &&
    integer(data.amount) && Number(data.amount) === payment.amount && integer(data.resultCode);
}
async function create(payment) {
  const cfg = config();
  validateAmount(payment.amount);
  const body = { partnerCode: cfg.partnerCode, accessKey: cfg.accessKey, requestId: payment.requestId, orderId: payment.reference, amount: payment.amount,
    orderInfo: `Thanh toan ${payment.reference}`, redirectUrl: cfg.redirectUrl, ipnUrl: cfg.ipnUrl,
    requestType: 'captureWallet', extraData: '', autoCapture: true, lang: 'vi' };
  body.signature = hash(raw(createFields, { ...body, accessKey: cfg.accessKey }), cfg.secretKey);
  const data = await post('create', body);
  if (!matches(data, payment, payment.requestId)) throw fail(502, 'Phản hồi MoMo không khớp giao dịch');
  // Some merchant responses omit signature; HTTPS and request correlation still apply.
  if (data.signature !== undefined && !equalHash(data.signature, hash(raw(createResponseFields, { ...data, accessKey: cfg.accessKey }), cfg.secretKey)))
    throw fail(502, 'Chữ ký phản hồi MoMo không hợp lệ');
  if (Number(data.resultCode) === 0) {
    let url;
    try { url = new URL(data.payUrl); } catch { throw fail(502, 'MoMo chưa trả về đường dẫn thanh toán hợp lệ'); }
    if (url.origin !== new URL(cfg.apiBase).origin || url.username || url.password)
      throw fail(502, 'Đường dẫn thanh toán MoMo không hợp lệ');
  }
  return data;
}
async function query(payment) {
  const cfg = config();
  const body = { partnerCode: cfg.partnerCode, requestId: randomBytes(16).toString('hex'), orderId: payment.reference, lang: 'vi' };
  body.signature = hash(raw(['accessKey', 'orderId', 'partnerCode', 'requestId'], { ...body, accessKey: cfg.accessKey }), cfg.secretKey);
  const data = await post('query', body);
  // Query responses are correlated over HTTPS; the query API does not specify a response signature.
  if (!matches(data, payment, body.requestId)) throw fail(502, 'Phản hồi đối soát MoMo không khớp giao dịch');
  return data;
}
// Only payment failures, never maintenance/authentication/not-found/processing errors.
const isFinalFailure = code => [98, 99, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 4001, 4002, 4100].includes(Number(code));
module.exports = { config, logConfiguration, raw, hash, verify, validateAmount, create, query, integer, isFinalFailure };

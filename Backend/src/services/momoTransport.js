const https = require('node:https');

// Native HTTPS, as in MoMo's Node.js sample. Never follows redirects.
function request(url, options) {
  return new Promise((resolve, reject) => {
    const body = options.body;
    const req = https.request(new URL(url), {
      method: options.method,
      headers: { ...options.headers, 'Content-Length': Buffer.byteLength(body) },
      signal: options.signal,
    }, res => {
      const chunks = [];
      let size = 0;
      res.on('data', chunk => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > 1024 * 1024) {
          req.destroy(new Error('MoMo response exceeds size limit'));
          return;
        }
        chunks.push(buffer);
      });
      res.on('error', reject);
      res.on('aborted', () => reject(new Error('MoMo response interrupted')));
      res.on('end', () => {
        if (size > 1024 * 1024) return;
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: { get: key => {
            const value = res.headers[key.toLowerCase()];
            return Array.isArray(value) ? value.join(', ') : value || null;
          } },
          json: async () => JSON.parse(text),
        });
      });
    });
    req.on('error', reject);
    req.end(body);
  });
}
module.exports = { request };

const path = require('node:path');
const dotenv = require('dotenv');

// Hosting variables take precedence, then local overrides, then file defaults.
const backendRoot = path.resolve(__dirname, '../..');
for (const filename of ['.env.local', '.env']) {
  dotenv.config({ path: path.join(backendRoot, filename), quiet: true });
}

// Lighter-weight scaffold check: no live MongoDB is reachable from this
// sandbox, so this verifies the app boots (every route/controller file
// requires cleanly, no typos) and exercises non-DB paths: root route,
// 404 handler, and validation-before-DB rejections. Not a substitute for
// running `npm run dev` against a real MongoDB, which the user should do.
process.env.JWT_SECRET = 'boot_check_secret';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/unused';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
// Stub out the DB connection so server.js's connectDB() no-ops instead of
// trying (and failing) to reach a real Mongo instance.
mongoose.connect = async () => ({ connection: { host: 'stubbed' } });

const app = require('../server');
const http = require('http');
const server = http.createServer(app);

server.listen(0, async () => {
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const results = [];

  async function call(label, method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    results.push({ label, status: res.status, json });
  }

  await call('root route', 'GET', '/');
  await call('unknown route -> 404 JSON', 'GET', '/api/does-not-exist');
  await call('register missing fields -> 400 (validation runs before DB)', 'POST', '/api/auth/register', { email: 'not-an-email' });
  await call('login missing fields -> 400', 'POST', '/api/auth/login', {});
  await call('protected route no token -> 401', 'POST', '/api/categories', { name: 'X' });
  await call('protected route no token -> 401 (cart)', 'GET', '/api/cart');
  await call('bad objectId in query -> 400', 'GET', '/api/products?categoryId=not-an-id');

  console.log('\n=== BOOT CHECK RESULTS ===');
  let ok = true;
  for (const r of results) {
    console.log(`[${r.status}] ${r.label}`);
    if (r.status >= 500) ok = false;
  }
  console.log(ok ? '\nAll routes responded without a 5xx / crash.' : '\nSome routes returned 5xx — see above.');

  server.close();
  process.exit(ok ? 0 : 1);
});

server.on('error', (e) => {
  console.error('SERVER FAILED TO START:', e);
  process.exit(1);
});

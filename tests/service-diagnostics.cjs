const test = require('node:test');
const assert = require('node:assert/strict');
const { database, stripe } = require('../.test-build/membership-server.js');
test('provider failures record status without exposing request data or credentials', async () => {
  const oldFetch = global.fetch, oldError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-storage-key', STRIPE_SECRET_KEY: 'sk_test_private' });
  global.fetch = async () => new Response(JSON.stringify({ message: 'private@example.edu sk_test_private' }), { status: 401, headers: { 'request-id': 'req_fixture' } });
  try {
    await assert.rejects(database('bss_members?access_hash=eq.private'));
    await assert.rejects(stripe('checkout/sessions', new URLSearchParams({ customer_email: 'private@example.edu' })));
    assert.deepEqual(logs, [
      ['BSS_SERVICE_REQUEST_FAILED', { service: 'storage', status: 401 }],
      ['BSS_SERVICE_REQUEST_FAILED', { service: 'stripe', status: 401, requestId: 'req_fixture' }],
    ]);
    global.fetch = async () => { throw new Error('private request details'); };
    await assert.rejects(database('private'));
    assert.deepEqual(logs[2][1], { service: 'storage', status: 'network-error' });
  } finally { global.fetch = oldFetch; console.error = oldError; }
});

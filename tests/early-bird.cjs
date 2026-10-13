const test = require('node:test');
const assert = require('node:assert/strict');
const { membershipPrice, earlyBirdStartsAt, earlyBirdEndsAt } = require('../.test-build/membership.js');
test('early-bird boundaries use Calgary midnight and preserve historical reservation pricing', () => {
  const start = Date.parse(earlyBirdStartsAt), end = Date.parse(earlyBirdEndsAt);
  assert.equal(membershipPrice('new', start - 1), 1500);
  assert.equal(membershipPrice('new', start), 1000);
  assert.equal(membershipPrice('new', end - 1), 1000);
  assert.equal(membershipPrice('new', end), 1500);
  for (const at of [0, start, end]) assert.equal(membershipPrice('returning', at), 1000);
  assert.equal(new Date(end - 1).toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' }), '2026-10-31');
});
test('discounted payments activate only when the stored reservation qualifies', async () => {
  const { fulfillSession } = require('../.test-build/membership-server.js');
  const original = global.fetch;
  process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture';
  let created = earlyBirdStartsAt, patches = 0;
  global.fetch = async (url, options) => {
    if (String(url).includes('api.stripe.com')) return new Response(JSON.stringify({ payment_status: 'paid', livemode: false, mode: 'payment', metadata: { membership_year: '2026-2027', member_id: 'fixture' }, currency: 'cad', amount_total: 1000, payment_intent: { id: 'pi_fixture', latest_charge: { amount_refunded: 0, disputed: false } } }));
    if (options?.method === 'PATCH') { patches++; return new Response('[{}]'); }
    return new Response(JSON.stringify([{ id: 'fixture', plan: 'new', status: 'pending', created_at: created }]));
  };
  try {
    assert.equal(await fulfillSession('cs_test_fixture'), 'fixture');
    assert.equal(patches, 1);
    created = earlyBirdEndsAt;
    await assert.rejects(fulfillSession('cs_test_fixture'));
    assert.equal(patches, 1);
  } finally { global.fetch = original; }
});

test('extension preserves intervening full-price reservations and applies to new signups', () => {
  const { originalEarlyBirdEndsAt, earlyBirdExtensionStartsAt } = require('../.test-build/membership.js');
  const restart = Date.parse(earlyBirdExtensionStartsAt);
  assert.equal(membershipPrice('new', Date.parse(originalEarlyBirdEndsAt)), 1500);
  assert.equal(membershipPrice('new', restart - 1), 1500);
  assert.equal(membershipPrice('new', restart), 1000);
  assert.equal(membershipPrice('new', Date.parse('2026-11-01T05:59:59.999Z')), 1000);
  assert.equal(membershipPrice('new', Date.parse('2026-11-01T06:00:00Z')), 1500);
});

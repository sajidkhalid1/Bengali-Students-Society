const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const access = require('../.test-build/membership-access.js');
const { registrationEnabled } = require('../.test-build/membership-server.js');
const { openMemberCheckout } = require('../.test-build/member-checkout.js');

function configure() {
  Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture', STRIPE_WEBHOOK_SECRET: 'fixture', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture', MEMBER_DATA_KEY: randomBytes(32).toString('base64'), SITE_URL: 'https://example.org', RESEND_API_KEY: 'fixture', MEMBERSHIP_EMAIL_FROM: 'test@example.org', MEMBERSHIP_TEST_TOKEN: randomBytes(32).toString('hex'), MEMBERSHIP_TEST_EMAIL: 'test@example.org', MEMBERSHIP_EXPIRES_AT: '2099-09-01T06:00:00Z', MEMBERSHIP_ENABLED: 'false' });
}
test('private test access expires, rejects tampering, and never enables public test signup', () => {
  configure();
  assert.equal(access.canRegister(), false);
  assert.equal(access.validTestPassword('incorrect'), false);
  assert.equal(access.validTestPassword(process.env.MEMBERSHIP_TEST_TOKEN), true);
  const token = access.issueTestAccess();
  assert.equal(access.canRegister(token), true);
  assert.equal(access.hasTestAccess(token + 'x'), false);
  assert.equal(access.hasTestAccess(token, Date.now() + 3601000), false);
  process.env.MEMBERSHIP_ENABLED = 'true';
  assert.equal(registrationEnabled(), false);
  process.env.STRIPE_SECRET_KEY = 'sk_live_fixture'; process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_fixture';
  assert.equal(access.hasTestAccess(token), false);
  assert.equal(registrationEnabled(), true);
});
test('lost Stripe response is retried with identical parameters and idempotency key', async () => {
  configure();
  const original = global.fetch;
  const calls = [];
  const member = { id: 'fixture-id', plan: 'new', email: 'test@example.org', status: 'pending', created_at: new Date().toISOString() };
  global.fetch = async (url, options) => {
    if (String(url).includes('api.stripe.com')) {
      calls.push({ key: options.headers['Idempotency-Key'], body: options.body.toString(), version: options.headers['Stripe-Version'] });
      if (calls.length === 1) throw new Error('Response lost');
      return new Response(JSON.stringify({ id: 'cs_test_fixture', client_secret: 'cs_test_fixture_secret_example', livemode: false }));
    }
    return new Response('[{}]');
  };
  try {
    await assert.rejects(openMemberCheckout(member));
    await openMemberCheckout(member);
    assert.deepEqual(calls[0], calls[1]);
    const { membershipPrice } = require('../.test-build/membership.js');
    assert.equal(new URLSearchParams(calls[0].body).get('line_items[0][price_data][unit_amount]'), String(membershipPrice(member.plan, Date.parse(member.created_at))));
    await assert.rejects(openMemberCheckout({ ...member, created_at: '2000-01-01T00:00:00Z' }));
    assert.equal(calls.length, 2);
    const params = new URLSearchParams(calls[0].body);
    assert.equal(params.get('ui_mode'), 'form');
    assert.equal(params.get('metadata[member_id]'), member.id);
    assert.equal(params.get('customer_email'), member.email);
    assert.equal(params.get('return_url'), 'https://example.org/membership/card');
    for (const key of ['success_url','cancel_url','payment_method_types[0]','payment_method_collection']) assert.equal(params.has(key), false);
    assert.equal(params.get('automatic_tax[enabled]'), 'false');
    assert.equal(calls[0].version, '2026-03-25.dahlia; custom_checkout_payment_form_preview=v1');
  } finally { global.fetch = original; }
});

const { checkoutPresentation, stripeMode, publishableKeyMatches } = require('../.test-build/checkout-presentation.js');
test('embedded secrets are scoped to matching payment mode and only presentation fields leave server', () => {
  configure();
  const session = { id: 'cs_test_example', livemode: false, client_secret: 'cs_test_example_secret_example', metadata: { member_id: 'private' } };
  assert.deepEqual(checkoutPresentation(session), { client_secret: session.client_secret, publishable_key: 'pk_test_fixture' });
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_fixture';
  assert.equal(publishableKeyMatches(), false);
  assert.equal(access.canRegister(access.issueTestAccess()), false);
  assert.throws(() => checkoutPresentation(session));
  process.env.STRIPE_SECRET_KEY = 'rk_live_fixture';
  assert.equal(stripeMode(process.env.STRIPE_SECRET_KEY), 'live');
  assert.equal(publishableKeyMatches(), true);
  assert.throws(() => checkoutPresentation(session));
  process.env.MEMBERSHIP_ENABLED = 'true';
  assert.equal(registrationEnabled(), true);
});
test('legacy hosted sessions stay resumable but untrusted redirect URLs are rejected', () => {
  configure();
  const session = { id: 'cs_test_example', livemode: false, url: 'https://checkout.stripe.com/c/pay/example' };
  assert.deepEqual(checkoutPresentation(session), { url: session.url });
  assert.throws(() => checkoutPresentation({ ...session, url: 'https://malicious.example/' }));
  assert.throws(() => checkoutPresentation({ ...session, url: null }));
});

test('configuration diagnostics identify failures without exposing credentials', () => {
  configure();
  assert.deepEqual(access.testConfigurationIssues(), []);
  process.env.MEMBERSHIP_TEST_TOKEN = 'x'.repeat(32);
  assert.deepEqual(access.testConfigurationIssues(), []);
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_private_fixture';
  assert.ok(access.testConfigurationIssues().includes('stripe-key-mode-mismatch-or-invalid-prefix'));
  assert.equal(JSON.stringify(access.testConfigurationIssues()).includes('private_fixture'), false);
  configure();
  delete process.env.RESEND_API_KEY;
  assert.deepEqual(access.testConfigurationIssues(), ['missing:RESEND_API_KEY']);
  configure();
  process.env.MEMBERSHIP_TEST_TOKEN = 'short';
  assert.deepEqual(access.testConfigurationIssues(), ['test-token-shorter-than-32-characters']);
});

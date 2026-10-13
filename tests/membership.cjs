const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validateRegistration } = require('../.test-build/membership.js');
const { verifyStripeSignature, encryptStudentId, decryptStudentId, registrationEnabled, fulfillSession } = require('../.test-build/membership-server.js');
const { googleWallet, zipFiles } = require('../.test-build/wallet.js');

test('registration rejects malformed fields and missing consent', () => {
  const value = { fullName: 'Test Member', email: 'student@example.edu', studentId: '123456', plan: 'new', consent: true };
  assert.equal(validateRegistration(value).plan, 'new');
  for (const patch of [{ email: 'invalid' }, { fullName: ' ' }, { plan: 'discount' }, { studentId: '<script>' }, { consent: false }]) assert.throws(() => validateRegistration({ ...value, ...patch }));
});
test('registration stays closed unless explicitly enabled and configured', () => { delete process.env.MEMBERSHIP_ENABLED; assert.equal(registrationEnabled(), false); });
test('Stripe signatures reject replay and modified payloads', () => {
  process.env.STRIPE_WEBHOOK_SECRET = 'test-only-secret';
  const raw = '{"type":"checkout.session.completed"}';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = (time) => `t=${time},v1=${crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${time}.${raw}`).digest('hex')}`;
  assert.equal(verifyStripeSignature(raw, sign(timestamp)), true);
  assert.equal(verifyStripeSignature(raw + ' ', sign(timestamp)), false);
  assert.equal(verifyStripeSignature(raw, sign(timestamp - 600)), false);
  assert.equal(verifyStripeSignature(raw, 't=bad,v1=bad'), false);
});
test('student ID is encrypted with authenticated, randomized encryption', () => {
  process.env.MEMBER_DATA_KEY = crypto.randomBytes(32).toString('base64');
  const encrypted = encryptStudentId('123456789');
  assert.notEqual(encrypted, encryptStudentId('123456789'));
  const [iv, tag, data] = encrypted.split('.').map(value => Buffer.from(value, 'base64'));
  const decrypt = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.MEMBER_DATA_KEY, 'base64'), iv); decrypt.setAuthTag(tag);
  assert.equal(Buffer.concat([decrypt.update(data), decrypt.final()]).toString(), '123456789');
});
test('Google pass is RSA-signed and contains no student ID or email', () => {
  const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.GOOGLE_WALLET_PRIVATE_KEY = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
  process.env.GOOGLE_WALLET_ISSUER_ID = '123'; process.env.GOOGLE_WALLET_CLASS_ID = '123.test'; process.env.GOOGLE_WALLET_CLIENT_EMAIL = 'test@example.com';
  const member = { id: 'test-member', full_name: 'Test Member', email: 'private@example.edu', plan: 'new', expires_at: '2027-08-31T23:59:59Z' };
  const jwt = googleWallet(member).split('/').pop(); const [header, payload, signature] = jwt.split('.');
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), pair.publicKey, Buffer.from(signature, 'base64url')), true);
  const decoded = Buffer.from(payload, 'base64url').toString(); assert.equal(decoded.includes(member.email), false); assert.equal(decoded.includes('student_id'), false);
});
test('Apple bundle ZIP writes valid local and central records', () => {
  const bytes = zipFiles({ 'pass.json': Buffer.from('{"formatVersion":1}') });
  assert.equal(bytes.readUInt32LE(0), 0x04034b50); assert.equal(bytes.readUInt32LE(bytes.length - 22), 0x06054b50);
  const directory = bytes.readUInt32LE(bytes.length - 6); assert.equal(bytes.readUInt32LE(directory), 0x02014b50);
  assert.equal(bytes.readUInt16LE(bytes.length - 12), 1);
});
test('unpaid and mismatched payments never activate memberships; refunds revoke', async () => {
  const originalFetch = global.fetch;
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake'; process.env.SUPABASE_URL = 'https://example.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
  let patches = [];
  let session = { payment_status: 'unpaid' };
  global.fetch = async (url, options) => {
    if (String(url).includes('api.stripe.com')) return new Response(JSON.stringify(session));
    if (options?.method === 'PATCH') { patches.push(JSON.parse(options.body)); return new Response('[]'); }
    return new Response(JSON.stringify([{ id: 'test', plan: 'new', status: 'pending' }]));
  };
  try {
    await fulfillSession('cs_test_abc'); assert.equal(patches.length, 0);
    session = { payment_status: 'paid', livemode: false, mode: 'payment', metadata: { membership_year: '2026-2027', member_id: 'test' }, currency: 'cad', amount_total: 1000 };
    await assert.rejects(fulfillSession('cs_test_abc')); assert.equal(patches.length, 0);
    session.amount_total = 1500; session.payment_intent = { id: 'pi_test', latest_charge: { amount_refunded: 0, disputed: false } };
    await fulfillSession('cs_test_abc'); assert.equal(patches[0].status, 'active');
    session.payment_intent.latest_charge.amount_refunded = 1500;
    await fulfillSession('cs_test_abc'); assert.equal(patches[1].status, 'revoked');
  } finally { global.fetch = originalFetch; }
});

test('payments can launch without wallet accounts; wallets require opt-in', () => {
  const { walletEnabled } = require('../.test-build/membership-server.js');
  const snapshot = { ...process.env };
  try {
    Object.assign(process.env, { MEMBERSHIP_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk_live_fixture', STRIPE_PUBLISHABLE_KEY: 'pk_live_fixture', STRIPE_WEBHOOK_SECRET: 'test', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test', MEMBER_DATA_KEY: crypto.randomBytes(32).toString('base64'), SITE_URL: 'https://bssucalgary.app', RESEND_API_KEY: 'test', MEMBERSHIP_EMAIL_FROM: 'BSS <test@example.com>', MEMBERSHIP_EXPIRES_AT: new Date(Date.now() + 86400000).toISOString() });
    delete process.env.APPLE_WALLET_ENABLED; delete process.env.GOOGLE_WALLET_ENABLED;
    assert.equal(registrationEnabled(), true);
    assert.equal(walletEnabled('apple'), false); assert.equal(walletEnabled('google'), false);
    process.env.APPLE_WALLET_ENABLED = 'true'; delete process.env.APPLE_PASS_CERTIFICATE;
    assert.equal(walletEnabled('apple'), false);
    process.env.MEMBER_DATA_KEY = 'invalid'; assert.equal(registrationEnabled(), false);
    process.env.MEMBER_DATA_KEY = crypto.randomBytes(32).toString('base64');
    process.env.MEMBERSHIP_EXPIRES_AT = '2020-01-01'; assert.equal(registrationEnabled(), false);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in snapshot)) delete process.env[key];
    Object.assign(process.env, snapshot);
  }
});
const sharp = require('sharp');
const jsQR = require('jsqr');
const { memberCardPng, escapeMarkup, verificationUrl } = require('../.test-build/member-card.js');
const { deliverMembershipEmail } = require('../.test-build/membership-email.js');
const emailMember = { id: '7cc3b36b-5f80-4d73-8eb2-9b7b0fa623bb', full_name: 'Test <Member> & Friend', email: 'student@example.edu', plan: 'new', status: 'active', expires_at: '2099-09-01T06:00:00Z' };

test('card PNG contains a decodable live-verification QR and escapes member text', async () => {
  const png = await memberCardPng({ ...emailMember, student_id_encrypted: encryptStudentId("STUDENT-12345") });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1200); assert.equal(info.height, 900);
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.equal(result.data, verificationUrl(emailMember.id));
  assert.equal(result.data.includes(emailMember.email), false);
  assert.equal(result.data.includes("STUDENT-12345"), false);
  assert.equal(escapeMarkup('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

test('card email sends to the recorded address, records acceptance, and skips replay', async () => {
  const originalFetch = global.fetch;
  process.env.RESEND_API_KEY = 'test'; process.env.MEMBERSHIP_EMAIL_FROM = 'BSS <membership@example.com>';
  let accepted = false, sent = 0, request;
  global.fetch = async (url, options) => {
    if (String(url).includes('rpc/claim_bss_card_email')) return Response.json(accepted ? [] : [emailMember]);
    if (String(url).includes('api.resend.com')) { sent++; request = options; return Response.json({ id: 'email-test' }); }
    if (options?.method === 'PATCH') { const patch = JSON.parse(options.body); accepted = Boolean(patch.card_email_accepted_at); return Response.json([]); }
    return Response.json([{ ...emailMember, card_email_accepted_at: accepted ? new Date().toISOString() : null }]);
  };
  try {
    await deliverMembershipEmail(emailMember.id); await deliverMembershipEmail(emailMember.id);
    assert.equal(sent, 1); assert.equal(accepted, true);
    const body = JSON.parse(request.body);
    assert.deepEqual(body.to, [emailMember.email]);
    assert.equal(body.html.includes('<Member>'), false);
    assert.equal(body.attachments[0].filename.endsWith('.png'), true);
    assert.equal(Buffer.from(body.attachments[0].content, 'base64').subarray(1,4).toString(), 'PNG');
    assert.equal(request.headers['Idempotency-Key'], `bss-membership-card-v1/${emailMember.id}`);
  } finally { global.fetch = originalFetch; }
});

test('pending, revoked and expired memberships never cause an email send', async () => {
  const originalFetch = global.fetch;
  let sends = 0;
  try {
    for (const record of [{...emailMember, status:'pending'}, {...emailMember,status:'revoked'}, {...emailMember,expires_at:'2020-01-01'}]) {
      global.fetch = async (url) => { if (String(url).includes('api.resend.com')) { sends++; return Response.json({id:'bad'}); } if (String(url).includes('rpc/claim')) return Response.json([]); return Response.json([record]); };
      await deliverMembershipEmail(emailMember.id);
    }
    assert.equal(sends, 0);
  } finally { global.fetch = originalFetch; }
});

test('delivery failures stay retryable and do not mark a card email accepted', async () => {
  const originalFetch = global.fetch;
  let patches = 0;
  global.fetch = async (url, options) => {
    if (String(url).includes('rpc/claim')) return Response.json([emailMember]);
    if (String(url).includes('api.resend.com')) return new Response('unavailable',{status:503});
    if (options?.method === 'PATCH') patches++;
    return Response.json([]);
  };
  try { await assert.rejects(deliverMembershipEmail(emailMember.id)); assert.equal(patches,0); } finally { global.fetch = originalFetch; }
});


test('student ID decryption authenticates ciphertext and rejects corrupted data', () => {
  process.env.MEMBER_DATA_KEY = crypto.randomBytes(32).toString('base64');
  const encrypted = encryptStudentId('STUDENT-12345');
  assert.equal(decryptStudentId(encrypted), 'STUDENT-12345');
  const parts = encrypted.split('.');
  parts[2] = Buffer.alloc(Buffer.from(parts[2], 'base64').length).toString('base64');
  assert.throws(() => decryptStudentId(parts.join('.')));
  assert.throws(() => decryptStudentId('malformed'));
});

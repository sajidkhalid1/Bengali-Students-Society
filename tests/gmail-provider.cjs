const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { membershipEmailConfigurationIssues, sendMembershipCardEmail } = require('../.test-build/membership-email-provider.js');
const { membershipConfigurationIssues } = require('../.test-build/membership-server.js');
function configure() {
  Object.assign(process.env, { MEMBERSHIP_EMAIL_PROVIDER:'gmail', GMAIL_USER:'bengalistudentssociety@gmail.com', GMAIL_APP_PASSWORD:'aaaa bbbb cccc dddd' });
  delete process.env.RESEND_API_KEY;
  delete process.env.MEMBERSHIP_EMAIL_FROM;
}
test('Gmail config accepts an app password without requiring Resend and rejects bad credentials', () => {
  configure();
  assert.deepEqual(membershipEmailConfigurationIssues(), []);
  assert.equal(membershipConfigurationIssues().some(issue => issue.includes('RESEND') || issue.includes('EMAIL_FROM')), false);
  process.env.GMAIL_APP_PASSWORD = 'normal-password';
  assert.deepEqual(membershipEmailConfigurationIssues(), ['invalid-gmail-app-password']);
  process.env.MEMBERSHIP_EMAIL_PROVIDER = 'typo';
  assert.deepEqual(membershipEmailConfigurationIssues(), ['invalid-membership-email-provider']);
});
test('Gmail uses authenticated TLS, the club sender, and the exact card attachment', async () => {
  configure();
  const original = nodemailer.createTransport;
  let options, mail, closed = false;
  nodemailer.createTransport = value => { options=value; return { sendMail:async value => { mail=value; return { accepted:['student@example.edu'], messageId:value.messageId }; }, close:()=>{closed=true;} }; };
  const message = { from:'old@example.com', to:['student@example.edu'], subject:'Card', text:'Your card', html:'<p>Your card</p>', attachments:[{filename:'card.png',content:Buffer.from('fixture card bytes').toString('base64'),content_type:'image/png'}] };
  try {
    const result = await sendMembershipCardEmail(message, 'member-fixture');
    assert.equal(options.host, 'smtp.gmail.com');
    assert.equal(options.port, 465); assert.equal(options.secure, true);
    assert.equal(options.tls.rejectUnauthorized, true);
    assert.equal(options.auth.pass, 'aaaabbbbccccdddd');
    assert.equal(mail.from.address, 'bengalistudentssociety@gmail.com');
    assert.deepEqual(mail.to, ['student@example.edu']);
    assert.equal(mail.attachments[0].content.toString(), 'fixture card bytes');
    assert.equal(mail.disableFileAccess, true); assert.equal(mail.disableUrlAccess, true);
    assert.equal(result.id, '<bss-membership-member-fixture@bssucalgary.app>');
    assert.equal(closed, true);
  } finally { nodemailer.createTransport=original; }
});
test('rejected SMTP delivery cannot be recorded as email acceptance and errors hide credentials', async () => {
  configure();
  const original=nodemailer.createTransport, oldLog=console.error;
  let closed=false; console.error=()=>{};
  nodemailer.createTransport=()=>({sendMail:async()=>({accepted:[],messageId:'fixture'}),close:()=>{closed=true;}});
  try { await assert.rejects(sendMembershipCardEmail({to:['student@example.edu'],subject:'Card',text:'Card',html:'Card',attachments:[]},'fixture'), /Card email was not accepted/); assert.equal(closed,true); }
  finally {nodemailer.createTransport=original;console.error=oldLog;}
});

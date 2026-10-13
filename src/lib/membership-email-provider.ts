import nodemailer from "nodemailer";
import { reportServiceFailure } from "./service-diagnostics";

type CardEmail = {
  from?: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  attachments: { filename: string; content: string; content_type: string }[];
};

export function membershipEmailConfigurationIssues() {
  const provider = process.env.MEMBERSHIP_EMAIL_PROVIDER || "resend";
  if (provider === "gmail") {
    const issues: string[] = [];
    if (!/^[^\s@]+@gmail\.com$/i.test(process.env.GMAIL_USER || "")) issues.push("invalid-gmail-sender");
    if (!/^[A-Za-z0-9]{16}$/.test((process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""))) issues.push("invalid-gmail-app-password");
    return issues;
  }
  if (provider !== "resend") return ["invalid-membership-email-provider"];
  return ["RESEND_API_KEY", "MEMBERSHIP_EMAIL_FROM"].filter(key => !process.env[key]).map(key => `missing:${key}`);
}

export async function sendMembershipCardEmail(message: CardEmail, memberId: string): Promise<{ id: string }> {
  if (membershipEmailConfigurationIssues().length) throw new Error("Membership email is not configured.");
  if (process.env.MEMBERSHIP_EMAIL_PROVIDER === "gmail") {
    const user = process.env.GMAIL_USER!.trim().toLowerCase();
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
      tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    });
    try {
      const info = await transport.sendMail({
        from: { name: "BSS Membership", address: user },
        to: message.to, subject: message.subject, text: message.text, html: message.html,
        messageId: `<bss-membership-${memberId}@bssucalgary.app>`,
        attachments: message.attachments.map(file => ({
          filename: file.filename, content: Buffer.from(file.content, "base64"), contentType: file.content_type,
        })),
        disableFileAccess: true, disableUrlAccess: true,
      });
      const accepted = info.accepted.map(address => address.toLowerCase());
      if (!message.to.every(address => accepted.includes(address.toLowerCase())) || !info.messageId) throw new Error("Email not accepted.");
      return { id: info.messageId };
    } catch {
      reportServiceFailure("gmail");
      throw new Error("Card email was not accepted. Retry required.");
    } finally { transport.close(); }
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json", "Idempotency-Key": `bss-membership-card-v1/${memberId}`,
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error("Card email was not accepted. Retry required.");
  const result = await response.json();
  if (typeof result.id !== "string") throw new Error("Email acceptance could not be confirmed.");
  return { id: result.id };
}

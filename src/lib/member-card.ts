import qrcode from "qrcode-generator";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Member } from "./membership-server";
import { siteOrigin, decryptStudentId } from "./membership-server";

export function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function verificationUrl(id: string) { return `${siteOrigin()}/membership/verify/${encodeURIComponent(id)}`; }

export function qrSvg(value: string) {
  const code = qrcode(0, "M");
  code.addData(value, "Byte");
  code.make();
  // Four white modules around every edge preserve the QR quiet zone.
  return code.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
}

function nameLines(name: string) {
  const characters = Array.from(name.trim());
  const lines: string[] = [];
  while (characters.length) {
    let take = Math.min(21, characters.length);
    const space = characters.slice(0, take).lastIndexOf(" ");
    if (characters.length > take && space > 10) take = space;
    lines.push(characters.splice(0, take).join("").trim());
    while (characters[0] === " ") characters.shift();
  }
  return lines;
}

export async function memberCardPng(member: Pick<Member, "id" | "full_name" | "plan" | "expires_at"> & { email?: string; student_id_encrypted?: string; checkout_session_id?: string | null }, preview = false) {
  const testing = member.checkout_session_id?.startsWith("cs_test_");
  await sharp({ text: { text: "BSS", font: "Montserrat", fontfile: path.join(process.cwd(), "public", "fonts", "montserrat-card.ttf") } }).png().toBuffer();
  const logo = await readFile(path.join(process.cwd(), "public", "bss-logo.png"));
  const qr = await sharp(Buffer.from(qrSvg(verificationUrl(preview ? "preview" : member.id)))).resize(264, 264, { kernel: "nearest" }).png().toBuffer();
  const lines = nameLines(member.full_name);
  const lineGap = Math.min(40, 180 / lines.length);
  const fontSize = Math.min(38, lineGap - 5);
  const name = lines.map((line, index) => `<tspan x="65" y="${335 + index * lineGap}"${line.length > 18 ? ' textLength="690" lengthAdjust="spacingAndGlyphs"' : ""}>${escapeMarkup(line)}</tspan>`).join("");
  const expiry = new Date(member.expires_at).toLocaleDateString("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "long", day: "numeric" });
  const studentId = member.student_id_encrypted ? decryptStudentId(member.student_id_encrypted) : undefined;
  const email = Array.from(member.email || (preview ? "Your student email" : "Not provided"));
  const emailLines: string[] = [];
  while (email.length) emailLines.push(email.splice(0, 54).join(""));
  const emailText = emailLines.map((line, index) => `<tspan x="65" y="${555 + index * 23}" ${line.length > 40 ? 'textLength="690" lengthAdjust="spacingAndGlyphs"' : ""}>${escapeMarkup(line)}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <defs><linearGradient id="green" x2="1" y2="1"><stop stop-color="#174d3b"/><stop offset="1" stop-color="#041e18"/></linearGradient></defs>
    <rect width="1200" height="900" rx="32" fill="url(#green)"/>
    <g fill="none" stroke="#dfc58b" opacity=".14"><circle cx="1080" cy="120" r="230"/><circle cx="1080" cy="120" r="205"/><circle cx="1080" cy="120" r="180"/><path d="M0 660Q350 460 750 690T1300 620M0 685Q350 485 750 715T1300 645"/></g>
    <rect x="18" y="18" width="1164" height="864" rx="22" fill="none" stroke="#dfc58b"/>
    <image href="data:image/png;base64,${logo.toString("base64")}" x="65" y="60" width="105" height="105"/>
    <g font-family="Montserrat" fill="#f6f0dc"><text x="195" y="103" font-size="30" font-weight="700">Bengali Students Society</text><text x="195" y="144" font-size="22" fill="#dfc58b">UNIVERSITY OF CALGARY · 2026–2027</text>
    <path d="M65 210H1135" stroke="#dfc58b" opacity=".6"/>
    <text x="65" y="270" font-size="17" letter-spacing="4" fill="#dfc58b">${preview ? "CARD PREVIEW" : testing ? "TEST CARD — NOT VALID" : "OFFICIAL BSS MEMBER"}</text>
    <text font-size="${fontSize}" font-weight="700">${name}</text>
    <text x="65" y="523" font-size="15" letter-spacing="2" fill="#dfc58b">STUDENT EMAIL</text>
    <text font-size="21">${emailText}</text>
    <text x="65" y="691" font-size="15" letter-spacing="2" fill="#dfc58b">STUDENT ID</text>
    <text x="65" y="722" font-size="24" font-weight="600">${escapeMarkup(studentId || (preview ? "Your student ID" : "Not provided"))}</text>
    <text x="65" y="770" font-size="20">${member.plan === "new" ? "New" : "Returning"} member · MEMBER ${preview ? "PREVIEW" : escapeMarkup(member.id.slice(0, 8).toUpperCase())}</text>
    <text x="998" y="300" font-size="16" text-anchor="middle" letter-spacing="2" fill="#dfc58b">SCAN TO VERIFY</text>
    <text x="65" y="815" font-size="21">Expires ${escapeMarkup(expiry)} · 00:00 Calgary time</text>
    <text x="65" y="856" font-size="16" fill="#c5d3bf">${(preview || testing) ? "TEST / PREVIEW ONLY — NOT A VALID MEMBERSHIP" : "Keep your card private. Partners: scan the QR and match the member name."}</text></g>
  </svg>`;
  return sharp(Buffer.from(svg)).composite([{ input: qr, left: 866, top: 325 }]).png().toBuffer();
}

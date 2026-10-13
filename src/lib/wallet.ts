import { createHash, createSign } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Member } from "./membership-server";
import { siteOrigin } from "./membership-server";

function env(name: string) { const value = process.env[name]; if (!value) throw new Error("Wallet issuer is not configured."); return value.replace(/\\n/g, "\n"); }
export function googleWallet(member: Member) {
  const issuer = env("GOOGLE_WALLET_ISSUER_ID");
  const object = { id: `${issuer}.${member.id}`, classId: env("GOOGLE_WALLET_CLASS_ID"), state: "ACTIVE", cardTitle: { defaultValue: { language: "en", value: "Bengali Students Society" } }, header: { defaultValue: { language: "en", value: member.full_name } }, subheader: { defaultValue: { language: "en", value: "2026–2027 Membership" } }, logo: { sourceUri: { uri: `${siteOrigin()}/bss-logo.png` }, contentDescription: { defaultValue: { language: "en", value: "BSS logo" } } }, hexBackgroundColor: "#06271e", barcode: { type: "QR_CODE", value: `${siteOrigin()}/membership/verify/${member.id}` }, validTimeInterval: { end: { date: member.expires_at } }, textModulesData: [{ id: "type", header: "MEMBERSHIP", body: member.plan === "new" ? "New member" : "Returning member" }] };
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: env("GOOGLE_WALLET_CLIENT_EMAIL"), aud: "google", typ: "savetowallet", iat: Math.floor(Date.now() / 1000), origins: [siteOrigin()], payload: { genericObjects: [object] } })).toString("base64url");
  const message = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(message).sign(env("GOOGLE_WALLET_PRIVATE_KEY"), "base64url");
  return `https://pay.google.com/gp/v/save/${message}.${signature}`;
}

/** Uncompressed ZIP format for the small, signed Apple pass bundle. */
export function zipFiles(files: Record<string, Buffer>) {
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of Object.entries(files)) {
    const fileName = Buffer.from(name);
    let crc = 0xffffffff;
    for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    crc = (crc ^ 0xffffffff) >>> 0;
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50); head.writeUInt16LE(20, 4); head.writeUInt16LE(33, 12); head.writeUInt32LE(crc, 14); head.writeUInt32LE(data.length, 18); head.writeUInt32LE(data.length, 22); head.writeUInt16LE(fileName.length, 26);
    local.push(head, fileName, data);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(33, 14); directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(fileName.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, fileName); offset += head.length + fileName.length + data.length;
  }
  const index = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(index.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, index, end]);
}

export async function appleWallet(member: Member) {
  const directory = await mkdtemp(path.join(tmpdir(), "bss-pass-"));
  try {
    const pass = { formatVersion: 1, passTypeIdentifier: env("APPLE_PASS_TYPE_ID"), teamIdentifier: env("APPLE_TEAM_ID"), serialNumber: member.id, organizationName: "Bengali Students Society", description: "BSS 2026–2027 Membership", logoText: "Bengali Students Society", backgroundColor: "rgb(6,39,30)", foregroundColor: "rgb(246,240,220)", labelColor: "rgb(223,197,139)", expirationDate: member.expires_at, barcodes: [{ format: "PKBarcodeFormatQR", message: `${siteOrigin()}/membership/verify/${member.id}`, messageEncoding: "iso-8859-1" }], generic: { primaryFields: [{ key: "name", label: "MEMBER", value: member.full_name }], secondaryFields: [{ key: "year", label: "MEMBERSHIP YEAR", value: "2026–2027" }, { key: "type", label: "MEMBERSHIP", value: member.plan === "new" ? "New member" : "Returning member" }], backFields: [{ key: "verify", label: "Membership verification", value: "Scan the QR code to check current status. A saved card alone does not prove an active membership." }] } };
    const files: Record<string, Buffer> = { "pass.json": Buffer.from(JSON.stringify(pass)) };
    for (const name of ["icon.png", "icon@2x.png", "logo.png", "logo@2x.png"]) files[name] = await readFile(path.join(process.cwd(), "public", "wallet", name));
    files["manifest.json"] = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(files).map(([name, data]) => [name, createHash("sha1").update(data).digest("hex")]))));
    await Promise.all([writeFile(path.join(directory, "manifest.json"), files["manifest.json"]), writeFile(path.join(directory, "certificate.pem"), env("APPLE_PASS_CERTIFICATE"), { mode: 0o600 }), writeFile(path.join(directory, "key.pem"), env("APPLE_PASS_PRIVATE_KEY"), { mode: 0o600 }), writeFile(path.join(directory, "wwdr.pem"), env("APPLE_WWDR_CERTIFICATE"), { mode: 0o600 })]);
    // OpenSSL produces the detached DER PKCS#7 signature required by Apple Wallet.
    await promisify(execFile)(process.env.OPENSSL_PATH || "openssl", ["smime", "-binary", "-sign", "-signer", path.join(directory, "certificate.pem"), "-inkey", path.join(directory, "key.pem"), "-certfile", path.join(directory, "wwdr.pem"), "-in", path.join(directory, "manifest.json"), "-out", path.join(directory, "signature"), "-outform", "DER"], { timeout: 10000, windowsHide: true });
    files.signature = await readFile(path.join(directory, "signature"));
    return zipFiles(files);
  } finally {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) === path.resolve(tmpdir()) && path.basename(resolved).startsWith("bss-pass-")) await rm(resolved, { recursive: true, force: true });
  }
}

import { cookies } from "next/headers";
import { getMember, memberCookie } from "@/lib/membership-server";
import { memberCardPng } from "@/lib/member-card";

export const runtime = "nodejs";
export async function GET() {
  try {
    const member = await getMember((await cookies()).get(memberCookie)?.value);
    if (!member || member.status !== "active" || Date.parse(member.expires_at) <= Date.now()) return new Response("An active membership is required.", { status: 403, headers: { "Cache-Control": "private, no-store" } });
    const card = await memberCardPng(member);
    return new Response(new Uint8Array(card), { headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="BSS-membership-2026-2027.png"', "Cache-Control": "private, no-store" } });
  } catch { return new Response("Your card is temporarily unavailable. Please try again.", { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}

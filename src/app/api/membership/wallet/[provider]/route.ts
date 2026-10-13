import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fulfillSession, getMember, memberCookie, walletEnabled } from "@/lib/membership-server";
import { appleWallet, googleWallet } from "@/lib/wallet";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "apple" && provider !== "google") return new Response("Not found", { status: 404 });
  if (!walletEnabled(provider)) return new Response("This wallet option is not available yet. Your digital membership card is still available on the website.", { status: 503, headers: { "Cache-Control": "private, no-store" } });
  try {
    const access = (await cookies()).get(memberCookie)?.value;
    let member = await getMember(access);
    if (member?.checkout_session_id) { await fulfillSession(member.checkout_session_id); member = await getMember(access); }
    if (!member || member.status !== "active" || Date.parse(member.expires_at) <= Date.now()) return new Response("A verified, active membership is required.", { status: 403 });
    if (provider === "google") { const response = NextResponse.redirect(googleWallet(member)); response.headers.set("Cache-Control", "private, no-store"); return response; }
    const pass = await appleWallet(member);
    return new Response(new Uint8Array(pass), { headers: { "Content-Type": "application/vnd.apple.pkpass", "Content-Disposition": 'attachment; filename="bss-membership.pkpass"', "Cache-Control": "private, no-store" } });
  } catch { return new Response("Wallet cards are not available yet. Your membership has not been changed. Please try again later.", { status: 503 }); }
}

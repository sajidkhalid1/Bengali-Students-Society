import { checkoutPresentation } from "@/lib/checkout-presentation";
import { openMemberCheckout, checkoutApiVersion } from "@/lib/member-checkout";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canRegister, testCookie } from "@/lib/membership-access";
import { database, getMember, memberCookie, siteOrigin, stripe } from "@/lib/membership-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const jar = await cookies();
  if (request.headers.get("origin") !== siteOrigin()) return NextResponse.json({ error: "Please resume from the BSS website." }, { status: 403 });
  if (!canRegister(jar.get(testCookie)?.value)) return NextResponse.json({ error: "Registration is not open." }, { status: 503 });
  try {
    const member = await getMember(jar.get(memberCookie)?.value);
    if (!member) return NextResponse.json({ error: "No checkout was found in this browser. Complete the signup form to begin." }, { status: 404 });
    const session = member.checkout_session_id ? await stripe(`checkout/sessions/${member.checkout_session_id}`, undefined, undefined, checkoutApiVersion) : await openMemberCheckout(member);
    if (session.metadata?.member_id !== member.id || member.status === "revoked") throw new Error("Invalid checkout.");
    if (session.payment_status === "paid") return NextResponse.json({ url: `${siteOrigin()}/membership/card` });
    if (session.status === "open") return NextResponse.json(checkoutPresentation(session), { headers: { "Cache-Control": "no-store" } });
    if (session.status === "expired") {
      await database(`bss_members?id=eq.${member.id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "expired" }) });
      return NextResponse.json({ error: "Your previous checkout expired. You can now submit the signup form again." }, { status: 409 });
    }
    return NextResponse.json({ error: "Payment is processing. Check your membership card shortly." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Unable to check your payment. Try again shortly; do not start another payment yet." }, { status: 502 }); }
}

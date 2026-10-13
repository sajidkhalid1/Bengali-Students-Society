import { NextResponse } from "next/server";
import { issueTestAccess, testCookie, validTestPassword } from "@/lib/membership-access";
import { siteOrigin } from "@/lib/membership-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== siteOrigin()) return new NextResponse("Forbidden", { status: 403 });
  const raw = await request.text();
  if (raw.length > 1024) return new NextResponse("Invalid request", { status: 400 });
  const password = new URLSearchParams(raw).get("password") || "";
  if (!validTestPassword(password)) return NextResponse.redirect(new URL("/membership/test?error=1", siteOrigin()), 303);
  const response = NextResponse.redirect(new URL("/membership", siteOrigin()), 303);
  response.cookies.set(testCookie, issueTestAccess(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 3600 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

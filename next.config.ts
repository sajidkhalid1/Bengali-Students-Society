import type { NextConfig } from "next";

const paymentCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://js.stripe.com https://*.js.stripe.com https://checkout.stripe.com https://maps.googleapis.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com https://*.link.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.stripe.com https://link.com https://*.link.com https://maps.googleapis.com",
  "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://link.com https://*.link.com",
  "object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'",
].join("; ");
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/membership/:path*", headers: [
      { key: "Content-Security-Policy", value: paymentCsp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ] }];
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host" as const, value: "bss-website-lilac.vercel.app" }], destination: "https://bssucalgary.app/:path*", permanent: true }];
  },
  outputFileTracingIncludes: {
    "/api/membership/wallet/*": ["./public/wallet/**/*"],
    "/api/membership/webhook": ["./public/bss-logo.png", "./public/fonts/montserrat-card.ttf"],
    "/api/membership/card-image": ["./public/bss-logo.png", "./public/fonts/montserrat-card.ttf"],
  },
};
export default nextConfig;

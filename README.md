# Bengali Students Society · 2026–2027

A responsive Next.js App Router homepage built with TypeScript and Tailwind CSS 4. Deep green surfaces, cream typography, red buttons, and Bengali textile-inspired artwork frame real BSS event photography. Uses self-hosted Montserrat for body and interface text, Georgia for editorial headings, and locally bundled images with no external image or font services, database, or environment variables required at runtime.

## Run locally

Requires Node.js 22 or newer and pnpm (the version is pinned in `package.json`).

```sh
pnpm install
pnpm dev
```

Open the local address printed by Next.js.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

## Deploy to Vercel

1. Push `bss-website` to a Git repository and import it into Vercel.
2. If the repository contains this parent project too, set the Vercel Root Directory to `bss-website`. If the repository contains only the website files, leave it at the default.
3. Use the Next.js framework preset. The committed pnpm lockfile selects the package manager. Keep default build and output settings.
4. Deploy. No environment variables are required for this initial version.

## Edit content

- `src/lib/site.ts`: society details, navigation, membership prices, event ideas, and optional public contact links.
- `src/app/page.tsx`: homepage sections and copy.
- `src/app/globals.css`: branding, layout, responsive styles, and theme tokens.
- `src/components`: reusable header, footer, and section heading.
- `public/bss-logo.png`: original supplied BSS logo, used in the header, footer, and browser icon.
- `public/images`: optimized event photos and the generated textile background. See `ASSETS.md` for provenance and the background-generation prompt.

The only confirmed prices are $15 new and $10 returning. Currency, benefits, eligibility, payment flow, email, social accounts, event dates, venues, and sponsors must be confirmed before promoting the site. Proposed events are explicitly labelled as ideas. Joining actions lead to an honest availability notice until a real registration URL is provided. No information or payments are collected.

## Current pages

- `/`: original landing-page content with scroll-driven decorative section boundaries; reduced-motion preferences disable the effect.
- `/gallery`: all 36 photos from the supplied folder, with a keyboard-accessible image viewer and original-file links.
- `/sponsors`: named past sponsors and business partners; no current-year sponsorship claims.
- `/membership`: CAD pricing, requested student fields, and a personalized membership-card preview. Registration is closed by default. See `MEMBERSHIP-SETUP.md` before enabling payments or wallet issuance.

Payment and wallet adapters are implemented but have not been tested with live provider accounts. No live signup data is collected. The launch date, expiry, eligible schools, issuer credentials, privacy policies, and operational setup still need confirmation.

## Future pages

Add `src/app/team/page.tsx`, `events/page.tsx`, and `contact/page.tsx` as needed. The root layout automatically supplies the shared header and footer. Update navigation in `src/lib/site.ts` to point to completed routes. Existing homepage anchors use `/#section` so they remain valid from future pages. Add a descriptive `metadata.title` export to each page.

There are no empty future routes or links to pages that do not exist.

## Validation in this workspace

ESLint and TypeScript checks passed. The production build generated the homepage successfully. This Windows sandbox blocks child-process launches, so the build was verified with temporary Next.js worker-thread settings (`workerThreads: true`, `cpus: 2`, `useTypeScriptCli: false`); the delivered configuration retains standard Next.js defaults for Vercel. The production server returned HTTP 200. Browser automation was unavailable in this environment, so visual and interactive browser checks remain to be completed. Deployed to Vercel on 2026-09-16: https://bss-website-lilac.vercel.app/ (project bss-website in Bengali Student's Society). The live homepage and typography were checked in the browser after deployment.

## Accessibility

Semantic headings and landmarks, a keyboard skip link, visible focus indicators, reduced-motion support, and an accessible mobile menu with expanded state and Escape handling are included. No decorative text is essential to navigation. Verify final branded assets and content with keyboard and screen-reader checks before a public launch.



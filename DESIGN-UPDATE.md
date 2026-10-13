# September 29 design update

- Shared annual event data powers both the Events page and seven landing-page carousel cards.
- Cards reduced from 48% to 31% desktop width, with tablet and mobile sizes; archive photos are labeled as archive imagery, not event-specific photography.
- Asia Cup is marked completed; unconfirmed events retain date-TBA status.
- Scroll scale runs from 0.78 to 1.03 using smooth interpolation; reduced motion disables it.
- Added restrained textile treatments on inner-page banners, woven-style inset borders, and link underline feedback.
- Preserved original branding, photos, Montserrat body type, membership flow and prices.

Inspiration: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md (read as design guidance; no remote code or dependencies installed).

Validation: TypeScript, targeted ESLint and production build passed. Browser checks at desktop and 390px mobile showed no page overflow. Seven slides and keyboard End navigation to Royal Mezban verified. Stripe release status lives in STRIPE_INTEGRATION_TODO.md.

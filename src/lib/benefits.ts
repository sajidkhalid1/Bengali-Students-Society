export type Benefit = {
  id: string;
  name: string;
  offer: string;
  scope: string;
  terms: string;
  extra?: string;
  sourceUrl: string;
  sourceLabel: string;
  logo?: string;
};

// Offer terms are supplied by BSS; source links identify the partner businesses.
export const benefits: Benefit[] = [
  {
    id: "miraj",
    logo: "/images/partners/miraj.webp",
    name: "Miraj Restaurant",
    offer: "5% off",
    scope: "All menu items",
    terms: "Promotional items are excluded. Available throughout your membership term.",
    extra: "Exclusive limited-time offers for BSS members are coming soon.",
    sourceUrl: "https://linktr.ee/MirajRestaurant",
    sourceLabel: "Official social links",
  },
  {
    id: "yyc-halal-meat",
    logo: "/images/partners/yyc-halal.webp",
    name: "YYC Halal Meat",
    offer: "3% off",
    scope: "All non-promotional items · NW & NE",
    terms: "Available throughout your membership term.",
    extra: "Monthly deals and student-only packages will be announced.",
    sourceUrl: "https://www.facebook.com/YYCHALALMEATS",
    sourceLabel: "Official NW location social page",
  },
  {
    id: "utsav-sweets",
    logo: "/images/partners/utsav.webp",
    name: "Utsav Sweets",
    offer: "10% off",
    scope: "Menu items",
    terms: "Promotional items are excluded. Available throughout your membership term.",
    extra: "Special monthly BSS deals to be announced.",
    sourceUrl: "https://utsavcalgary.com/",
    sourceLabel: "Official website",
  },
  {
    id: "spice-avenue",
    logo: "/images/partners/spice-avenue.webp",
    name: "Spice Avenue",
    offer: "15% off",
    scope: "For BSS members",
    terms: "Promotional offers are excluded. Available throughout your membership term.",
    sourceUrl: "https://spiceavenue.ca/",
    sourceLabel: "Official website",
  },
];

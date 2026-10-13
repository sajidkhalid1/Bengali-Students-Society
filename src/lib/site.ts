export const site = {
  name: "Bengali Students Society",
  shortName: "BSS",
  year: "2026–2027",
  description: "A place to celebrate Bengali culture, find your community, and make campus feel a little more like home.",
  // Add verified public links here when available. Never put private credentials here.
  membershipUrl: "/membership" as string | null,
  email: null as string | null,
  instagramUrl: null as string | null,
};

export const navigation = [
  { label: "About BSS", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Team", href: "/team" },
  { label: "Gallery", href: "/gallery" },
  { label: "Membership", href: "/membership" },
  { label: "Partners", href: "/sponsors" },
];

// Annual events share their source with the Events page. Photos are archive imagery.
export { traditions } from "./events";

export const memberships = [
  { title: "New member", price: 15, description: "Your first year with the BSS community." },
  { title: "Returning member", price: 10, description: "Another year. More memories together." },
];


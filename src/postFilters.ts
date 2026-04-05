import type { Offer } from "./types.js";

interface PostFilter {
  id: string;
  label: string;
  fn: (offer: Offer) => boolean; // true = keep
}

export const POST_FILTERS: PostFilter[] = [
  {
    id: "no_polish",
    label: "No Polish required",
    fn: (offer) => !offer.languages?.some((l) => l.code === "pl"),
  },
];

export function applyPostFilters(offers: Offer[], filterIds: string[]): Offer[] {
  if (!filterIds.length) return offers;
  const active = POST_FILTERS.filter((f) => filterIds.includes(f.id));
  if (!active.length) return offers;
  return offers.filter((offer) => active.every((f) => f.fn(offer)));
}

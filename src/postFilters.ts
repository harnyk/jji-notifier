import type { Offer, PostFilterEntry } from "./types.js";

function matchesEntry(offer: Offer, entry: PostFilterEntry): boolean {
  const vals = entry.value.map((v) => v.toLowerCase());
  switch (entry.filter) {
    case "no_languages":
      return !offer.languages?.some((l) => vals.includes(l.code.toLowerCase()));
    case "no_skills":
      return !offer.requiredSkills?.some((s) => vals.includes(s.name.toLowerCase()));
  }
}

export function applyPostFilters(offers: Offer[], filters: PostFilterEntry[]): Offer[] {
  if (!filters.length) return offers;
  return offers.filter((offer) => filters.every((entry) => matchesEntry(offer, entry)));
}

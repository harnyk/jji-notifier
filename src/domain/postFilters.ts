import type { Offer, PostFilterEntry } from "./types.js";

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordlistRegex(words: string[]): RegExp | null {
  const sanitized = words.map((word) => word.trim()).filter(Boolean);
  if (sanitized.length === 0) return null;

  const alternation = sanitized.map((word) => escapeRegexLiteral(word)).join("|");
  return new RegExp(`(?<![A-Za-z0-9_])(?:${alternation})(?![A-Za-z0-9_])`, "i");
}

function compileEntry(entry: PostFilterEntry): (offer: Offer) => boolean {
  switch (entry.filter) {
    case "no_languages": {
      const vals = entry.value.map((v) => v.toLowerCase());
      return (offer) => !offer.languages?.some((l) => vals.includes(l.code.toLowerCase()));
    }
    case "no_skills": {
      const vals = entry.value.map((v) => v.toLowerCase());
      return (offer) => !offer.requiredSkills?.some((s) => vals.includes(s.name.toLowerCase()));
    }
    case "exclude_title_words": {
      const regex = buildWordlistRegex(entry.value);
      if (!regex) return () => true;
      return (offer) => !regex.test(offer.title);
    }
  }

  throw new Error(`Unknown post-filter: ${String((entry as { filter?: unknown }).filter)}`);
}

export function validatePostFilters(filters: PostFilterEntry[]): void {
  filters.forEach((entry) => {
    compileEntry(entry);
  });
}

export function applyPostFilters(offers: Offer[], filters: PostFilterEntry[]): Offer[] {
  if (!filters.length) return offers;
  const matchers = filters.map((entry) => compileEntry(entry));
  return offers.filter((offer) => matchers.every((matches) => matches(offer)));
}

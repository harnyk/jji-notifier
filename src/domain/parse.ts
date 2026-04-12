import type { Offer, EmploymentType, Language } from "./types.js";

export interface SalaryRange {
  type: string;
  unit: string;
  currency: string;
  from: number | null;
  to: number | null;
  gross: boolean;
}

export interface ParsedOffer {
  guid: string;
  slug: string;
  url: string;
  title: string;
  company: string;
  city: string;
  workplaceType: string;
  experienceLevel: string;
  category: string;
  publishedAt: Date;
  salary: SalaryRange[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  languages: Language[];
  isPromoted: boolean;
  isSuperOffer: boolean;
  applyMethod: string;
  queryLabel: string | undefined;
}

function parseSalary(types: EmploymentType[]): SalaryRange[] {
  return types.map((t) => ({
    type: t.type,
    unit: t.unit,
    currency: t.currency,
    from: t.from,
    to: t.to,
    gross: t.gross,
  }));
}

export function parseOffer(raw: Offer, queryLabel?: string): ParsedOffer {
  return {
    guid: raw.guid,
    slug: raw.slug,
    url: `https://justjoin.it/offers/${raw.slug}`,
    title: raw.title,
    company: raw.companyName,
    city: raw.city,
    workplaceType: raw.workplaceType,
    experienceLevel: raw.experienceLevel,
    category: raw.category.key,
    publishedAt: new Date(raw.publishedAt),
    salary: parseSalary(raw.employmentTypes),
    requiredSkills: raw.requiredSkills.map((s) => s.name),
    niceToHaveSkills: raw.niceToHaveSkills.map((s) => s.name),
    languages: raw.languages,
    isPromoted: raw.isPromoted,
    isSuperOffer: raw.isSuperOffer,
    applyMethod: raw.applyMethod,
    queryLabel,
  };
}

export function formatSalary(ranges: SalaryRange[]): string {
  if (!ranges.length) return "—";
  return ranges
    .map((r) => {
      const lo = r.from != null ? r.from.toLocaleString("pl-PL") : "?";
      const hi = r.to != null ? r.to.toLocaleString("pl-PL") : "?";
      const gross = r.gross ? "gross" : "net";
      return `${lo}–${hi} ${r.currency}/${r.unit} ${r.type} (${gross})`;
    })
    .join("\n");
}

export function printOffer(o: ParsedOffer, index: number): void {
  const age = Math.round((Date.now() - o.publishedAt.getTime()) / 3_600_000);
  console.log(
    `#${index + 1} [${o.isPromoted ? "★" : " "}] ${o.title} @ ${o.company} (${o.city})`,
  );
  console.log(`   ${o.url}`);
  console.log(`   💰 ${formatSalary(o.salary)}`);
  console.log(`   🛠  ${o.requiredSkills.join(", ") || "—"}`);
  console.log(`   🕐 ${age}h ago`);
}

import { fetchOffers } from "../src/fetch.js";
import type { Offer } from "../src/types.js";

const KNOWN_CATEGORIES = [
  "javascript", "html", "php", "ruby", "python", "java", "net", "scala", "go", "c",
  "mobile", "data", "ai", "devops", "testing", "security", "game",
  "architecture", "analytics", "ux", "pm", "admin", "support", "erp", "other",
] as const;

interface SkillStat {
  name: string;
  count: number;
}

interface Options {
  format: "text" | "json";
  limit?: number;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { format: "text" };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--json") {
      options.format = "json";
      continue;
    }

    if (arg === "--limit") {
      const raw = argv[i + 1];
      if (!raw) throw new Error("--limit requires a number");
      const limit = Number(raw);
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error(`Invalid --limit value: ${raw}`);
      }
      options.limit = limit;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp(): void {
  console.log("Usage: pnpm run skills:mine [--limit N] [--json]");
  console.log("");
  console.log("Fetches one page from each known Just Join IT category and aggregates unique skills.");
}

function collectSkillNames(offer: Offer): string[] {
  return [...offer.requiredSkills, ...offer.niceToHaveSkills]
    .map((skill) => skill.name.trim())
    .filter(Boolean);
}

function countSkills(offers: Iterable<Offer>): SkillStat[] {
  const counts = new Map<string, SkillStat>();

  for (const offer of offers) {
    for (const skillName of collectSkillNames(offer)) {
      const key = skillName.toLocaleLowerCase("en-US");
      const current = counts.get(key);
      if (current) {
        current.count += 1;
        continue;
      }
      counts.set(key, { name: skillName, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

async function loadOffersFromSite(): Promise<Offer[]> {
  const deduped = new Map<string, Offer>();

  for (const category of KNOWN_CATEGORIES) {
    const response = await fetchOffers({
      categories: [category],
      from: 0,
      itemsCount: 200,
      orderBy: "descending",
      sortBy: "publishedAt",
    });

    for (const offer of response.data) {
      if (!deduped.has(offer.guid)) {
        deduped.set(offer.guid, offer);
      }
    }
  }

  return [...deduped.values()];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const offers = await loadOffersFromSite();
  const skills = countSkills(offers);
  const ordered = [...skills].reverse();
  const limited = options.limit ? ordered.slice(0, options.limit) : ordered;

  if (options.format === "json") {
    console.log(JSON.stringify(limited, null, 2));
    return;
  }

  limited.forEach((skill) => {
    console.log(`${skill.count}\t${skill.name}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

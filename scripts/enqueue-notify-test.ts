import { randomUUID } from "node:crypto";
import { connectOnce, OutboxModel } from "../src/db.js";
import type { EmploymentType, Language, Offer, Skill } from "../src/types.js";

interface Options {
  title: string;
  company: string;
  city: string;
  slug?: string;
  guid?: string;
  queryLabel?: string;
  publishedAt: string;
  workplaceType: string;
  experienceLevel: string;
  category: string;
  applyMethod: string;
  promoted: boolean;
  superOffer: boolean;
  salaryFrom: number | null;
  salaryTo: number | null;
  salaryCurrency: string;
  employmentType: string;
  salaryUnit: string;
  salaryGross: boolean;
  skills: string[];
  niceToHaveSkills: string[];
  languages: Language[];
  dryRun: boolean;
}

function printHelp(): void {
  console.log("Usage: pnpm run notify:test:enqueue -- [options]");
  console.log("");
  console.log("Inserts one synthetic event into event_outbox_new_offer for the notify Lambda.");
  console.log("");
  console.log("Options:");
  console.log("  --title TEXT              Offer title");
  console.log("  --company TEXT            Company name");
  console.log("  --city TEXT               City shown in Telegram");
  console.log("  --slug TEXT               Slug used in the Just Join IT URL");
  console.log("  --guid TEXT               Explicit guid; default is a fresh UUID-based test guid");
  console.log("  --query-label TEXT        Optional query label shown above the message");
  console.log("  --published-at ISO        Offer publication timestamp");
  console.log("  --workplace-type TEXT     Example: remote / hybrid / office");
  console.log("  --experience-level TEXT   Example: mid / senior");
  console.log("  --category TEXT           Category key");
  console.log("  --apply-method TEXT       Arbitrary applyMethod field");
  console.log("  --promoted                Mark offer as promoted");
  console.log("  --super-offer             Mark offer as super offer");
  console.log("  --salary-from N           Salary lower bound");
  console.log("  --salary-to N             Salary upper bound");
  console.log("  --salary-currency CUR     Salary currency");
  console.log("  --employment-type TEXT    Employment type label");
  console.log("  --salary-unit TEXT        Salary unit, for example month");
  console.log("  --salary-gross BOOL       true/false");
  console.log("  --skill TEXT              Required skill; repeatable");
  console.log("  --nice-skill TEXT         Nice-to-have skill; repeatable");
  console.log("  --language CODE:LEVEL     Repeatable, for example en:B2");
  console.log("  --dry-run                 Print payload without inserting");
  console.log("  --help, -h                Show help");
  console.log("");
  console.log("Examples:");
  console.log("  pnpm run notify:test:enqueue -- --query-label \"manual smoke\" --title \"Node.js Backend Engineer\"");
  console.log("  pnpm run notify:test:enqueue -- --slug real-offer-slug --company \"Acme\" --skill TypeScript --skill Node.js");
}

function parseBoolean(raw: string, flagName: string): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`Invalid ${flagName} value: ${raw}. Expected true or false.`);
}

function parseNumber(raw: string, flagName: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${flagName} value: ${raw}`);
  }
  return value;
}

function parseLanguage(raw: string): Language {
  const [code, level, ...rest] = raw.split(":");
  if (!code || !level || rest.length > 0) {
    throw new Error(`Invalid --language value: ${raw}. Expected CODE:LEVEL.`);
  }
  return { code, level };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "test-offer";
}

function parseArgs(argv: string[]): Options {
  const defaults: Options = {
    title: "Test Notify Offer",
    company: "Codex Labs",
    city: "Warsaw",
    publishedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    workplaceType: "remote",
    experienceLevel: "mid",
    category: "javascript",
    applyMethod: "url",
    promoted: false,
    superOffer: false,
    salaryFrom: 24_000,
    salaryTo: 30_000,
    salaryCurrency: "PLN",
    employmentType: "b2b",
    salaryUnit: "month",
    salaryGross: false,
    skills: ["TypeScript", "Node.js"],
    niceToHaveSkills: ["MongoDB"],
    languages: [{ code: "en", level: "B2" }],
    dryRun: false,
  };

  const options: Options = { ...defaults };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--promoted") {
      options.promoted = true;
      continue;
    }

    if (arg === "--super-offer") {
      options.superOffer = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--skill") {
      if (!next) throw new Error("--skill requires a value");
      if (options.skills === defaults.skills) options.skills = [...defaults.skills];
      options.skills.push(next);
      i += 1;
      continue;
    }

    if (arg === "--nice-skill") {
      if (!next) throw new Error("--nice-skill requires a value");
      if (options.niceToHaveSkills === defaults.niceToHaveSkills) options.niceToHaveSkills = [...defaults.niceToHaveSkills];
      options.niceToHaveSkills.push(next);
      i += 1;
      continue;
    }

    if (arg === "--language") {
      if (!next) throw new Error("--language requires a value");
      if (options.languages === defaults.languages) options.languages = [...defaults.languages];
      options.languages.push(parseLanguage(next));
      i += 1;
      continue;
    }

    if (!next) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch (arg) {
      case "--title":
        options.title = next;
        break;
      case "--company":
        options.company = next;
        break;
      case "--city":
        options.city = next;
        break;
      case "--slug":
        options.slug = next;
        break;
      case "--guid":
        options.guid = next;
        break;
      case "--query-label":
        options.queryLabel = next;
        break;
      case "--published-at":
        options.publishedAt = next;
        break;
      case "--workplace-type":
        options.workplaceType = next;
        break;
      case "--experience-level":
        options.experienceLevel = next;
        break;
      case "--category":
        options.category = next;
        break;
      case "--apply-method":
        options.applyMethod = next;
        break;
      case "--salary-from":
        options.salaryFrom = parseNumber(next, "--salary-from");
        break;
      case "--salary-to":
        options.salaryTo = parseNumber(next, "--salary-to");
        break;
      case "--salary-currency":
        options.salaryCurrency = next;
        break;
      case "--employment-type":
        options.employmentType = next;
        break;
      case "--salary-unit":
        options.salaryUnit = next;
        break;
      case "--salary-gross":
        options.salaryGross = parseBoolean(next, "--salary-gross");
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    i += 1;
  }

  return options;
}

function buildSkills(names: string[]): Skill[] {
  return names.map((name) => ({ name, level: 3 }));
}

function buildEmploymentType(options: Options): EmploymentType[] {
  return [{
    from: options.salaryFrom,
    fromPerUnit: options.salaryFrom,
    to: options.salaryTo,
    toPerUnit: options.salaryTo,
    currency: options.salaryCurrency,
    currencySource: "manual-test",
    type: options.employmentType,
    unit: options.salaryUnit,
    gross: options.salaryGross,
  }];
}

function buildOffer(options: Options): Offer {
  const guid = options.guid ?? `test-notify-${randomUUID()}`;
  const slug = options.slug ?? `${slugify(options.title)}-${slugify(options.company)}-${guid.slice(-8)}`;

  return {
    guid,
    slug,
    title: options.title,
    workplaceType: options.workplaceType,
    workingTime: "full_time",
    experienceLevel: options.experienceLevel,
    category: {
      key: options.category,
      parentKey: null,
    },
    city: options.city,
    street: "Test Street 1",
    latitude: 52.2297,
    longitude: 21.0122,
    isRemoteInterview: true,
    companyName: options.company,
    companyLogoThumbUrl: "https://example.com/logo.png",
    publishedAt: options.publishedAt,
    lastPublishedAt: options.publishedAt,
    expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    isOpenToHireUkrainians: true,
    isPromoted: options.promoted,
    isSuperOffer: options.superOffer,
    applyMethod: options.applyMethod,
    locations: [{
      city: options.city,
      street: "Test Street 1",
      latitude: 52.2297,
      longitude: 21.0122,
      slug: slugify(options.city),
    }],
    employmentTypes: buildEmploymentType(options),
    requiredSkills: buildSkills(options.skills),
    niceToHaveSkills: buildSkills(options.niceToHaveSkills),
    languages: options.languages,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const payload = buildOffer(options);
  const outboxEvent = {
    guid: payload.guid,
    slug: payload.slug,
    company: payload.companyName,
    publishedAt: new Date(payload.publishedAt),
    payload,
    queryId: null,
    queryLabel: options.queryLabel ?? null,
    createdAt: new Date(),
  };

  if (options.dryRun) {
    console.log(JSON.stringify(outboxEvent, null, 2));
    return;
  }

  await connectOnce();
  await OutboxModel.create([outboxEvent]);

  console.log(JSON.stringify({
    inserted: true,
    collection: "event_outbox_new_offer",
    guid: outboxEvent.guid,
    slug: outboxEvent.slug,
    queryLabel: outboxEvent.queryLabel,
    publishedAt: outboxEvent.publishedAt.toISOString(),
    note: "Use a unique guid to avoid the already-notified guard in notify.",
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});

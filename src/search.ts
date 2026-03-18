import chalk from 'chalk';
import { fetchOffers } from './fetch.js';
import { parseOffer } from './parse.js';
import { QUERY, STAGE_QUERY } from './query.js';
import type { Offer } from './types.js';

function label(offer: Offer): string {
  const parsed = parseOffer(offer);
  return `${parsed.title} @ ${parsed.company}`;
}

const [prodApi, stageApi] = await Promise.all([
  fetchOffers(QUERY),
  fetchOffers(STAGE_QUERY),
]);

const prodSlugs = new Set(prodApi.data.map((o) => o.slug));
const stageSlugs = new Set(stageApi.data.map((o) => o.slug));

const onlyInProd  = prodApi.data.filter((o) => !stageSlugs.has(o.slug));
const onlyInStage = stageApi.data.filter((o) => !prodSlugs.has(o.slug));
const inBoth      = prodApi.data.filter((o) => stageSlugs.has(o.slug));

console.log();
console.log(chalk.bold('=== A/B Query Diff ==='));
console.log(chalk.dim(`prod:  ${prodApi.data.length} results`));
console.log(chalk.dim(`stage: ${stageApi.data.length} results`));
console.log();

if (onlyInStage.length === 0 && onlyInProd.length === 0) {
  console.log(chalk.dim('Results are identical.'));
} else {
  if (onlyInStage.length > 0) {
    console.log(chalk.green.bold(`+ only in stage (${onlyInStage.length})`));
    for (const offer of onlyInStage) {
      console.log(`  ${chalk.green('+')} ${label(offer)}`);
    }
    console.log();
  }

  if (onlyInProd.length > 0) {
    console.log(chalk.red.bold(`- only in prod (${onlyInProd.length})`));
    for (const offer of onlyInProd) {
      console.log(`  ${chalk.red('-')} ${label(offer)}`);
    }
    console.log();
  }
}

console.log(chalk.dim(`~ common: ${inBoth.length}`));
console.log();
console.log(
  `${chalk.bold.cyan('summary:')} ` +
  `${chalk.green(`+${onlyInStage.length}`)} / ` +
  `${chalk.red(`-${onlyInProd.length}`)} / ` +
  chalk.dim(`~${inBoth.length}`)
);

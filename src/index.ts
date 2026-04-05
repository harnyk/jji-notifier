import { fetchOffers } from "./fetch.js";
import { parseOffer, printOffer } from "./parse.js";
import { connectOnce, QueryModel, upsertOffers } from "./db.js";
import { applyPostFilters } from "./postFilters.js";
import { recordFetchMetrics } from "./metrics.js";
import { log } from "./logger.js";

export const handler = async (): Promise<void> => {
  log.info("connecting to mongodb");
  await connectOnce();

  const queries = await QueryModel.find({ isBootstrapped: true, isActive: true, isArchived: { $ne: true } });
  log.info({ count: queries.length }, "active queries found");

  if (queries.length === 0) {
    log.info("no active queries, exiting");
    return;
  }

  let totalFetched = 0;
  let totalNew = 0;

  for (const query of queries) {
    const t0 = Date.now();
    const api = await fetchOffers(query.config);
    const durationMs = Date.now() - t0;
    const filtered = applyPostFilters(api.data, query.config.postFilters ?? []);
    log.info({ label: query.label, fetched: api.data.length, afterFilter: filtered.length, durationMs }, "fetch complete, upserting");

    const newOffers = await upsertOffers(filtered, { queryId: query._id.toString(), queryLabel: query.label });
    log.info(
      {
        label: query.label,
        fetched: api.data.length,
        new: newOffers.length,
        newOffers: newOffers.map((o) => ({ guid: o.guid, company: o.companyName, title: o.title })),
      },
      "upsert complete",
    );

    newOffers.map((o) => parseOffer(o)).forEach(printOffer);

    totalFetched += api.data.length;
    totalNew += newOffers.length;

    await recordFetchMetrics({ fetched: api.data.length, newOffers: newOffers.length, durationMs });
  }

  log.info({ queries: queries.length, totalFetched, totalNew }, "run complete");
};

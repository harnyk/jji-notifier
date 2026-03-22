import { fetchOffers } from "./fetch.js";
import { parseOffer, printOffer } from "./parse.js";
import { connectOnce, QueryModel, upsertOffers } from "./db.js";
import { recordFetchMetrics } from "./metrics.js";
import { log } from "./logger.js";

export const handler = async (): Promise<void> => {
  log.info("connecting to mongodb");
  await connectOnce();
  log.info("connected, loading queries");

  const queries = await QueryModel.find({ isBootstrapped: true, isActive: true, isArchived: { $ne: true } });
  log.info({ count: queries.length }, "active queries found");

  for (const query of queries) {
    const t0 = Date.now();
    const api = await fetchOffers(query.config);
    const durationMs = Date.now() - t0;
    log.info({ label: query.label, fetched: api.data.length, durationMs }, "fetch complete, upserting");

    const newOffers = await upsertOffers(api.data);
    log.info({ label: query.label, fetched: api.data.length, new: newOffers.length }, "upsert complete");

    newOffers.map(parseOffer).forEach(printOffer);

    await recordFetchMetrics({ fetched: api.data.length, newOffers: newOffers.length, durationMs });
  }
};

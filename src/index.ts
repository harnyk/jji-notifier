import { fetchOffers } from "./fetch.js";
import { parseOffer, printOffer } from "./parse.js";
import { connectOnce, upsertOffers } from "./db.js";
import { recordFetchMetrics } from "./metrics.js";
import { log } from "./logger.js";
import { QUERY } from "./query.js";

export const handler = async (): Promise<void> => {
  log.info("connecting to mongodb");
  await connectOnce();
  log.info("connected, fetching offers");

  const t0 = Date.now();
  const api = await fetchOffers(QUERY);
  const durationMs = Date.now() - t0;
  log.info({ fetched: api.data.length, durationMs }, "fetch complete, upserting");

  const newOffers = await upsertOffers(api.data);
  log.info({ fetched: api.data.length, new: newOffers.length }, "upsert complete");

  newOffers.map(parseOffer).forEach(printOffer);

  await recordFetchMetrics({ fetched: api.data.length, newOffers: newOffers.length, durationMs });
};

import { connectOnce, OutboxModel } from "./db.js";
import { parseOffer } from "./parse.js";
import { notifyBatch } from "./telegram.js";
import type { Offer } from "./types.js";
import { recordNotifyMetrics } from "./metrics.js";
import { log } from "./logger.js";

const BATCH_SIZE = 10;

export const handler = async (): Promise<void> => {
  log.info("connecting to mongodb");
  await connectOnce();
  log.info("connected, querying outbox");

  const events = await OutboxModel.find(
    {},
    null,
    { sort: { createdAt: -1 }, limit: BATCH_SIZE },
  ).lean();
  log.info({ pending: events.length }, "outbox queried");

  if (events.length === 0) {
    log.info("no pending events");
    return;
  }

  const offers = events.map((e) => parseOffer(e.payload as Offer));
  log.info({ count: offers.length }, "sending telegram batch");
  await notifyBatch(offers);

  const ids = events.map((e) => e._id);
  await OutboxModel.deleteMany({ _id: { $in: ids } });

  log.info({ notified: events.length }, "batch sent");
  await recordNotifyMetrics(events.length);
};

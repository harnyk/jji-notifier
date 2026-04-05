import { connectOnce, OutboxModel, OfferModel, markOffersNotified } from "./db.js";
import { parseOffer } from "./parse.js";
import { notifyBatch } from "./telegram.js";
import type { Offer } from "./types.js";
import { recordNotifyMetrics } from "./metrics.js";
import { log } from "./logger.js";

const BATCH_SIZE = 10;

export const handler = async (): Promise<void> => {
  await connectOnce();

  const events = await OutboxModel.find(
    {},
    null,
    { sort: { createdAt: -1 }, limit: BATCH_SIZE },
  ).lean();

  if (events.length === 0) {
    log.info("outbox empty");
    return;
  }

  log.info({ pending: events.length }, "outbox has pending events");

  // Guard: skip any offers already notified (e.g. duplicate outbox entries)
  const guids = events.map((e) => e.guid);
  const offerDocs = await OfferModel.find({ guid: { $in: guids } }, { guid: 1, notifiedAt: 1 }).lean();
  const alreadyNotifiedSet = new Set(offerDocs.filter((d) => d.notifiedAt != null).map((d) => d.guid));
  const pending = events.filter((e) => !alreadyNotifiedSet.has(e.guid));

  if (pending.length < events.length) {
    log.warn({ skipped: events.length - pending.length }, "skipped already-notified offers");
  }

  if (pending.length === 0) {
    await OutboxModel.deleteMany({ _id: { $in: events.map((e) => e._id) } });
    log.info("all outbox events were already notified, cleaned up");
    return;
  }

  log.info(
    { count: pending.length, offers: pending.map((e) => ({ guid: e.guid, company: e.company, slug: e.slug })) },
    "sending telegram batch",
  );

  const offers = pending.map((e) => parseOffer(e.payload as Offer, e.queryLabel ?? undefined));
  await notifyBatch(offers);

  const ids          = pending.map((e) => e._id);
  const pendingGuids = pending.map((e) => e.guid);
  await Promise.all([
    OutboxModel.deleteMany({ _id: { $in: ids } }),
    markOffersNotified(pendingGuids),
  ]);

  log.info({ notified: pending.length }, "batch sent and marked");
  await recordNotifyMetrics(pending.length);
};

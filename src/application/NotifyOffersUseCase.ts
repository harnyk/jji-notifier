import "reflect-metadata";
import { injectable, inject } from "inversify";
import type { IOutboxRepository } from "../ports/IOutboxRepository.js";
import type { IOfferRepository } from "../ports/IOfferRepository.js";
import type { INotificationSender } from "../ports/INotificationSender.js";
import type { IMetricsRecorder } from "../ports/IMetricsRecorder.js";
import type { Offer } from "../domain/types.js";
import { parseOffer } from "../domain/parse.js";
import { log } from "../logger.js";
import { TYPES } from "../container/types.js";

const BATCH_SIZE = 10;

@injectable()
export class NotifyOffersUseCase {
  constructor(
    @inject(TYPES.IOutboxRepository)   private readonly outboxRepo: IOutboxRepository,
    @inject(TYPES.IOfferRepository)    private readonly offerRepo: IOfferRepository,
    @inject(TYPES.INotificationSender) private readonly sender: INotificationSender,
    @inject(TYPES.IMetricsRecorder)    private readonly metrics: IMetricsRecorder,
  ) {}

  async execute(): Promise<void> {
    const events = await this.outboxRepo.findBatch(BATCH_SIZE);

    if (events.length === 0) {
      log.info("outbox empty");
      await this.metrics.recordNotify(0);
      return;
    }

    log.info({ pending: events.length }, "outbox has pending events");

    // Guard: skip any offers already notified (e.g. duplicate outbox entries)
    const guids = events.map((e) => e.guid);
    const alreadyNotifiedGuids = await this.offerRepo.findNotifiedGuids(guids);
    const alreadyNotifiedSet = new Set(alreadyNotifiedGuids);
    const pending = events.filter((e) => !alreadyNotifiedSet.has(e.guid));

    if (pending.length < events.length) {
      log.warn({ skipped: events.length - pending.length }, "skipped already-notified offers");
    }

    if (pending.length === 0) {
      await this.outboxRepo.deleteByIds(events.map((e) => e._id));
      log.info("all outbox events were already notified, cleaned up");
      await this.metrics.recordNotify(0);
      return;
    }

    log.info(
      { count: pending.length, offers: pending.map((e) => ({ guid: e.guid, company: e.company, slug: e.slug })) },
      "sending telegram batch",
    );

    const offers = pending.map((e) => parseOffer(e.payload as Offer, e.queryLabel ?? undefined));
    await this.sender.sendBatch(offers);

    const ids          = pending.map((e) => e._id);
    const pendingGuids = pending.map((e) => e.guid);
    await Promise.all([
      this.outboxRepo.deleteByIds(ids),
      this.offerRepo.markNotified(pendingGuids),
    ]);

    log.info({ notified: pending.length }, "batch sent and marked");
    await this.metrics.recordNotify(pending.length);
  }
}

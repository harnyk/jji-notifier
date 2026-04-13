import "reflect-metadata";
import { injectable, inject } from "inversify";
import type { IQueryRepository } from "../ports/IQueryRepository.js";
import type { IJobApiClient } from "../ports/IJobApiClient.js";
import type { IOfferRepository } from "../ports/IOfferRepository.js";
import type { IMetricsRecorder } from "../ports/IMetricsRecorder.js";
import { applyPostFilters } from "../domain/postFilters.js";
import { parseOffer, printOffer } from "../domain/parse.js";
import { log } from "../logger.js";
import { TYPES } from "../container/types.js";

@injectable()
export class FetchOffersUseCase {
  constructor(
    @inject(TYPES.IQueryRepository)  private readonly queryRepo: IQueryRepository,
    @inject(TYPES.IJobApiClient)      private readonly apiClient: IJobApiClient,
    @inject(TYPES.IOfferRepository)   private readonly offerRepo: IOfferRepository,
    @inject(TYPES.IMetricsRecorder)   private readonly metrics: IMetricsRecorder,
  ) {}

  async execute(): Promise<void> {
    const queries = await this.queryRepo.findActive();
    log.info({ count: queries.length }, "active queries found");

    if (queries.length === 0) {
      log.info("no active queries, exiting");
      return;
    }

    let totalFetched = 0;
    let totalNew = 0;

    for (const query of queries) {
      const t0 = Date.now();
      const api = await this.apiClient.fetchOffers(query.config);
      const durationMs = Date.now() - t0;
      const filtered = applyPostFilters(api.data, query.config.postFilters ?? []);
      const blockedByFilters = api.data.filter((o) => !filtered.includes(o));
      if (blockedByFilters.length > 0) {
        log.info(
          {
            query: query.label,
            count: blockedByFilters.length,
            offers: blockedByFilters.map((o) => ({
              guid: o.guid,
              title: o.title,
              company: o.companyName,
              url: `https://justjoin.it/offers/${o.slug}`,
            })),
          },
          "offers blocked by post-filters",
        );
      }
      log.info({ label: query.label, fetched: api.data.length, afterFilter: filtered.length, durationMs }, "fetch complete, upserting");

      const newOffers = await this.offerRepo.upsertOffers(filtered, {
        queryId: String(query._id),
        queryLabel: query.label,
      });
      log.info(
        {
          label: query.label,
          fetched: api.data.length,
          new: newOffers.length,
          newOffers: newOffers.map((o) => ({ guid: o.guid, company: o.companyName, title: o.title })),
        },
        "upsert complete",
      );

      // newOffers.map((o) => parseOffer(o)).forEach(printOffer);

      totalFetched += api.data.length;
      totalNew += newOffers.length;

      await this.metrics.recordFetch({
        fetched: api.data.length,
        filteredOut: api.data.length - filtered.length,
        newOffers: newOffers.length,
        durationMs,
      });
    }

    log.info({ queries: queries.length, totalFetched, totalNew }, "run complete");
  }
}

import "reflect-metadata";
import mongoose from "mongoose";
import { injectable } from "inversify";
import type { Offer } from "../../domain/types.js";
import type { IOfferRepository, UpsertOptions } from "../../ports/IOfferRepository.js";
import { withMongoRetry } from "./connection.js";
import { OfferModel, OutboxModel } from "./models.js";

@injectable()
export class MongoOfferRepository implements IOfferRepository {
  async upsertOffers(offers: Offer[], opts: UpsertOptions = {}): Promise<Offer[]> {
    return withMongoRetry("upsertOffers", async () => {
      const newOffers: Offer[] = [];
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          for (const offer of offers) {
            const result = await OfferModel.updateOne(
              { guid: offer.guid },
              {
                $setOnInsert: {
                  guid:        offer.guid,
                  slug:        offer.slug,
                  company:     offer.companyName,
                  publishedAt: new Date(offer.publishedAt),
                  payload:     offer,
                },
              },
              { upsert: true, session },
            );

            if (result.upsertedCount > 0) {
              if (!opts.skipNotifications) {
                await OutboxModel.create(
                  [{
                    guid:        offer.guid,
                    slug:        offer.slug,
                    company:     offer.companyName,
                    publishedAt: new Date(offer.publishedAt),
                    payload:     offer,
                    queryId:     opts.queryId ?? null,
                    queryLabel:  opts.queryLabel ?? null,
                    createdAt:   new Date(),
                  }],
                  { session },
                );
              }
              newOffers.push(offer);
            }
          }
        });
      } finally {
        await session.endSession();
      }

      return newOffers;
    });
  }

  async markNotified(guids: string[]): Promise<void> {
    await withMongoRetry("markOffersNotified", async () => {
      await OfferModel.updateMany(
        { guid: { $in: guids } },
        { $set: { notifiedAt: new Date() } },
      );
    });
  }

  async findNotifiedGuids(guids: string[]): Promise<string[]> {
    return withMongoRetry("findNotifiedGuids", async () => {
      const docs = await OfferModel.find(
        { guid: { $in: guids } },
        { guid: 1, notifiedAt: 1 },
      ).lean();
      return docs.filter((d) => d.notifiedAt != null).map((d) => d.guid);
    });
  }
}

import mongoose, { Schema } from "mongoose";
import type { Offer } from "./types.js";

const offerSchema = new Schema(
  {
    guid:        { type: String, required: true, unique: true },
    slug:        { type: String, required: true },
    company:     { type: String, required: true },
    publishedAt: { type: Date,   required: true },
    payload:     { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: "seenAt", updatedAt: false } },
);

const outboxSchema = new Schema(
  {
    guid:          { type: String, required: true },
    slug:          { type: String, required: true },
    company:       { type: String, required: true },
    publishedAt:   { type: Date,   required: true },
    payload:       { type: Schema.Types.Mixed, required: true },
    createdAt:     { type: Date,   required: true, default: Date.now, expires: 2 * 24 * 60 * 60 },
  },
  { collection: "event_outbox_new_offer", timestamps: false },
);

export const OfferModel = mongoose.model("Offer", offerSchema);
export const OutboxModel = mongoose.model("EventOutboxNewOffer", outboxSchema);

export async function connect() {
  const uri = process.env["MONGO_URI"];
  if (!uri) throw new Error("MONGO_URI is not set");
  await mongoose.connect(uri);
}

let connectionPromise: Promise<void> | null = null;

export async function connectOnce(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = connect().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  await connectionPromise;
}

/** Insert new offers + emit one outbox event per new offer, atomically. */
export async function upsertOffers(offers: Offer[]): Promise<Offer[]> {
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
          await OutboxModel.create(
            [{
              guid:        offer.guid,
              slug:        offer.slug,
              company:     offer.companyName,
              publishedAt: new Date(offer.publishedAt),
              payload:     offer,
              createdAt:   new Date(),
            }],
            { session },
          );
          newOffers.push(offer);
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return newOffers;
}

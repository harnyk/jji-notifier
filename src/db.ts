import mongoose, { Schema } from "mongoose";
import type { Offer, SearchQuery } from "./types.js";
import { log } from "./logger.js";

const offerSchema = new Schema(
  {
    guid:        { type: String, required: true, unique: true },
    slug:        { type: String, required: true },
    company:     { type: String, required: true },
    publishedAt: { type: Date,   required: true },
    payload:     { type: Schema.Types.Mixed, required: true },
    notifiedAt:  { type: Date,   default: null },
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
    queryId:       { type: String, default: null },
    queryLabel:    { type: String, default: null },
    createdAt:     { type: Date,   required: true, default: Date.now, expires: 2 * 24 * 60 * 60 },
  },
  { collection: "event_outbox_new_offer", timestamps: false },
);

const querySchema = new Schema(
  {
    label:          { type: String, required: true },
    config:         { type: Schema.Types.Mixed, required: true },
    isBootstrapped: { type: Boolean, default: false },
    isActive:       { type: Boolean, default: false },
    isArchived:     { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const OfferModel = mongoose.model("Offer", offerSchema);
export const OutboxModel = mongoose.model("EventOutboxNewOffer", outboxSchema);
export const QueryModel  = mongoose.model<{ label: string; config: SearchQuery; isBootstrapped: boolean; isActive: boolean; isArchived: boolean; createdAt: Date }>("Query", querySchema);

const RETRYABLE_MONGO_ERROR_NAMES = new Set([
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoPoolClearedError",
  "MongoServerSelectionError",
  "MongoTopologyClosedError",
]);

const RETRYABLE_SOCKET_CODES = new Set([
  "EPIPE",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

export async function connect() {
  const uri = process.env["MONGO_URI"];
  if (!uri) throw new Error("MONGO_URI is not set");
  await mongoose.connect(uri);
}

let connectionPromise: Promise<void> | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorCode(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  const code = error["code"];
  return typeof code === "string" ? code : undefined;
}

function getErrorName(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  const name = error["name"];
  return typeof name === "string" ? name : undefined;
}

function getErrorCause(error: unknown): unknown {
  if (!isObject(error) || !("cause" in error)) return undefined;
  return error["cause"];
}

export function isRetryableMongoConnectionError(error: unknown): boolean {
  const name = getErrorName(error);
  const code = getErrorCode(error);
  if ((name && RETRYABLE_MONGO_ERROR_NAMES.has(name)) || (code && RETRYABLE_SOCKET_CODES.has(code))) {
    return true;
  }

  const cause = getErrorCause(error);
  if (cause && cause !== error) {
    return isRetryableMongoConnectionError(cause);
  }

  return false;
}

async function connectFresh(): Promise<void> {
  if (!connectionPromise) {
    connectionPromise = connect().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  await connectionPromise;
}

async function reconnect(): Promise<void> {
  connectionPromise = null;

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (error) {
      log.warn({ err: error }, "failed to disconnect stale mongodb connection");
    }
  }

  await connectFresh();
}

async function pingConnection(): Promise<void> {
  if (mongoose.connection.db == null) {
    throw new Error("mongoose connection is ready but db handle is missing");
  }

  await mongoose.connection.db.admin().command({ ping: 1 });
}

export async function connectOnce(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await connectFresh();
    return;
  }

  try {
    await pingConnection();
  } catch (error) {
    if (!isRetryableMongoConnectionError(error)) {
      throw error;
    }

    log.warn({ err: error }, "mongodb connection check failed, reconnecting");
    await reconnect();
  }
}

export async function withMongoRetry<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableMongoConnectionError(error)) {
      throw error;
    }

    log.warn({ err: error, operationName }, "mongodb operation failed on stale connection, retrying once");
    await reconnect();
    return await operation();
  }
}

/** Mark offers as notified by setting notifiedAt timestamp. */
export async function markOffersNotified(guids: string[]): Promise<void> {
  await withMongoRetry("markOffersNotified", async () => {
    await OfferModel.updateMany(
      { guid: { $in: guids } },
      { $set: { notifiedAt: new Date() } },
    );
  });
}

/** Insert new offers + emit one outbox event per new offer, atomically. */
export async function upsertOffers(
  offers: Offer[],
  opts: { skipNotifications?: boolean; queryId?: string; queryLabel?: string } = {},
): Promise<Offer[]> {
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

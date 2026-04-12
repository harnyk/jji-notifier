import mongoose, { Schema } from "mongoose";
import type { SearchQuery } from "../../domain/types.js";

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

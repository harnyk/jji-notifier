import type { Offer } from "../domain/types.js";

export interface OutboxEvent {
  _id: unknown;
  guid: string;
  slug: string;
  company: string;
  publishedAt: Date;
  payload: Offer;
  queryId: string | null;
  queryLabel: string | null;
}

export interface IOutboxRepository {
  findBatch(limit: number): Promise<OutboxEvent[]>;
  deleteByIds(ids: unknown[]): Promise<void>;
}

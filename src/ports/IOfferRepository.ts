import type { Offer } from "../domain/types.js";

export interface UpsertOptions {
  skipNotifications?: boolean;
  queryId?: string;
  queryLabel?: string;
}

export interface IOfferRepository {
  upsertOffers(offers: Offer[], opts?: UpsertOptions): Promise<Offer[]>;
  markNotified(guids: string[]): Promise<void>;
  findNotifiedGuids(guids: string[]): Promise<string[]>;
}

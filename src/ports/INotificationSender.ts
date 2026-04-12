import type { ParsedOffer } from "../domain/parse.js";

export interface INotificationSender {
  sendBatch(offers: ParsedOffer[]): Promise<void>;
}

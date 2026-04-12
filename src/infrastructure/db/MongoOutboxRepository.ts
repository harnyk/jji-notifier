import "reflect-metadata";
import { injectable } from "inversify";
import type { IOutboxRepository, OutboxEvent } from "../../ports/IOutboxRepository.js";
import { withMongoRetry } from "./connection.js";
import { OutboxModel } from "./models.js";

@injectable()
export class MongoOutboxRepository implements IOutboxRepository {
  async findBatch(limit: number): Promise<OutboxEvent[]> {
    return withMongoRetry("outbox.findBatch", async () => {
      const docs = await OutboxModel.find({}, null, { sort: { createdAt: -1 }, limit }).lean();
      return docs as OutboxEvent[];
    });
  }

  async deleteByIds(ids: unknown[]): Promise<void> {
    await withMongoRetry("outbox.deleteByIds", async () => {
      await OutboxModel.deleteMany({ _id: { $in: ids } });
    });
  }
}

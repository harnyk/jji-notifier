import "reflect-metadata";
import { injectable } from "inversify";
import type { IQueryRepository, ActiveQuery } from "../../ports/IQueryRepository.js";
import { withMongoRetry } from "./connection.js";
import { QueryModel } from "./models.js";

@injectable()
export class MongoQueryRepository implements IQueryRepository {
  async findActive(): Promise<ActiveQuery[]> {
    return withMongoRetry("query.findActive", async () => {
      const docs = await QueryModel.find({
        isBootstrapped: true,
        isActive: true,
        isArchived: { $ne: true },
      });
      return docs as ActiveQuery[];
    });
  }
}

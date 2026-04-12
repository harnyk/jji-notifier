import type { SearchQuery } from "../domain/types.js";

export interface ActiveQuery {
  _id: unknown;
  label: string;
  config: SearchQuery;
}

export interface IQueryRepository {
  findActive(): Promise<ActiveQuery[]>;
}

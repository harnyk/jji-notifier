import type { ApiResponse, SearchQuery } from "../domain/types.js";

export interface IJobApiClient {
  fetchOffers(query: SearchQuery): Promise<ApiResponse>;
}

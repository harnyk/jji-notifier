import type { ApiResponse, SearchQuery } from "./types.js";
import { log } from "./logger.js";

const BASE_URL = "https://justjoin.it/api/candidate-api/offers";

export function buildUrl(query: SearchQuery): string {
  const params = new URLSearchParams();

  if (query.from !== undefined) params.set("from", String(query.from));
  if (query.itemsCount !== undefined) params.set("itemsCount", String(query.itemsCount));
  if (query.categories?.length) {
    for (const c of query.categories) params.append("categories", c);
  }
  if (query.cityRadius !== undefined) params.set("cityRadius", String(query.cityRadius));
  if (query.employmentTypes?.length) {
    for (const t of query.employmentTypes) params.append("employmentTypes", t);
  }
  if (query.remoteWorkOptions?.length) {
    for (const r of query.remoteWorkOptions) params.append("remoteWorkOptions", r);
  }
  if (query.workingTimes?.length) {
    for (const w of query.workingTimes) params.append("workingTimes", w);
  }
  if (query.currency) params.set("currency", query.currency);
  if (query.experienceLevels?.length) {
    for (const e of query.experienceLevels) params.append("experienceLevels", e);
  }
  if (query.orderBy) params.set("orderBy", query.orderBy);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.keywords) params.set("keywords", query.keywords);
  if (query.keywordType) params.set("keywordType", query.keywordType);
  if (query.isPromoted !== undefined) params.set("isPromoted", String(query.isPromoted));

  return `${BASE_URL}?${params.toString()}`;
}

export async function fetchOffers(query: SearchQuery): Promise<ApiResponse> {
  const url = buildUrl(query);
  log.info({ url }, "fetching offers");

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; jji-notifier/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<ApiResponse>;
}

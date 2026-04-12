export interface FetchMetrics {
  fetched: number;
  filteredOut: number;
  newOffers: number;
  durationMs: number;
}

export interface IMetricsRecorder {
  recordFetch(metrics: FetchMetrics): Promise<void>;
  recordNotify(count: number): Promise<void>;
}

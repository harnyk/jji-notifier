import { createMetricsLogger, Unit } from "aws-embedded-metrics";

export async function recordFetchMetrics(opts: {
  fetched: number;
  newOffers: number;
  durationMs: number;
}): Promise<void> {
  const m = createMetricsLogger();
  m.setNamespace("jji");
  m.setDimensions({});
  m.putMetric("offers_fetched", opts.fetched, Unit.Count);
  m.putMetric("offers_new", opts.newOffers, Unit.Count);
  m.putMetric("fetch_duration_ms", opts.durationMs, Unit.Milliseconds);
  await m.flush();
}

export async function recordNotifyMetrics(count: number): Promise<void> {
  const m = createMetricsLogger();
  m.setNamespace("jji");
  m.setDimensions({});
  m.putMetric("notifications_sent", count, Unit.Count);
  await m.flush();
}

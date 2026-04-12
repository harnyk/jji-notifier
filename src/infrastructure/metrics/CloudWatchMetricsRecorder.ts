import "reflect-metadata";
import { createMetricsLogger, Unit } from "aws-embedded-metrics";
import { injectable } from "inversify";
import type { IMetricsRecorder, FetchMetrics } from "../../ports/IMetricsRecorder.js";

@injectable()
export class CloudWatchMetricsRecorder implements IMetricsRecorder {
  async recordFetch(metrics: FetchMetrics): Promise<void> {
    const m = createMetricsLogger();
    m.setNamespace("jji");
    m.setDimensions({});
    m.putMetric("offers_fetched", metrics.fetched, Unit.Count);
    m.putMetric("offers_filtered_out", metrics.filteredOut, Unit.Count);
    m.putMetric("offers_new", metrics.newOffers, Unit.Count);
    m.putMetric("fetch_duration_ms", metrics.durationMs, Unit.Milliseconds);
    await m.flush();
  }

  async recordNotify(count: number): Promise<void> {
    const m = createMetricsLogger();
    m.setNamespace("jji");
    m.setDimensions({});
    m.putMetric("notifications_sent", count, Unit.Count);
    await m.flush();
  }
}

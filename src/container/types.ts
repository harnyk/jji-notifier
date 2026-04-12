export const TYPES = {
  IOfferRepository:    Symbol.for("IOfferRepository"),
  IOutboxRepository:   Symbol.for("IOutboxRepository"),
  IQueryRepository:    Symbol.for("IQueryRepository"),
  IJobApiClient:       Symbol.for("IJobApiClient"),
  INotificationSender: Symbol.for("INotificationSender"),
  IMetricsRecorder:    Symbol.for("IMetricsRecorder"),
  FetchOffersUseCase:  Symbol.for("FetchOffersUseCase"),
  NotifyOffersUseCase: Symbol.for("NotifyOffersUseCase"),
} as const;

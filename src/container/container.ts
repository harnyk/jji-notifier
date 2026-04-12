import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types.js";
import { MongoOfferRepository } from "../infrastructure/db/MongoOfferRepository.js";
import { MongoOutboxRepository } from "../infrastructure/db/MongoOutboxRepository.js";
import { MongoQueryRepository } from "../infrastructure/db/MongoQueryRepository.js";
import { JjiApiClient } from "../infrastructure/api/JjiApiClient.js";
import { TelegramNotificationSender } from "../infrastructure/telegram/TelegramNotificationSender.js";
import { CloudWatchMetricsRecorder } from "../infrastructure/metrics/CloudWatchMetricsRecorder.js";
import { FetchOffersUseCase } from "../application/FetchOffersUseCase.js";
import { NotifyOffersUseCase } from "../application/NotifyOffersUseCase.js";

export function buildContainer(): Container {
  const container = new Container({ defaultScope: "Singleton" });

  container.bind(TYPES.IOfferRepository).to(MongoOfferRepository);
  container.bind(TYPES.IOutboxRepository).to(MongoOutboxRepository);
  container.bind(TYPES.IQueryRepository).to(MongoQueryRepository);
  container.bind(TYPES.IJobApiClient).to(JjiApiClient);
  container.bind(TYPES.INotificationSender).to(TelegramNotificationSender);
  container.bind(TYPES.IMetricsRecorder).to(CloudWatchMetricsRecorder);
  container.bind(TYPES.FetchOffersUseCase).to(FetchOffersUseCase);
  container.bind(TYPES.NotifyOffersUseCase).to(NotifyOffersUseCase);

  return container;
}

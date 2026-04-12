import "reflect-metadata";
import { connectOnce } from "../infrastructure/db/connection.js";
import { buildContainer } from "../container/container.js";
import { TYPES } from "../container/types.js";
import type { FetchOffersUseCase } from "../application/FetchOffersUseCase.js";
import { log } from "../logger.js";

const container = buildContainer();

export const handler = async (): Promise<void> => {
  log.info("connecting to mongodb");
  await connectOnce();
  await container.get<FetchOffersUseCase>(TYPES.FetchOffersUseCase).execute();
};

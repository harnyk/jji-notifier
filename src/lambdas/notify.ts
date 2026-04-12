import "reflect-metadata";
import { connectOnce } from "../infrastructure/db/connection.js";
import { buildContainer } from "../container/container.js";
import { TYPES } from "../container/types.js";
import type { NotifyOffersUseCase } from "../application/NotifyOffersUseCase.js";

const container = buildContainer();

export const handler = async (): Promise<void> => {
  await connectOnce();
  await container.get<NotifyOffersUseCase>(TYPES.NotifyOffersUseCase).execute();
};

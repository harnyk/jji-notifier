import pino from "pino";

export const log = pino({
  base: { service: "jji-notifier" },
  timestamp: pino.stdTimeFunctions.isoTime,
  level: process.env.LOG_LEVEL ?? "info",
});

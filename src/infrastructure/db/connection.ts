import mongoose from "mongoose";
import { log } from "../../logger.js";

const RETRYABLE_MONGO_ERROR_NAMES = new Set([
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoPoolClearedError",
  "MongoServerSelectionError",
  "MongoTopologyClosedError",
]);

const RETRYABLE_SOCKET_CODES = new Set([
  "EPIPE",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

export async function connect() {
  const uri = process.env["MONGO_URI"];
  if (!uri) throw new Error("MONGO_URI is not set");
  await mongoose.connect(uri);
}

let connectionPromise: Promise<void> | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorCode(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  const code = error["code"];
  return typeof code === "string" ? code : undefined;
}

function getErrorName(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  const name = error["name"];
  return typeof name === "string" ? name : undefined;
}

function getErrorCause(error: unknown): unknown {
  if (!isObject(error) || !("cause" in error)) return undefined;
  return error["cause"];
}

export function isRetryableMongoConnectionError(error: unknown): boolean {
  const name = getErrorName(error);
  const code = getErrorCode(error);
  if ((name && RETRYABLE_MONGO_ERROR_NAMES.has(name)) || (code && RETRYABLE_SOCKET_CODES.has(code))) {
    return true;
  }

  const cause = getErrorCause(error);
  if (cause && cause !== error) {
    return isRetryableMongoConnectionError(cause);
  }

  return false;
}

async function connectFresh(): Promise<void> {
  if (!connectionPromise) {
    connectionPromise = connect().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  await connectionPromise;
}

export async function reconnect(): Promise<void> {
  connectionPromise = null;

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (error) {
      log.warn({ err: error }, "failed to disconnect stale mongodb connection");
    }
  }

  await connectFresh();
}

async function pingConnection(): Promise<void> {
  if (mongoose.connection.db == null) {
    throw new Error("mongoose connection is ready but db handle is missing");
  }

  await mongoose.connection.db.admin().command({ ping: 1 });
}

export async function connectOnce(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await connectFresh();
    return;
  }

  try {
    await pingConnection();
  } catch (error) {
    if (!isRetryableMongoConnectionError(error)) {
      throw error;
    }

    log.warn({ err: error }, "mongodb connection check failed, reconnecting");
    await reconnect();
  }
}

export async function withMongoRetry<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableMongoConnectionError(error)) {
      throw error;
    }

    log.warn({ err: error, operationName }, "mongodb operation failed on stale connection, retrying once");
    await reconnect();
    return await operation();
  }
}

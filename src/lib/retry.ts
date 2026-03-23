import { logClientTelemetry } from "@/lib/telemetry";

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    source?: string;
  },
): Promise<T> => {
  const retries = options?.retries ?? 2;
  const initialDelayMs = options?.initialDelayMs ?? 250;
  const backoffFactor = options?.backoffFactor ?? 1.8;

  let attempt = 0;
  let delay = initialDelayMs;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logClientTelemetry({
        type: "fetch-error",
        source: options?.source ?? "withRetry",
        message: error instanceof Error ? error.message : "Unknown fetch error",
        metadata: {
          attempt,
          retries,
        },
      });

      if (attempt >= retries) {
        break;
      }

      await sleep(delay);
      delay = Math.round(delay * backoffFactor);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Operation failed");
};
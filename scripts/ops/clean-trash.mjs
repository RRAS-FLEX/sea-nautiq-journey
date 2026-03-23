import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const start = Date.now();

const TARGETS = [
  "dist",
  "dist-ssr",
  "build-log.txt",
  "coverage",
  "playwright-report",
  "test-results",
  ".vite",
];

const removeTarget = async (target) => {
  const fullPath = resolve(process.cwd(), target);
  try {
    await rm(fullPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 80 });
    return { target, removed: true };
  } catch (error) {
    return {
      target,
      removed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const main = async () => {
  const results = await Promise.all(TARGETS.map(removeTarget));
  const failed = results.filter((result) => !result.removed);
  const elapsedMs = Date.now() - start;

  if (failed.length > 0) {
    console.error("Trash cleanup completed with errors:");
    for (const failure of failed) {
      console.error(`- ${failure.target}: ${failure.error}`);
    }
    console.log(`Cleanup finished in ${elapsedMs}ms`);
    process.exit(1);
  }

  console.log(`Trash cleanup complete (${results.length} targets) in ${elapsedMs}ms`);
};

main();

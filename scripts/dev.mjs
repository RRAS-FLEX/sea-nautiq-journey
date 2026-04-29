import { spawn } from "child_process";

const isWindows = process.platform === "win32";

const spawnScript = (scriptName) => {
  if (isWindows) {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], {
      stdio: "inherit",
    });
  }

  return spawn("npm", ["run", scriptName], {
    stdio: "inherit",
  });
};

const children = [
  spawnScript("dev:frontend"),
  spawnScript("dev:api"),
];

const shutdown = (signal) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (signal || code !== 0) {
      shutdown(signal ?? "SIGTERM");
      process.exitCode = code ?? 1;
    }
  });
}

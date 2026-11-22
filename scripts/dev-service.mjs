// Development-only worker: direct Node children allow scoped, graceful IPC shutdown on Windows.
import { fileURLToPath } from "node:url";
const mode = process.argv[2];
let stopping = false;
let initialized = false;
let close = async () => {
  process.emit("SIGTERM");
};
async function shutdown() {
  if (stopping) return;
  stopping = true;
  if (!initialized) return;
  await close();
  if (mode !== "backend") process.exit(0);
}
process.on("message", (message) => {
  if (message?.type === "shutdown") void shutdown();
});
process.on("disconnect", () => void shutdown());
if (mode === "backend") {
  await import("../backend/dist/server.js");
} else if (mode === "frontend") {
  const { createServer } =
    await import("../frontend/node_modules/vite/dist/node/index.js");
  const server = await createServer({
    root: fileURLToPath(new URL("../frontend/", import.meta.url)),
    server: {
      host: process.env.SUNSHIELD_FRONT_HOST,
      port: Number(process.env.SUNSHIELD_FRONT_PORT),
      strictPort: true,
      open: false,
    },
  });
  close = () => server.close();
  await server.listen();
  server.printUrls();
} else if (mode === "database") {
  let storage;
  const timeout = setTimeout(() => {
    console.error("Read-only database check timed out");
    process.exit(1);
  }, 12_000);
  try {
    storage = await import("../dist/src/config/database.js");
    await storage.verifyDatabaseConnection();
    console.log("SELECT 1 succeeded");
  } catch {
    console.error(
      "Read-only database connectivity failed (details suppressed)",
    );
    process.exitCode = 1;
  } finally {
    if (storage) await storage.disconnectDatabase();
    clearTimeout(timeout);
    process.exit(process.exitCode || 0);
  }
} else throw new Error("Unknown development worker");
initialized = true;
if (stopping) {
  stopping = false;
  await shutdown();
}

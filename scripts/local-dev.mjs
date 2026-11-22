import {
  readFile,
  writeFile,
  mkdir,
  access,
  readdir,
  open,
  unlink,
} from "node:fs/promises";
import { watch } from "node:fs";
import * as nodeUtil from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

export const root = fileURLToPath(new URL("../", import.meta.url));
const at = (...parts) => path.join(root, ...parts);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const backendDefaults = {
  NODE_ENV: "development",
  PORT: "8000",
  FRONTEND_URL: "http://localhost:5173",
  OPEN_METEO_BASE_URL: "https://api.open-meteo.com/v1",
  WEATHER_CACHE_TTL_SECONDS: "600",
  COMMUNITY_WRITES_ENABLED: "false",
};
const frontendDefaults = {
  VITE_API_BASE_URL: "http://localhost:8000/api/v1",
  VITE_USE_MOCKS: "false",
};
export async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
async function envFile(file) {
  try {
    return nodeUtil.parseEnv(await readFile(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return {};
    throw new Error(
      `Cannot read environment file ${path.relative(root, file)}`,
    );
  }
}
export function mergeBackendEnvironment(local, shared, backend, inherited) {
  return { ...backendDefaults, ...local, ...shared, ...backend, ...inherited };
}
export async function configuration() {
  const env = mergeBackendEnvironment(
    await envFile(at("backend/.env.development.local")),
    await envFile(at(".env")),
    await envFile(at("backend/.env")),
    process.env,
  );
  const { loadEnv } = await import(
    pathToFileURL(at("frontend/node_modules/vite/dist/node/index.js"))
  );
  const front = {
    ...frontendDefaults,
    ...loadEnv("development", at("frontend"), "VITE_"),
  };
  for (const [key, value] of Object.entries(process.env))
    if (key.startsWith("VITE_")) front[key] = value;
  return { env, front };
}
export function validateConfiguration({ env, front }, mode = "dev") {
  const errors = [];
  const url = (key, value, protocols) => {
    try {
      const parsed = new URL(value);
      if (
        !protocols.includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash
      )
        throw Error();
      return parsed;
    } catch {
      errors.push(
        `${key} must be a valid URL without credentials, query or fragment`,
      );
      return null;
    }
  };
  if (env.NODE_ENV !== "development")
    errors.push(
      "NODE_ENV must be development for local launchers; use npm start for production",
    );
  if (!/^\d+$/.test(env.PORT) || +env.PORT < 1 || +env.PORT > 65535)
    errors.push("PORT must be an integer from 1 to 65535");
  const origin = url("FRONTEND_URL", env.FRONTEND_URL, ["http:"]);
  if (
    origin &&
    (!["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
      origin.pathname !== "/")
  )
    errors.push("FRONTEND_URL must be a loopback HTTP origin");
  if (origin && env.FRONTEND_URL !== origin.origin)
    errors.push(
      "FRONTEND_URL must be the exact origin without a trailing slash or path",
    );
  url("OPEN_METEO_BASE_URL", env.OPEN_METEO_BASE_URL, ["https:"]);
  if (
    !/^\d+$/.test(env.WEATHER_CACHE_TTL_SECONDS) ||
    +env.WEATHER_CACHE_TTL_SECONDS < 1 ||
    +env.WEATHER_CACHE_TTL_SECONDS > 3600
  )
    errors.push("WEATHER_CACHE_TTL_SECONDS must be 1 through 3600");
  if (env.COMMUNITY_WRITES_ENABLED !== "false")
    errors.push("Local launchers require COMMUNITY_WRITES_ENABLED=false");
  for (const key of ["DATABASE_URL", "DIRECT_URL"])
    if (env[key]?.trim()) {
      try {
        const parsed = new URL(env[key]);
        if (
          !["postgres:", "postgresql:"].includes(parsed.protocol) ||
          /<|>/.test(env[key])
        )
          throw Error();
      } catch {
        errors.push(
          `${key} is invalid or contains example placeholders; configure it privately or remove it for database-free development`,
        );
      }
    }
  const api = url("VITE_API_BASE_URL", front.VITE_API_BASE_URL, [
    "http:",
    "https:",
  ]);
  if (api && api.pathname.replace(/\/$/, "") !== "/api/v1")
    errors.push("VITE_API_BASE_URL must end with /api/v1");
  if (front.VITE_USE_MOCKS !== "false")
    errors.push("VITE_USE_MOCKS must be false for local integration");
  if (
    mode === "dev" &&
    api &&
    (api.protocol !== "http:" ||
      api.hostname !== "localhost" ||
      +(api.port || 80) !== +env.PORT)
  )
    errors.push(
      "VITE_API_BASE_URL must match http://localhost:PORT/api/v1 for the combined launcher",
    );
  if (mode !== "backend" && origin && +(origin.port || 80) === +env.PORT)
    errors.push("Frontend and backend ports must differ");
  if (errors.length) throw new Error(errors.join("\n"));
  return {
    port: +env.PORT,
    frontPort: +(origin.port || 80),
    frontHost: origin.hostname.replace(/^\[|\]$/g, ""),
    frontUrl: origin.origin,
    backendUrl: `http://localhost:${env.PORT}`,
  };
}
function nodeCheck() {
  if (+process.versions.node.split(".")[0] !== 24)
    throw new Error(
      "Install Node.js 24.x (including npm), reopen this terminal, then run npm run setup.",
    );
}
const dependencyFiles = [
  "node_modules/typescript/bin/tsc",
  "node_modules/prisma/build/index.js",
  "node_modules/@prisma/adapter-pg/package.json",
  "backend/node_modules/typescript/bin/tsc",
  "backend/node_modules/express/package.json",
  "frontend/node_modules/vite/dist/node/index.js",
  "frontend/node_modules/react/package.json",
];
async function dependencies() {
  const missing = [];
  for (const file of dependencyFiles)
    if (!(await exists(at(file)))) missing.push(file);
  if (missing.length)
    throw new Error(
      `Missing dependencies: ${missing.join(", ")}. Run npm run setup.`,
    );
}
async function npmCli() {
  const candidates = [
    process.env.npm_execpath,
    path.join(
      path.dirname(process.execPath),
      "node_modules/npm/bin/npm-cli.js",
    ),
  ].filter(Boolean);
  for (const file of candidates) if (await exists(file)) return file;
  throw new Error(
    "npm CLI not found. Install Node.js 24 with npm and run using npm.cmd on Windows.",
  );
}
export async function portFree(port) {
  // On Windows a wildcard bind can succeed while an existing dual-stack listener owns the port.
  for (const host of ["127.0.0.1", "::1"]) {
    const listening = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (listening) return false;
  }
  // Probe both address families and wildcard interfaces; never kill a port owner.
  for (const host of ["127.0.0.1", "::1", "::", "0.0.0.0"]) {
    const available = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once("error", (e) => {
        if (["EAFNOSUPPORT", "EADDRNOTAVAIL"].includes(e.code)) resolve(true);
        else if (e.code === "EADDRINUSE") resolve(false);
        else reject(e);
      });
      server.listen(
        { host, port, ipv6Only: host === "::", exclusive: true },
        () => server.close(() => resolve(true)),
      );
    });
    if (!available) return false;
  }
  return true;
}
export async function probe(url, health = false) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return false;
    if (health) {
      const body = await response.json();
      return body.status === "UP" && body.application === "SunShield";
    }
    return true;
  } catch {
    return false;
  }
}
const children = new Set();
let stopping = false;
let cleanupPromise;
function launch(label, file, args = [], options = {}) {
  const child = spawn(process.execPath, [file, ...args], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true,
    ...options,
  });
  children.add(child);
  for (const stream of ["stdout", "stderr"]) {
    let pending = "";
    child[stream].on("data", (chunk) => {
      pending += chunk.toString();
      const lines = pending.split(/\r?\n/);
      pending = lines.pop();
      for (const line of lines)
        if (line)
          console[stream === "stderr" ? "error" : "log"](`[${label}] ${line}`);
    });
    child[stream].on("end", () => {
      if (pending) console.log(`[${label}] ${pending}`);
    });
  }
  child.completion = new Promise((resolve) => {
    child.once("error", () => resolve(1));
    child.once("exit", (code) => resolve(code ?? 1));
  });
  child.completion.then(() => children.delete(child));
  return child;
}
async function run(label, file, args = [], options = {}) {
  const child = launch(label, file, args, options);
  const code = await child.completion;
  if (code !== 0 || stopping)
    throw new Error(
      `${label} failed (${code}). Resolve the errors above, then retry.`,
    );
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.expectedExit = true;
  if (child.connected) {
    try {
      child.send({ type: "shutdown" });
    } catch {
      /* Child already exited. */
    }
  } else child.kill("SIGTERM");
  let timer;
  await Promise.race([
    child.completion,
    new Promise((resolve) => {
      timer = setTimeout(resolve, 12_000);
    }),
  ]);
  clearTimeout(timer);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await child.completion;
  }
}
async function cleanup(code = 0) {
  // A failure can arrive after a finally block already began normal cleanup.
  if (code) process.exitCode = code;
  if (cleanupPromise) return cleanupPromise;
  stopping = true;
  cleanupPromise = (async () => {
    await Promise.all([...children].map(stop));
    process.exitCode ||= code;
  })();
  return cleanupPromise;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    console.log("\n[dev] Stopping owned services...");
    void cleanup();
  });
process.on("message", (message) => {
  if (message?.type === "shutdown") void cleanup();
});

async function createEnvironments() {
  for (const [file, values] of [
    ["backend/.env.development.local", backendDefaults],
    ["frontend/.env.development.local", frontendDefaults],
  ]) {
    try {
      await writeFile(
        at(file),
        "# Local development only. Existing shell and environment configuration take precedence.\n" +
          Object.entries(values)
            .map(([k, v]) => `${k}=${v}`)
            .join("\n") +
          "\n",
        { flag: "wx" },
      );
      console.log(`[setup] Created ${file} (ignored by Git)`);
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      console.log(`[setup] Preserved ${file}`);
    }
  }
}
async function fileList(entry) {
  if (!(await exists(at(entry)))) return [];
  const entries = await readdir(at(entry), { withFileTypes: true });
  const result = [];
  for (const item of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${entry}/${item.name}`;
    if (item.isDirectory()) result.push(...(await fileList(relative)));
    else if (item.isFile()) result.push(relative);
  }
  return result;
}
async function fingerprint(files) {
  const hash = createHash("sha256");
  hash.update(process.versions.node);
  for (const file of [...new Set(files)].sort()) {
    hash.update(file);
    try {
      hash.update(await readFile(at(file)));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      hash.update("missing");
    }
  }
  return hash.digest("hex");
}
async function build(env) {
  const infra = [
    ...(await fileList("src")),
    "schema.prisma",
    "prisma7.config.ts",
    "tsconfig.json",
    "tsconfig.build.json",
    "package.json",
    "package-lock.json",
  ];
  const backend = [
    ...(await fileList("backend/src")),
    "backend/tsconfig.json",
    "backend/tsconfig.build.json",
    "backend/package.json",
    "backend/package-lock.json",
  ];
  let saved = {};
  try {
    saved = JSON.parse(await readFile(at(".build/local-dev.json"), "utf8"));
  } catch {
    /* First run. */
  }
  const next = {
    infra: await fingerprint(infra),
    backend: await fingerprint(backend),
  };
  const outputs = [
    ...(await fileList("dist")),
    ...(await fileList("generated/prisma")),
    ...(await fileList("backend/dist")),
  ];
  const outputsIntact =
    outputs.length > 0 && saved.outputs === (await fingerprint(outputs));
  const infraDirty =
    saved.infra !== next.infra ||
    !outputsIntact ||
    !(await exists(at("dist/src/routes/safezone.routes.js"))) ||
    !(await exists(at("generated/prisma/client.ts"))) ||
    !(await exists(at("dist/generated/prisma/client.js")));
  const backendDirty =
    infraDirty ||
    saved.backend !== next.backend ||
    !(await exists(at("backend/dist/server.js")));
  if (infraDirty) {
    console.log(
      "[build] Generating Prisma and compiling shared infrastructure (no database changes).",
    );
    await run(
      "prisma",
      at("node_modules/prisma/build/index.js"),
      ["generate", "--config", "prisma7.config.ts"],
      { env },
    );
    await run(
      "shared",
      at("node_modules/typescript/bin/tsc"),
      ["-p", "tsconfig.build.json"],
      { env },
    );
  }
  if (backendDirty)
    await run(
      "backend-build",
      at("backend/node_modules/typescript/bin/tsc"),
      ["-p", "backend/tsconfig.build.json"],
      { env },
    );
  if (!infraDirty && !backendDirty)
    console.log(
      "[build] Backend and shared outputs are current; skipping rebuild.",
    );
  next.outputs = await fingerprint([
    ...(await fileList("dist")),
    ...(await fileList("generated/prisma")),
    ...(await fileList("backend/dist")),
  ]);
  await mkdir(at(".build"), { recursive: true });
  await writeFile(at(".build/local-dev.json"), JSON.stringify(next));
}
async function requirePort(port) {
  if (!(await portFree(port)))
    throw new Error(
      `Port ${port} is in use. Stop its service in the owning terminal, or inspect Windows: Get-NetTCPConnection -State Listen -LocalPort ${port}. No process was terminated. Configure matching PORT, FRONTEND_URL and VITE_API_BASE_URL if intentionally changing ports.`,
    );
}
async function waitReady(child, url, health) {
  const until = Date.now() + 45_000;
  while (!stopping && Date.now() < until) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw new Error(
        `Service exited before readiness: ${url}. Check its logs above.`,
      );
    if (await probe(url, health)) return;
    await sleep(250);
  }
  throw new Error(`Readiness timed out or startup stopped: ${url}`);
}
function monitor(child, label) {
  child.completion.then((code) => {
    if (!stopping && !child.expectedExit) {
      console.error(
        `[dev] ${label} exited unexpectedly (${code}); stopping companion services.`,
      );
      void cleanup(1);
    }
  });
}
async function backendStart(config, urls) {
  if (stopping) return;
  await requirePort(urls.port);
  const child = launch("backend", at("scripts/dev-service.mjs"), ["backend"], {
    cwd: at("backend"),
    env: config.env,
  });
  monitor(child, "backend");
  await waitReady(child, `${urls.backendUrl}/api/v1/health`, true);
  console.log(
    `[dev] Backend ready: ${urls.backendUrl}; Swagger: ${urls.backendUrl}/docs/`,
  );
  return child;
}
export function frontendEnvironment(config, urls) {
  // Pass only OS/runtime necessities and public Vite variables to the frontend child.
  const env = {};
  for (const [key, value] of Object.entries(process.env))
    if (
      /^(path|systemroot|windir|comspec|pathext|temp|tmp|home|userprofile|appdata|localappdata|programfiles|programfiles\(x86\)|systemdrive|lang|term|ci|no_color|force_color)$/i.test(
        key,
      )
    )
      env[key] = value;
  return {
    ...env,
    ...config.front,
    NODE_ENV: "development",
    SUNSHIELD_FRONT_HOST: urls.frontHost,
    SUNSHIELD_FRONT_PORT: String(urls.frontPort),
  };
}
async function frontendStart(config, urls) {
  await requirePort(urls.frontPort);
  const child = launch(
    "frontend",
    at("scripts/dev-service.mjs"),
    ["frontend"],
    { cwd: at("frontend"), env: frontendEnvironment(config, urls) },
  );
  monitor(child, "frontend");
  await waitReady(child, urls.frontUrl, false);
  console.log(`[dev] Frontend ready: ${urls.frontUrl}`);
  return child;
}
async function openBrowser(url) {
  if (process.env.SUNSHIELD_NO_OPEN === "true") {
    console.log("[dev] Browser opening skipped (SUNSHIELD_NO_OPEN=true).");
    return;
  }
  const executable =
    process.platform === "win32"
      ? "explorer.exe"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  await new Promise((resolve) => {
    const child = spawn(executable, [url], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.once("error", () => {
      console.warn(`[dev] Browser could not open. Open ${url} manually.`);
      resolve();
    });
    child.once("spawn", () => {
      child.unref();
      console.log(`[dev] Browser open requested: ${url}`);
      resolve();
    });
  });
}
async function doctor() {
  let failures = 0;
  const report = (kind, text) => {
    console.log(`${kind.padEnd(7)} ${text}`);
    if (kind === "FAIL") failures++;
  };
  try {
    nodeCheck();
    report("PASS", `Node ${process.versions.node}`);
  } catch (e) {
    report("FAIL", e.message);
  }
  try {
    await run("npm", await npmCli(), ["--version"]);
    report("PASS", "npm available");
  } catch {
    report("FAIL", "npm unavailable");
  }
  for (const file of dependencyFiles)
    report((await exists(at(file))) ? "PASS" : "FAIL", file);
  let config;
  let urls;
  try {
    config = await configuration();
    urls = validateConfiguration(config);
    report("PASS", "Environment, API base URL and exact CORS origin agree");
  } catch (e) {
    report("FAIL", e.message);
  }
  for (const file of [
    "generated/prisma/client.ts",
    "dist/generated/prisma/client.js",
    "dist/src/routes/safezone.routes.js",
    "backend/dist/server.js",
  ])
    report(
      (await exists(at(file))) ? "PASS" : "WARNING",
      `${file} (npm run dev builds missing artifacts)`,
    );
  for (const [port, url, health] of [
    [
      urls?.port ?? 8000,
      `${urls?.backendUrl ?? "http://localhost:8000"}/api/v1/health`,
      true,
    ],
    [urls?.frontPort ?? 5173, urls?.frontUrl ?? "http://localhost:5173", false],
  ]) {
    const free = await portFree(port);
    if (free) {
      let activeLauncher = false;
      try {
        const owner = Number(
          await readFile(
            at(`.build/local-${health ? "backend" : "frontend"}.lock`),
            "utf8",
          ),
        );
        if (Number.isSafeInteger(owner) && owner > 0) {
          process.kill(owner, 0);
          activeLauncher = true;
        }
      } catch {
        /* No live owned launcher. */
      }
      report(
        activeLauncher ? "WARNING" : "SKIPPED",
        activeLauncher
          ? `Port ${port} available but an owned launcher is active; service is starting, rebuilding or awaiting a source correction`
          : `Port ${port} available; service is stopped (expected before npm run dev)`,
      );
    } else {
      const healthy = await probe(url, health);
      report(
        healthy ? "PASS" : "FAIL",
        `Port ${port} occupied; ${health ? "SunShield health" : "frontend HTTP"} ${healthy ? "responds" : "unavailable or unexpected service"}`,
      );
    }
  }
  if (urls && (await probe(`${urls.backendUrl}/api/v1/health`, true))) {
    try {
      const response = await fetch(`${urls.backendUrl}/api/v1/health`, {
        headers: { Origin: urls.frontUrl },
        signal: AbortSignal.timeout(3000),
      });
      report(
        response.headers.get("access-control-allow-origin") === urls.frontUrl
          ? "PASS"
          : "FAIL",
        "Running backend exact CORS origin",
      );
    } catch {
      report("FAIL", "CORS probe failed");
    }
  } else report("SKIPPED", "Runtime CORS check: backend stopped");
  if (!config?.env.DATABASE_URL?.trim())
    report(
      "WARNING",
      "DATABASE_URL absent; Safe Zones unavailable; health, weather and HeatLab remain usable",
    );
  if (
    process.argv.includes("--database") &&
    config?.env.DATABASE_URL?.trim() &&
    (await exists(at("dist/src/config/database.js")))
  ) {
    try {
      await run("database", at("scripts/dev-service.mjs"), ["database"], {
        env: config.env,
      });
      report("PASS", "Optional database SELECT 1 (read-only)");
    } catch {
      report(
        "FAIL",
        "Database connection failed; check authorized configuration/network privately",
      );
    }
  } else
    report(
      "SKIPPED",
      "Optional database connectivity: npm run doctor -- --database (SELECT 1 only)",
    );
  process.exitCode = failures ? 1 : 0;
}
export async function main(command = process.argv[2]) {
  if (command === "doctor") return doctor();
  nodeCheck();
  if (command === "setup") {
    const npm = await npmCli();
    await run("npm", npm, ["--version"]);
    for (const folder of ["", "backend", "frontend"])
      await run(
        `install ${folder || "root"}`,
        npm,
        ["ci", "--no-audit", "--no-fund"],
        { cwd: at(folder) },
      );
    await dependencies();
    await createEnvironments();
    const config = await configuration();
    validateConfiguration(config);
    await build(config.env);
    console.log(
      "[setup] Complete. Dependencies installed from all three lockfiles; Prisma/shared/backend ready. No migrations, seeds or database writes. Next: npm run dev. Diagnostics: npm run doctor.",
    );
    return;
  }
  if (!["dev", "backend", "frontend"].includes(command))
    throw new Error(
      "Usage: node scripts/local-dev.mjs setup|dev|backend|frontend|doctor",
    );
  await npmCli();
  await dependencies();
  const config = await configuration();
  const urls = validateConfiguration(config, command);
  if (!config.env.DATABASE_URL?.trim())
    console.warn(
      "[dev] DATABASE_URL absent. Safe Zones will be unavailable; other features can run.",
    );
  if (command !== "frontend") await requirePort(urls.port);
  if (command !== "backend") await requirePort(urls.frontPort);
  // Resource locks prevent combined and independent launchers from building/starting concurrently.
  await mkdir(at(".build"), { recursive: true });
  const locks = [];
  async function acquire(name) {
    const lockPath = at(`.build/local-${name}.lock`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const handle = await open(lockPath, "wx");
        await handle.writeFile(String(process.pid));
        locks.push({ handle, lockPath });
        return;
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
        const owner = Number(await readFile(lockPath, "utf8").catch(() => ""));
        let alive = true;
        if (Number.isSafeInteger(owner) && owner > 0) {
          try {
            process.kill(owner, 0);
          } catch (error) {
            if (error.code === "ESRCH") alive = false;
          }
        }
        if (!alive && attempt === 0) {
          await unlink(lockPath).catch(() => {});
          continue;
        }
        throw new Error(
          `Another ${name} launcher may be active. If both services are stopped and its terminal is closed, remove ${path.relative(root, lockPath)} and retry.`,
        );
      }
    }
  }
  try {
    if (command !== "frontend") await acquire("backend");
    if (command !== "backend") await acquire("frontend");
  } catch (e) {
    for (const { handle, lockPath } of locks) {
      await handle.close();
      await unlink(lockPath).catch(() => {});
    }
    throw e;
  }
  const watchers = [];
  let timer;
  try {
    let backend;
    if (command !== "frontend") {
      await build(config.env);
      if (stopping) return;
      backend = await backendStart(config, urls);
    }
    if (command !== "backend") {
      if (stopping) return;
      await frontendStart(config, urls);
      if (!stopping) await openBrowser(urls.frontUrl);
    }
    if (stopping) return;
    if (command !== "frontend") {
      let dirty = false;
      let busy = false;
      const rebuild = async () => {
        dirty = true;
        if (busy || stopping) return;
        busy = true;
        try {
          while (dirty && !stopping) {
            dirty = false;
            console.log(
              "[watch] Change detected; stopping backend before rebuilding.",
            );
            await stop(backend);
            backend = undefined;
            try {
              await build(config.env);
              if (!stopping) backend = await backendStart(config, urls);
            } catch (e) {
              console.error(
                `[watch] ${e.message}\n[watch] Backend remains stopped. Fix the source and save to retry.`,
              );
            }
          }
        } finally {
          busy = false;
        }
      };
      const changed = () => {
        clearTimeout(timer);
        timer = setTimeout(() => void rebuild(), 350);
      };
      for (const folder of ["backend/src", "src"])
        watchers.push(watch(at(folder), { recursive: true }, changed));
      for (const file of [
        "schema.prisma",
        "prisma7.config.ts",
        "tsconfig.json",
        "tsconfig.build.json",
        "backend/tsconfig.json",
        "backend/tsconfig.build.json",
        "package.json",
        "package-lock.json",
        "backend/package.json",
        "backend/package-lock.json",
      ])
        watchers.push(watch(at(file), changed));
      console.log(
        "[watch] Watching backend/shared sources, Prisma schema and build configuration. Environment changes require a restart.",
      );
    }
    console.log(
      "[dev] Ready. Press Ctrl+C to stop all services owned by this launcher.",
    );
    while (!stopping) await sleep(200);
  } finally {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
    await cleanup(process.exitCode || 0);
    for (const { handle, lockPath } of locks) {
      await handle.close();
      await unlink(lockPath).catch(() => {});
    }
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
    .catch(async (e) => {
      console.error(`[SunShield] ${e.message}`);
      await cleanup(1);
    })
    .finally(() => {
      if (process.connected) process.disconnect();
    });
}

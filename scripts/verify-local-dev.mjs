import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile, unlink, access, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { portFree, probe, root } from "./local-dev.mjs";
import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
const results = [];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const at = (file) => path.join(root, file);
const active = new Set();
const hash = (data) => createHash("sha256").update(data).digest("hex");
async function wait(check, label, timeout = 60000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await check()) return;
    await delay(150);
  }
  throw new Error(`Timeout: ${label}`);
}
function start(mode = "dev", env = {}) {
  const child = spawn(process.execPath, [at("scripts/local-dev.mjs"), mode], {
    cwd: root,
    env: {
      ...process.env,
      SUNSHIELD_NO_OPEN: "true",
      COMMUNITY_WRITES_ENABLED: "false",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true,
  });
  child.log = "";
  child.stdout.on("data", (d) => {
    child.log += d;
  });
  child.stderr.on("data", (d) => {
    child.log += d;
  });
  child.done = new Promise((resolve) => {
    child.once("exit", (code) => {
      active.delete(child);
      resolve(code);
    });
  });
  active.add(child);
  return child;
}
async function stop(child) {
  if (child.exitCode !== null) return;
  child.send({ type: "shutdown" });
  await wait(() => child.exitCode !== null, "launcher shutdown", 20000);
}
async function check(name, fn) {
  await fn();
  results.push({ name, status: "PASS" });
  console.log(`PASS ${name}`);
}
async function ready(child) {
  await wait(() => child.log.includes("[dev] Ready."), "launcher readiness");
  assert.equal(child.exitCode, null, child.log);
}
const protectedFiles = [
  ".env",
  "backend/.env.development.local",
  "frontend/.env.development.local",
  "package-lock.json",
  "backend/package-lock.json",
  "frontend/package-lock.json",
];
const before = Object.fromEntries(
  await Promise.all(
    protectedFiles.map(async (file) => [file, hash(await readFile(at(file)))]),
  ),
);
const backendProbe = "backend/src/__local_startup_verification.ts";
const sharedProbe = "src/__local_startup_verification.ts";
for (const file of [backendProbe, sharedProbe]) {
  try {
    await access(at(file));
    throw new Error(`Refusing to overwrite existing ${file}`);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
const cssFile = "frontend/src/styles/app.css";
const css = await readFile(at(cssFile));
const viteFile = "frontend/vite.config.ts";
const vite = await readFile(at(viteFile));
const routesFile = "backend/src/routes/index.ts";
const routes = await readFile(at(routesFile));
let browser;
try {
  assert.equal(
    await portFree(8000),
    true,
    "Stop existing backend before running verification",
  );
  assert.equal(
    await portFree(5173),
    true,
    "Stop existing frontend before running verification",
  );
  const app = start();
  await check("combined startup and health readiness", async () => {
    await ready(app);
    assert.equal(
      await probe("http://localhost:8000/api/v1/health", true),
      true,
    );
    assert.equal(await probe("http://localhost:5173"), true);
  });
  await check(
    "duplicate launcher rejects occupied port without stopping application",
    async () => {
      const duplicate = start();
      assert.equal(await duplicate.done, 1);
      assert.match(duplicate.log, /Port 8000 is in use/);
      assert.equal(
        await probe("http://localhost:8000/api/v1/health", true),
        true,
      );
    },
  );
  await check(
    "runtime CORS mismatch reproduction and correct exact origin",
    async () => {
      for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
        const response = await fetch("http://localhost:8000/api/v1/health", {
          headers: { Origin: origin },
        });
        assert.equal(
          response.headers.get("access-control-allow-origin"),
          "http://localhost:5173",
        );
        assert.equal(
          response.headers.get("access-control-allow-origin") === origin,
          origin.includes("localhost"),
        );
      }
    },
  );
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const replies = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/v1/"))
      replies.push({ url: new URL(r.url()).pathname, status: r.status() });
  });
  await check(
    "actual browser onboarding, personalized dashboard and planner without mocks",
    async () => {
      await page.goto("http://localhost:5173/onboarding");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByLabel("Supported city center", { exact: true })
        .selectOption("Pune");
      await page
        .getByRole("button", { name: "Save profile", exact: true })
        .click();
      await page.waitForURL("**/worker/dashboard");
      await wait(
        () =>
          replies.some(
            (r) => r.url.endsWith("/heat/assess") && r.status === 200,
          ),
        "live assessment",
      );
      await page.goto("http://localhost:5173/worker/plan");
      await wait(
        () =>
          replies.some(
            (r) => r.url.endsWith("/protection/plan") && r.status === 200,
          ),
        "live planner",
      );
    },
  );
  await check(
    "actual browser HeatLab and SOS without placing a call",
    async () => {
      await page.goto("http://localhost:5173/heatlab");
      await page
        .getByRole("button", { name: "Evaluate both scenarios", exact: true })
        .click();
      await page.getByText("CRITICAL", { exact: true }).first().waitFor();
      await page.getByText("HIGH", { exact: true }).first().waitFor();
      await page.goto("http://localhost:5173/sos");
      await page.locator('a[href="tel:112"]').waitFor({ state: "visible" });
      assert.deepEqual(errors, []);
    },
  );
  await check(
    "frontend CSS hot replacement reaches the open browser",
    async () => {
      await writeFile(
        at(cssFile),
        Buffer.concat([
          css,
          Buffer.from("\n:root { --sunshield-startup-hmr: verified; }\n"),
        ]),
      );
      await wait(
        async () =>
          (
            await page.evaluate(() =>
              getComputedStyle(document.documentElement).getPropertyValue(
                "--sunshield-startup-hmr",
              ),
            )
          ).trim() === "verified",
        "CSS HMR",
      );
      await writeFile(at(cssFile), css);
    },
  );
  await check(
    "backend reload, compilation failure stays stopped, and save recovers",
    async () => {
      let offset = app.log.length;
      await writeFile(
        at(backendProbe),
        "export const startupVerification = true;\n",
        { flag: "wx" },
      );
      await wait(
        () => app.log.slice(offset).includes("Backend ready:"),
        "backend reload",
      );
      offset = app.log.length;
      await writeFile(
        at(backendProbe),
        "export const startupVerification: string = 42;\n",
      );
      await wait(
        () => app.log.slice(offset).includes("Backend remains stopped"),
        "compiler error",
      );
      assert.equal(
        await probe("http://localhost:8000/api/v1/health", true),
        false,
      );
      assert.equal(await probe("http://localhost:5173"), true);
      assert.match(app.log.slice(offset), /TS2322/);
      offset = app.log.length;
      await unlink(at(backendProbe));
      await wait(
        () => app.log.slice(offset).includes("Backend ready:"),
        "backend recovery",
      );
    },
  );
  await check(
    "shared infrastructure rebuild and backend restart without overlapping builds",
    async () => {
      let offset = app.log.length;
      await writeFile(
        at(sharedProbe),
        "export const startupVerification = true;\n",
        { flag: "wx" },
      );
      await wait(
        () => app.log.slice(offset).includes("Backend ready:"),
        "shared rebuild",
      );
      assert.match(
        app.log.slice(offset),
        /Generating Prisma and compiling shared infrastructure/,
      );
      offset = app.log.length;
      await unlink(at(sharedProbe));
      await wait(
        () => app.log.slice(offset).includes("Backend ready:"),
        "shared restore",
      );
      assert.equal(
        await probe("http://localhost:8000/api/v1/health", true),
        true,
      );
    },
  );
  await check(
    "graceful launcher shutdown releases both service ports",
    async () => {
      await stop(app);
      assert.equal(app.exitCode, 0);
      await wait(
        async () => (await portFree(8000)) && (await portFree(5173)),
        "released ports",
      );
    },
  );
  await check(
    "restart uses current builds and independent services stop independently",
    async () => {
      const backend = start("backend");
      await ready(backend);
      assert.match(backend.log, /skipping rebuild/);
      const frontend = start("frontend");
      await ready(frontend);
      await stop(frontend);
      assert.equal(
        await probe("http://localhost:8000/api/v1/health", true),
        true,
      );
      await stop(backend);
      assert.equal(await portFree(8000), true);
      assert.equal(await portFree(5173), true);
    },
  );
  await check(
    "invalid configuration fails without leaking its value or starting services",
    async () => {
      const child = start("dev", { DATABASE_URL: "private-canary-invalid" });
      assert.equal(await child.done, 1);
      assert.match(child.log, /DATABASE_URL/);
      assert.doesNotMatch(child.log, /private-canary/);
      assert.equal(await portFree(8000), true);
      assert.equal(await portFree(5173), true);
    },
  );
  await check(
    "missing database configuration still permits non-database application startup",
    async () => {
      const child = start("dev", { DATABASE_URL: "", DIRECT_URL: "" });
      await ready(child);
      assert.match(child.log, /DATABASE_URL absent/);
      const response = await fetch(
        "http://localhost:8000/api/v1/safe-zones?latitude=18.5204&longitude=73.8567&radiusKm=5",
      );
      assert.equal(response.status, 503);
      assert.equal(
        await probe("http://localhost:8000/api/v1/health", true),
        true,
      );
      await stop(child);
    },
  );
  await check(
    "backend compilation startup failure leaves no frontend or orphan service",
    async () => {
      await writeFile(
        at(backendProbe),
        "export const startupVerification: string = 42;\n",
        { flag: "wx" },
      );
      const child = start();
      assert.equal(await child.done, 1);
      assert.match(child.log, /TS2322/);
      assert.equal(await portFree(8000), true);
      assert.equal(await portFree(5173), true);
      await unlink(at(backendProbe));
    },
  );
  await check(
    "frontend startup failure stops its already-ready backend",
    async () => {
      await writeFile(
        at(viteFile),
        Buffer.concat([
          vite,
          Buffer.from(
            '\nthrow new Error("Intentional local startup verification failure");\n',
          ),
        ]),
      );
      const child = start();
      assert.equal(await child.done, 1);
      assert.match(child.log, /Backend ready:/);
      assert.match(child.log, /Intentional local startup verification failure/);
      await wait(
        async () => (await portFree(8000)) && (await portFree(5173)),
        "failure cleanup",
      );
      await writeFile(at(viteFile), vite);
    },
  );
  await check(
    "backend health readiness timeout cleans up without starting frontend",
    async () => {
      const changed = routes
        .toString("utf8")
        .replace("status: 'UP'", "status: 'STARTING'");
      assert.notEqual(changed, routes.toString("utf8"));
      await writeFile(at(routesFile), changed);
      const child = start();
      assert.equal(await child.done, 1);
      assert.match(child.log, /Readiness timed out/);
      assert.doesNotMatch(child.log, /Frontend ready:/);
      await wait(
        async () => (await portFree(8000)) && (await portFree(5173)),
        "timeout cleanup",
      );
      await writeFile(at(routesFile), routes);
    },
  );
} catch (error) {
  results.push({ name: error.message, status: "FAIL" });
  console.error(error);
  process.exitCode = 1;
} finally {
  for (const child of active)
    await stop(child).catch(() => {
      child.kill();
    });
  if (browser) await browser.close();
  await writeFile(at(cssFile), css);
  await writeFile(at(viteFile), vite);
  await writeFile(at(routesFile), routes);
  for (const file of [backendProbe, sharedProbe])
    await unlink(at(file)).catch(() => {});
  for (const file of [
    "backend/dist/__local_startup_verification.js",
    "dist/src/__local_startup_verification.js",
    "dist/src/__local_startup_verification.d.ts",
  ])
    await unlink(at(file)).catch(() => {});
  const after = Object.fromEntries(
    await Promise.all(
      protectedFiles.map(async (file) => [
        file,
        hash(await readFile(at(file))),
      ]),
    ),
  );
  try {
    assert.deepEqual(after, before);
    results.push({
      name: "all environment files and dependency lockfiles preserved byte for byte",
      status: "PASS",
    });
  } catch {
    results.push({ name: "protected files changed", status: "FAIL" });
    process.exitCode = 1;
  }
  await mkdir(at("docs/local-development-evidence"), { recursive: true });
  await writeFile(
    at("docs/local-development-evidence/integration.json"),
    JSON.stringify(
      { at: new Date().toISOString(), node: process.version, results },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
}

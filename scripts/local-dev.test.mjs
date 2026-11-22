import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import {
  backendDefaults,
  mergeBackendEnvironment,
  validateConfiguration,
  portFree,
  probe,
  frontendEnvironment,
} from "./local-dev.mjs";
const valid = () => ({
  env: { ...backendDefaults },
  front: {
    VITE_API_BASE_URL: "http://localhost:8000/api/v1",
    VITE_USE_MOCKS: "false",
  },
});
test("environment precedence preserves shell, backend and shared credentials above local defaults", () => {
  const env = mergeBackendEnvironment(
    { PORT: "8000", DATABASE_URL: "local" },
    { PORT: "8001", DATABASE_URL: "shared" },
    { PORT: "8002" },
    { PORT: "8003" },
  );
  assert.equal(env.PORT, "8003");
  assert.equal(env.DATABASE_URL, "shared");
  assert.equal(
    mergeBackendEnvironment({}, {}, {}, {}).COMMUNITY_WRITES_ENABLED,
    "false",
  );
});
test("valid local defaults agree on exact CORS/API origins", () => {
  assert.deepEqual(validateConfiguration(valid()), {
    port: 8000,
    frontPort: 5173,
    frontHost: "localhost",
    frontUrl: "http://localhost:5173",
    backendUrl: "http://localhost:8000",
  });
});
test("matching custom ports work and split services allow a remote API", () => {
  const value = valid();
  value.env.PORT = "8100";
  value.env.FRONTEND_URL = "http://127.0.0.1:5200";
  value.front.VITE_API_BASE_URL = "http://localhost:8100/api/v1";
  assert.equal(validateConfiguration(value).frontPort, 5200);
  value.front.VITE_API_BASE_URL = "https://approved.example/api/v1";
  assert.doesNotThrow(() => validateConfiguration(value, "frontend"));
});
test("mismatched API/localhost configuration fails instead of silently enabling CORS or mocks", () => {
  for (const api of [
    "http://127.0.0.1:8000/api/v1",
    "http://localhost:8001/api/v1",
    "http://localhost:8000/api",
  ]) {
    const value = valid();
    value.front.VITE_API_BASE_URL = api;
    assert.throws(() => validateConfiguration(value));
  }
});
test("invalid configuration reports names without credential values", () => {
  const value = valid();
  value.env.DATABASE_URL = "secret-canary-invalid-database-string";
  assert.throws(
    () => validateConfiguration(value),
    (error) =>
      error.message.includes("DATABASE_URL") &&
      !error.message.includes("secret-canary"),
  );
});
test("local commands cannot enable community writes, mocks or production watchers", () => {
  for (const [scope, key, val] of [
    ["env", "NODE_ENV", "production"],
    ["env", "COMMUNITY_WRITES_ENABLED", "true"],
    ["front", "VITE_USE_MOCKS", "true"],
    ["env", "PORT", "0"],
    ["env", "WEATHER_CACHE_TTL_SECONDS", "0"],
  ]) {
    const value = valid();
    value[scope][key] = val;
    assert.throws(() => validateConfiguration(value));
  }
});
test("port conflict detection preserves the process holding the port", async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    assert.equal(await portFree(port), false);
    assert.equal(server.listening, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  assert.equal(await portFree(port), true);
});
test("health readiness requires SunShield identity and UP status", async () => {
  const { createServer } = await import("node:http");
  let body = { status: "UP", application: "unrelated" };
  const server = createServer((_req, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await probe(url, true), false);
    body = { status: "UP", application: "SunShield" };
    assert.equal(await probe(url, true), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("an origin with a trailing slash is refused before it creates a CORS failure", () => {
  const value = valid();
  value.env.FRONTEND_URL += "/";
  assert.throws(() => validateConfiguration(value), /exact origin/);
});
test("database settings are optional and are never forwarded to the frontend worker", () => {
  const value = valid();
  assert.doesNotThrow(() => validateConfiguration(value));
  value.env.DATABASE_URL = "private-database-canary";
  value.env.DIRECT_URL = "private-direct-canary";
  const child = frontendEnvironment(value, validateConfiguration(valid()));
  assert.equal(child.DATABASE_URL, undefined);
  assert.equal(child.DIRECT_URL, undefined);
  assert.equal(child.VITE_USE_MOCKS, "false");
  assert.doesNotMatch(
    JSON.stringify(child),
    /private-database-canary|private-direct-canary/,
  );
});

# SunShield Independent Release QA Report

**Review date:** 21 November 2026 (IST)
**Repository:** Madhav-87/sunshield-hackathon
**Tested branch/commit:** `integration/final-release` at `db93a5f799b702e1c0adeb9fda8011815ccd19de`
**QA branch:** `feature/release-qa`, created from that exact commit
**Runtime:** Node `v24.22.3` (portable archive SHA-256 verified), npm `11.19.1`

The initial report is preserved as [historical evidence from the obsolete checkout](RELEASE_QA_REPORT_HISTORICAL.md). It is not an assessment of this integration commit. This follow-up branch contains only release QA documentation and the independent smoke script; no production code changed.

## Repository synchronization

A clean sibling clone was fetched from `origin/integration/final-release`. The latest remote commit was `db93a5f799b702e1c0adeb9fda8011815ccd19de`, one commit newer than the previously shared `c153b9e7174c6e27e99057f33ac762aafb7ebf41`. The frontend rewrite baseline in its history is `2c9f8a323d128ade0820725e687d1e0a0fd5c8ef`. The fetched remote branch list had no `origin/feature/release-qa`; the local QA branch was created from the current integration commit. The original workspace and verified backup copies of the six previous QA files were preserved.

The expected `backend/`, `frontend/`, API contract, integration handoff, HeatLab demo, security/test reports, feature parity, integration status, and final release report are present. The one Express app is `backend/src/app.ts`, started by `backend/src/server.ts`; `frontend/` contains native React. The repository-root Safe Zones package is not a second API server.

## Independent verification results

All commands below ran in the clean clone under Node 24, except where an individual package's test root is explicitly scoped.

| Check | Result |
|---|---|
| Backend `npm ci` | Passed, 293 packages; npm reported 3 high advisories in its dependency tree |
| Backend `npm run typecheck` | Passed |
| Backend `npm test` | Passed: 64 tests across 4 files |
| Backend `npm run build` | Passed |
| Frontend `npm ci` | Passed, 390 packages; 0 vulnerabilities reported |
| Frontend `npm run typecheck` | Passed |
| Frontend `npm run lint` | Passed |
| Frontend `npm test` | Passed: 46 tests across 3 files |
| Frontend `npm run build` | Passed; Vite reports a 503 kB main chunk and third-party Zod annotation warnings |
| Root Safe Zones tests, `npm.cmd test -- --root tests` | Passed: 9 tests across 2 files; services are mocked, no database used |
| Full frontend Playwright Chromium suite | Passed: 28 cases, including 10 viewport widths (320–1920 px) |
| Updated `scripts/api-smoke.mjs` against local compiled backend | 5 PASS; 3 BLOCKED; 2 NOT IMPLEMENTED; 0 unexpected FAIL |

`npm ci` warned that some dependency lifecycle scripts were not allowlisted by npm 11. The requested checks still completed successfully; no package scripts were approved globally and no lockfile was changed.

## Actual API and HeatLab observations

The backend was started locally in production mode with `PORT=8000` and `FRONTEND_URL=http://localhost:5173`, without database credentials. The smoke suite used actual HTTP requests and compiled backend Zod schemas:

| Endpoint/check | Observed result | Classification |
|---|---|---|
| `GET /api/v1/health` | HTTP 200; expected health body and `X-Request-Id` | PASS |
| Heavy construction `POST /simulation/evaluate` | HTTP 200; SIMULATION, CRITICAL, `STOP_UNSAFE_ACTIVITY` priority CRITICAL | PASS |
| Light vendor `POST /simulation/evaluate` | HTTP 200; SIMULATION, HIGH, `REDUCE_STRENUOUS_ACTIVITY` priority HIGH | PASS |
| Identical environmental indicators | Both requests: 35 °C / 50% / 5 km/h, heat index 40.68 °C, environmental HIGH | PASS |
| Invalid simulation `{profile:{}}` | HTTP 422 `VALIDATION_ERROR`; body request ID matched response header | PASS |
| `GET /weather` | HTTP 404 `NOT_FOUND` | NOT IMPLEMENTED |
| `POST /heat/assess` | HTTP 503 `WEATHER_PROVIDER_UNAVAILABLE` | BLOCKED pending real provider |
| `POST /protection/plan` | HTTP 503 `WEATHER_PROVIDER_UNAVAILABLE` | BLOCKED pending real provider |
| `GET /safe-zones` | HTTP 404 `NOT_FOUND`; route unmounted | NOT IMPLEMENTED |

The browser suite confirmed actual requests/responses are rendered in HeatLab, scenario state/reset do not alter saved worker preferences, critical wording is available in English/Hindi/Marathi, and limitations remain visible. These are simulated conditions, not medical clearance or permission to work. No external weather request or database write was made.

## Historical XSS finding recheck

The historical unsafe frontend issue is **resolved for this tested commit**. Searches of `frontend/src`, unit tests, and E2E sources found no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `legacyMarkup`, `legacyState`, or `ContractUnavailableError` path in production frontend code. Chromium tests explicitly verified malicious facility names, addresses, and report comments remain inert text. The old root frontend finding must not be copied forward as a current defect.

## Dependency audit finding

The root Safe Zones package audit reports **2 critical, 3 high, and 1 moderate** advisories. The critical findings are in root test tooling (Vitest 3.2.7 and transitive `tinypool`); the high findings trace through Prisma / `@prisma/config` / `effect`. The `--omit=dev` audit still reports three Prisma-related high advisories. npm's suggested automatic fixes require major-version changes (Vitest 5.1.1 and Prisma 6.12.0); no `npm audit fix` was run. Treat this as a security release gate until dependency ownership and an approved upgrade path are reviewed. Backend npm install also reported three high findings; frontend reported none.

## Test package-boundary finding

Running plain root `npm test` discovers nested frontend tests and fails 22 cases because they run without the frontend's jsdom/setup/API mocks (97 pass). Running the root package's intended infrastructure tests with `--root tests` passes all 9. The frontend package independently passes its 46 tests. Root has no lint script; the previously reported unused `_availabilityStatus` variable is outside the frontend lint package, whose lint passes. CI should keep these package test roots separate.

## Deployment and release status

`frontend/vercel.json` exists and includes `frontend`-root build/output configuration, SPA rewrite, security headers and CSP. `connect-src` currently allows all HTTPS hosts; narrow it to the approved production API in coordination with Developer A. `frontend/.env.production.example` contains a placeholder host, not a verified deployment URL. Backend environment names/defaults come from `backend/src/config/env.ts`: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `DATABASE_URL`, `OPEN_METEO_BASE_URL`, and `WEATHER_CACHE_TTL_SECONDS`. `VITE_API_BASE_URL` and `VITE_USE_MOCKS` are the supported frontend settings; mocks are used only when explicitly set to `true`.

No hosting account access, production URL, billing approval, deployment, live weather integration, database connection, or public CORS/CSP behavior was verified. The local engine/HeatLab demo is ready; full live-weather/Safe-Zones MVP and public deployment are **not ready**. See [current limitations](KNOWN_LIMITATIONS.md), [deployment guide](DEPLOYMENT_GUIDE.md), and [checklist](RELEASE_CHECKLIST.md).

## Immediate handoff

The requested update to Developer A could not be posted: GitHub CLI is not installed and no GitHub issue-comment connector is available in this session. No external message or branch push was made. The authoritative status for that handoff is this report and the smoke-test output above.

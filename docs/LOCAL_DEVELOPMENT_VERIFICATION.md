# Local development implementation and verification

Date: 22 November 2026, IST. Repository: D:\codestorm, original sunshield-hackathon development repository. Branch: **chore/local-development-startup**, based on develop at ef01c7530bf78948e68094436128330b7f3e7912. Runtime: Node.js 24.13.0, npm 11.4.1. No commit, push, submission-branch modification or public deployment was performed.

## 1. Connection issue findings

At initial runtime inspection, both http://localhost:8000/api/v1/health and frontend addresses on localhost/127.0.0.1:5173 were unreachable. A frontend cannot obtain API responses while the backend is stopped. Startup previously required separate manual actions without readiness coordination.

There was also a confirmed origin mismatch: Vite defaulted to 127.0.0.1, while backend CORS allowed http://localhost:5173. An actual running-backend probe using Origin http://127.0.0.1:5173 received Access-Control-Allow-Origin http://localhost:5173. Those origins differ, so a browser rejects access. The same check with the localhost origin matched. Vite's default host is now localhost; the combined launcher validates exact CORS/API agreement and waits for backend health before frontend startup.

No original browser network trace was available for the historical error, so it cannot be attributed uniquely to one past event. The two failure paths above were actually observed/reproduced. The existing generic error also covers provider/storage outages; it is not evidence that every such error is CORS.

During later verification, live Safe Zone reads returned sanitized 503 SAFE_ZONES_UNAVAILABLE responses at approximately five seconds, even though SELECT 1 and standalone facility reads succeeded. Earlier full API smoke checks passed all 11 cases, including default discovery, explicit DEMO discovery and a detail lookup. A later run passed eight checks, failed the strict DEMO discovery expectation and marked two dependent checks blocked. This database-query availability problem remains visible; no timeout, storage logic, credentials or security controls were changed to conceal it. The measured connection/query latency suggests a database/network timing issue, but a unique infrastructure root cause was not established.

## 2. Implementation summary

Added a development-only Node orchestrator using built-in modules and already-installed Vite. No new dependency or lockfile change. Setup installs pinned dependencies, creates only missing local configuration, generates Prisma and builds shared/backend outputs. Daily launch validates prerequisites/configuration, detects occupied ports, builds only changed/missing artifacts, starts Express, waits for SunShield UP health, starts Vite, waits for frontend readiness and requests the default browser.

The existing root build/start scripts, backend package scripts, Express application, React application, database schema, CORS middleware and deployment configuration are preserved. The only frontend configuration change is the localhost development host.

## 3. Complete file list for this task

| File                                               | Change                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| package.json                                       | Add setup, dev, dev:backend, dev:frontend, doctor and test:local-dev; retain all existing scripts/dependencies |
| README.md                                          | Insert prominent Quick Start; preserve previously existing uncommitted content                                 |
| frontend/vite.config.ts                            | Change default development host from 127.0.0.1 to localhost                                                    |
| scripts/local-dev.mjs                              | New setup, validation, diagnostics, build cache, readiness, service supervision, watches and cleanup           |
| scripts/dev-service.mjs                            | New development-only backend/Vite IPC workers and bounded optional read-only database probe                    |
| scripts/local-dev.test.mjs                         | New focused automated tests                                                                                    |
| scripts/verify-local-dev.mjs                       | New opt-in integration verifier with temporary probes and restoration                                          |
| Setup-SunShield.bat                                | New setup launcher                                                                                             |
| Start-SunShield.bat                                | New application launcher                                                                                       |
| docs/LOCAL_DEVELOPMENT_SETUP.md                    | New complete developer guide                                                                                   |
| docs/LOCAL_DEVELOPMENT_VERIFICATION.md             | This implementation/verification report                                                                        |
| docs/local-development-evidence/integration.json   | Actual integration results                                                                                     |
| docs/local-development-evidence/compatibility.json | Supplemental manual frontend/Fast Refresh and generation results                                               |
| docs/local-development-evidence/api-smoke.txt      | Later actual smoke output, including database failures                                                         |
| docs/local-development-evidence/doctor-running.txt | Actual running-service diagnostics and SELECT 1                                                                |
| docs/local-development-evidence/browser-suite.json | Existing Chromium suite results and unfinished external-request summaries                                      |
| docs/local-development-evidence/checks.json        | Command/result summary, including failed and blocked verification                                              |

Ignored local files created: backend/.env.development.local and frontend/.env.development.local. Ignored generated/cache outputs: generated/, dist/, backend/dist/, .build/ and existing frontend/test build directories. These are not source deliverables. Existing root .env was preserved. Source probes and temporary CSS, TSX, Vite and backend health-route changes were restored; they are not product changes.

Pre-existing modified release/handoff/status/evidence documents, untracked release documents, post-hackathon audit and scripts/api-smoke.mjs were preserved and are not claimed as this task's new work. All three dependency lockfiles are unchanged.

## 4. Root npm commands

| Command                      | Purpose                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| npm run setup                | Clean install from existing three lockfiles; safe local configuration and required builds |
| npm run dev                  | Complete local app, readiness, reloads and browser request                                |
| npm run dev:backend          | Independent backend with shared/backend rebuilds                                          |
| npm run dev:frontend         | Independent Vite frontend                                                                 |
| npm run doctor               | Configuration/dependency/port/health/CORS diagnostics                                     |
| npm run doctor -- --database | Also perform authorized SELECT 1 only                                                     |
| npm run build                | Existing production backend/shared build, unchanged                                       |
| npm start                    | Existing production backend startup, unchanged                                            |
| npm run test:local-dev       | New focused launcher tests                                                                |

Existing typecheck, db:validate, db:generate, db:migrate, db:seed, test and build:infrastructure commands remain. The new setup/dev/doctor scripts never invoke migration or seed commands.

## 5. Environment strategy

Backend precedence is process overrides, backend/.env, root/.env, development-only local file, defaults. Existing environment files are not overwritten. Frontend uses Vite's development-mode loader with process overrides; its new file is mode-specific and is excluded from production mode. Validation rejects malformed URLs, mismatched combined-launcher API/CORS targets, production watcher mode, enabled mocks and enabled community writes. Error messages identify variable names without credential values.

Only public VITE variables and selected OS/runtime values go to the frontend child. Database values remain backend-only. Generated-client setup succeeds with DIRECT_URL blank; missing database configuration does not block health or other independent features. Git ignore checks confirmed all local secret files are ignored. Integration hashes confirmed environment and lockfiles stayed byte-identical.

## 6. Startup architecture

Direct Node children avoid nested shell/npm processes during service runtime. Backend starts from the existing compiled entrypoint using cwd backend; Vite starts through its existing createServer API/configuration using cwd frontend. Resource locks guard overlapping combined/independent launchers. Dead-PID locks are reclaimed, uncertain live owners refused. Port probes check both loopback families plus wildcard bindings, including Windows overlapping-bind behavior. Ports never change silently and unrelated processes are never killed.

Health checks require both status UP and application SunShield. Readiness timeouts are 45 seconds. Child failures and timeouts stop owned companion services. Development-only IPC and parent-disconnect handling invoke existing backend graceful shutdown and Vite.close; force-stop fallback is bounded and targets only the owned child PID. Production startup never imports these wrappers.

## 7. Reload behavior

Existing Vite HMR is retained. Actual CSS HMR and React/TypeScript Fast Refresh were observed in Chromium; the latter changed visible TSX content without replacing the document. Temporary changes were restored.

Backend/shared source changes use debounced, serialized rebuilds. Backend stops before compilation. Root infrastructure/schema/config changes trigger Prisma generation/shared compilation. Generated output is not watched, preventing loops. Source/config hashes and output fingerprints skip unchanged builds. Compiler errors remain visible, leave backend stopped and recover after a corrected save. Those behaviors and shared rebuilds were actually exercised.

## 8. Windows launchers

Both batch files use cd /d "%~dp0" and npm.cmd. Setup preserves the exit code and pauses on error. Start retains visible logs and supports Ctrl+C. Both were executed successfully through cmd from C:\Users\varad rather than the repository directory. Start reached both readiness checks and requested browser opening. Physical double-click/desktop-window interaction was not visually verified because the desktop automation kernel failed to initialize.

## 9. Manual and production compatibility

The old backend npm run build / npm start and direct frontend Vite commands remain unchanged and do not depend on orchestration. Root npm run build and frontend production build passed. Direct frontend startup from frontend/, HTTP readiness and Fast Refresh passed. Independent new backend/frontend commands passed, including stopping frontend while backend stayed healthy.

Automatic approval review rejected the separate manual backend npm start verification with reason **blocked by policy**. It was not bypassed. The complete original manual two-terminal runtime scenario and NODE_ENV=production backend startup therefore remain unverified for this run. Existing Chromium tests start the compiled backend in test mode; that is not claimed as production startup verification. No production watchers/browser opening were introduced into build/start.

## 10. Actual scenario verification

| Requested scenario                            | Actual result                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Clean dependency installation                 | PASS: all three npm ci operations executed with existing lockfiles                                                          |
| First setup                                   | PASS: generated Prisma and compiled both module trees; created missing local files                                          |
| Repeated setup                                | PASS: preserved local configuration and skipped unchanged artifacts                                                         |
| Complete npm run dev startup                  | PASS: both services ready; actual logs observed                                                                             |
| Backend health                                | PASS: actual UP/SunShield response                                                                                          |
| Frontend readiness                            | PASS: actual HTTP response and Chromium rendering                                                                           |
| Automatic browser opening                     | PARTIAL: OS open request dispatched after readiness; default-browser window not visually confirmed                          |
| Live weather                                  | PASS: actual LIVE and CACHED responses; no simulated fallback                                                               |
| Worker onboarding                             | PASS: actual browser flow and saved profile                                                                                 |
| Personalized assessment                       | PASS: actual browser/API response                                                                                           |
| Adaptive Protection Planner                   | PASS: actual browser/API response                                                                                           |
| HeatLab                                       | PASS: actual engine CRITICAL/HIGH results                                                                                   |
| Safe Zone read-only integration               | MIXED: earlier full smoke/direct read tests passed; later live API query timeouts/503s remain recorded                      |
| SOS                                           | PASS: actual visible tel:112 link; no call placed                                                                           |
| Frontend hot reload                           | PASS: CSS HMR and TSX Fast Refresh without document reload                                                                  |
| Backend hot reload                            | PASS: source-triggered rebuild/restart                                                                                      |
| Shared rebuild                                | PASS: regeneration/compile and restart; serialized                                                                          |
| Ctrl+C cleanup                                | PASS: application/direct-frontend/batch sessions stopped and service ports released; graceful IPC cleanup separately passed |
| Application restart                           | PASS: current-output cache skipped rebuild and restart succeeded                                                            |
| Port conflict                                 | PASS: occupied-port refusal; original owner remained healthy                                                                |
| Missing/invalid configuration                 | PASS: absent database permitted startup; invalid credential canary rejected without printing it                             |
| Backend startup failure                       | PASS: compiler failure exited nonzero; no companion service remained                                                        |
| Frontend startup failure                      | PASS: deliberate Vite config failure stopped already-ready backend                                                          |
| Startup timeout                               | PASS: backend health deliberately not UP; timed out, no frontend started, ports released                                    |
| Independent backend                           | PASS: readiness/restart and independent lifetime                                                                            |
| Independent frontend                          | PASS: new command and original direct Vite command                                                                          |
| Original complete manual two-terminal runtime | BLOCKED: manual backend npm start rejected by approval policy                                                               |
| Windows batch launchers                       | PASS via cmd from another directory; physical double-click UI unverified                                                    |
| Existing production build                     | PASS: root/backend/shared and frontend build                                                                                |
| Existing production backend startup           | UNVERIFIED: separate manual-start verification blocked; no bypass                                                           |
| Applicable regressions                        | See exact results below                                                                                                     |

The opt-in [integration evidence](local-development-evidence/integration.json) contains 16 passed checks. Repeated runs are not additional test cases. [API smoke](local-development-evidence/api-smoke.txt) preserves the later failures; [running doctor](local-development-evidence/doctor-running.txt) confirms exact CORS, both running services and SELECT 1. A passing SELECT 1 does not establish facility-query readiness.

## 11. Regression results

- New local-development tests: **10 passed**.
- Existing backend: **85 passed**.
- Existing frontend: **46 passed**.
- Root: **22 unit/mocked checks and one actual read-only database check passed** on the explicit `--testTimeout=20000` run. Two earlier default-budget runs timed out in the database case at 5000ms; no source/test timeout setting was changed. The successful case completed in approximately two seconds.
- Root/backend/frontend TypeScript and frontend ESLint passed.
- Root consolidated production build and frontend production build passed. Existing frontend bundle-size and third-party annotation warnings remain.
- Existing Chromium full suite: **36 passed, 3 timed out**. Responsive cases at 320px/360px waited for load on Safe Zones; the 375px case waited for load on onboarding. Trace inspection found unfinished external OpenStreetMap tile and/or Google font requests. The failures were navigation timeouts, not reported overflow assertions. Other responsive widths passed. A focused retry of those three cases is recorded separately below; the initial full-suite result is retained. Existing suite includes controlled fixture cases as well as actual engine cases; the new browser integration above used actual APIs without mock mode.
- Focused unchanged-test retry: **3 passed**, covering exactly the three previously timed-out responsive cases. All 39 existing cases therefore passed across the full run plus targeted retry; this was not a single clean 39-case run. No test, timeout configuration or application functionality was changed to obtain the retry result.
- Prisma generation with blank DIRECT_URL passed; no migration/seed/data write.

## 12. Limits and unresolved blockers

Local service startup/reload management is implemented and exercised. Remote database query availability remains variable, separately from startup and liveness. No database timeout/credential/privilege remediation was undertaken. Default-budget database-test timing failures and Chromium external-resource navigation timeouts remain disclosed. Manual/production backend startup verification was blocked by automatic approval review. Default-browser window and physical double-click interaction could not be visually confirmed because desktop automation initialization failed (missing kernel.js). Cross-platform Node paths are implemented, but macOS/Linux execution was not tested on this Windows host.

Pre-existing dependency advisories, occupational/language review, pilot readiness, authentication, moderation, real-facility verification and public deployment remain outside this change. Community writes remained false and no application data mutations, migrations or seeds were executed.

## 13. Commands developers should use

```powershell
cd D:\codestorm
npm.cmd run setup
npm.cmd run dev
```

After the first setup, daily use is just npm.cmd run dev. Diagnose with npm.cmd run doctor; authorized optional database check is npm.cmd run doctor -- --database. Double-click Setup-SunShield.bat and Start-SunShield.bat are alternatives. Use the [full guide](LOCAL_DEVELOPMENT_SETUP.md) for manual workflows, overrides, port conflicts, reload details and production differences.

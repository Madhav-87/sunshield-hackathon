# SunShield Independent Release QA Report

**Review date:** 21 November 2026 (IST)
**Verified integration commit:** 992b4845a43848148e2bccdcdc5834efb0607704
**Executable dependency patch:** 832a277000b35381c659d65dc2c4cf20befbfdb9 (ancestor of tested commit)
**QA branch:** qa/final-release-992b
**Runtime:** Node.js v24.22.3, npm 11.19.1

The clean isolated worktree at the exact integration tip passed the checks below. The prior QA branch for commit 8493165 and the historical baseline report for db93a5f are preserved in branch history and RELEASE_QA_REPORT_HISTORICAL.md. The current QA branch adds only documentation and the independent read-only smoke script; it does not modify product code or merge Developer B's branch independently.

## Exact-commit test results

| Check | Result |
|---|---|
| Root npm ci | Passed; 303 packages installed; full tree reported 2 critical and 1 moderate advisory |
| Backend npm ci | Passed; 293 packages installed; 0 vulnerabilities reported |
| Frontend npm ci | Passed; 389 packages added; 0 vulnerabilities reported |
| Root test isolation, npm test | Passed: 22 tests across 3 files; 1 database integration test skipped |
| Backend typecheck | Passed, including Prisma generation |
| Backend tests | Passed: 85 across 7 files |
| Backend build | Passed |
| Frontend typecheck and lint | Passed |
| Frontend tests | Passed: 46 across 3 files |
| Frontend build | Passed; main chunk exceeds 500 kB and two third-party Zod annotation warnings remain |
| Chromium Playwright | Passed: 39 cases |
| Exact hosting build sequence | Passed: npm ci && npm --prefix backend ci && npm run build |
| Production-only audit, root | Passed: npm audit --omit=dev reports 0 vulnerabilities |
| Production-only audit, backend | Passed: npm audit --omit=dev reports 0 vulnerabilities |
| Full root audit | 3 development-tree findings remain: 2 critical in tinypool and 1 moderate in Vitest/@vitest/mocker |

The full-root findings are development/test tooling. No npm audit fix was applied. The backend and frontend package installs reported zero full-tree vulnerabilities. Developer B's Effect override removes the earlier Prisma-related advisories from the production dependency scope.

## Root-hosted production startup

The deployment root is the repository root. In a clean worktree with Node 24 and both dependency installations, the exact build sequence above passed. The root npm start command then started the compiled backend in NODE_ENV=production on port 8130 with FRONTEND_URL=http://localhost:5173, COMMUNITY_WRITES_ENABLED=false, and no DATABASE_URL. Server output confirmed it was listening. The process was stopped after the read-only smoke checks.

The verified local API URL was http://localhost:8130/api/v1. No public HTTPS frontend/backend URL or hosting account access was available. Vercel's frontend root remains frontend/. No deployment or paid service activation occurred.

## Actual HTTP smoke results

The independent smoke script sent read-only GETs and non-persistent simulation/assessment/planning requests. It did not call Safe Zone write routes.

| Check | Result |
|---|---|
| GET /health | HTTP 200 with expected body and X-Request-Id |
| Heavy construction simulation | HTTP 200, SIMULATION / CRITICAL / STOP_UNSAFE_ACTIVITY |
| Vendor simulation | HTTP 200, SIMULATION / HIGH / REDUCE_STRENUOUS_ACTIVITY |
| Scenario parity | 35 C / 50% / 5 km/h, heat index 40.68 C for both |
| Invalid simulation | HTTP 422 VALIDATION_ERROR; response request ID matched header |
| GET /weather | HTTP 200 LIVE from Open-Meteo |
| POST /heat/assess | HTTP 200 CACHED using the real observation |
| POST /protection/plan | HTTP 200; response passed the protection-plan schema |
| GET /safe-zones | HTTP 503 SAFE_ZONES_UNAVAILABLE; no DATABASE_URL was configured |
| GET /safe-zones/:id | Not reached because discovery returned no facility ID |

Totals: 8 PASS, 0 FAIL, 2 BLOCKED. A subsequent weather request reported CACHED, confirming reuse of the retained live observation. Safe Zone storage and Supabase read-only connectivity were not verified. The database integration test was skipped, not passed. No community write was performed.

## Browser/security acceptance

The 39 Chromium cases ran against the local compiled backend and Vite frontend with VITE_USE_MOCKS=false. They cover actual HeatLab HTTP behavior, actual SOS route, error handling, English/Hindi/Marathi instructions, XSS regression cases, disabled community writes, Safe Zone UI fixtures, accessible controls, and responsive routes from 320 to 1920 px. Cases using explicit weather/Safe Zone fixtures establish UI behavior only, not live database or weather behavior.

The historical unsafe HTML issue remains resolved in the tested frontend. Hostile facility names, addresses, and report comments render as inert text. Occupational recommendations remain unvalidated prototype guidance, not medical clearance or a certified work-rest plan.

## Deployment preparation and remaining limits

Official platform documentation confirms Node 24 support on Vercel and Render. Account authorization, backend provider, project access, billing, exact frontend origin, public HTTPS API URL, and deployed CORS/CSP remain unconfirmed. The user asked to leave account setup and Developer B coordination untouched. No database credentials were supplied, logged, or committed.

For hosting, use the repository root, install both lockfiles, retain Prisma/TypeScript build dependencies, run npm run build, then npm start. Set NODE_ENV=production, platform PORT, exact FRONTEND_URL, VITE_API_BASE_URL=https://<verified-api-host>/api/v1, VITE_USE_MOCKS=false, and COMMUNITY_WRITES_ENABLED=false. Store Supabase settings only in backend secret configuration. Narrow Vercel connect-src to the approved API host. Do not deploy before an explicitly approved release commit and security review.

The full-root dev/test audit still contains two critical and one moderate advisory. Production-only root and backend audits return zero. Review the remaining dev-tool advisories with the release security owner before publishing or executing untrusted CI workloads.

## Recommendation

The local integrated demo is verified with real LIVE Open-Meteo weather, actual assessment/planner responses, and actual HeatLab HTTP behavior. Public deployment is not verified. Safe Zone/Supabase connectivity, account authorization, deployed origins, and full-tree dev dependency advisories remain release gates. Keep the local HeatLab fallback available.

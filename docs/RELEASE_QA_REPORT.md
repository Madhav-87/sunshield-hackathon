# SunShield Independent Release QA Report

**Review date:** 21 November 2026 (IST)
**Verified integration commit:** `8493165a0507d354fe422e918b5ce3290b14e181`
**QA branch:** `qa/final-release-8493165`
**Runtime:** Node.js `v24.22.3`, npm `11.19.1`
**Comparison baseline:** `db93a5f799b702e1c0adeb9fda8011815ccd19de`

The consolidated integration branch contains Developer B's supplied `5b32a8964c161b15af48fdc4a690deb28b09cbfb` as an ancestor, plus Developer A's weather composition and Safe Zone route mounting. This QA branch is based on the consolidated integration commit and contains QA documentation and a read-only HTTP smoke script. It does not merge or alter Developer B's branch. The earlier report for `db93a5f` is preserved in [historical QA evidence](RELEASE_QA_REPORT_HISTORICAL.md).

## Verification on the consolidated commit

| Check | Result |
|---|---|
| Backend `npm ci` under Node 24 | Passed; 293 packages installed; npm reported 3 high advisories |
| Backend typecheck | Passed, including Prisma client generation |
| Backend tests | Passed: 85 tests across 7 files |
| Backend production build | Passed |
| Frontend `npm ci` | Passed; 389 packages added; 0 vulnerabilities reported |
| Frontend typecheck and lint | Passed |
| Frontend tests | Passed: 46 tests across 3 files |
| Frontend production build | Passed; emits a >500 kB main-chunk warning and two third-party Zod annotation warnings |
| Chromium Playwright acceptance | Passed: 39 cases, 1 worker, 2.3 minutes |
| Local production-mode API smoke | 5 PASS, 0 FAIL, 5 BLOCKED |

Playwright used the compiled local backend and frontend, with `VITE_USE_MOCKS=false`. The 39 cases include real backend HeatLab simulation requests, SOS, localization in English/Hindi/Marathi, malicious facility/address/report text rendering, failed request handling, Safe Zone UI behavior, and responsive routes from 320 to 1920 pixels. Some UI integrations use explicit fixtures; these cases do not establish live weather or database connectivity.

## Local HTTP observations

A Node 24 production-mode server started on port 8127 without database credentials. Read-only HTTP smoke checks against that actual process produced:

| Check | Result |
|---|---|
| `GET /api/v1/health` | HTTP 200 with expected body and `X-Request-Id` |
| Heavy construction simulation | HTTP 200, SIMULATION / CRITICAL / `STOP_UNSAFE_ACTIVITY` |
| Vendor simulation | HTTP 200, SIMULATION / HIGH / `REDUCE_STRENUOUS_ACTIVITY` |
| Scenario indicators | Identical: 35 C, 50%, 5 km/h, heat index 40.68 C |
| Invalid simulation | HTTP 422 `VALIDATION_ERROR`, request ID matches response header |
| `GET /weather` | HTTP 503 `WEATHER_UNAVAILABLE` |
| Live heat assessment | HTTP 503 `WEATHER_UNAVAILABLE` |
| Protection plan | HTTP 503 `WEATHER_UNAVAILABLE` |
| Safe Zone discovery | HTTP 503 `SAFE_ZONES_UNAVAILABLE` without `DATABASE_URL` |
| Safe Zone detail | Not reached; no facility ID was returned |

A direct request to the configured Open-Meteo endpoint also could not connect from this environment. This is an egress limitation here; a live upstream response remains unverified. The API returns sanitized unavailable responses rather than inventing conditions. No community write route was called.

## Deployment packaging finding

The requested backend deployment root is `backend/`, but `backend/package.json` does not declare `@prisma/adapter-pg` or `pg`. Both are declared only in the repository-root package. The mounted Safe Zone storage loads the compiled root service and imports `@prisma/adapter-pg`. A clean backend-only production installation therefore cannot be assumed to include the database adapter/runtime dependencies. Confirm a deployment bundle that includes all required runtime modules or have the integration owners correct the package boundary before deployment. This QA work records the issue without duplicating Developer B's implementation.

## Security and dependency status

The historical unsafe HTML issue remains resolved in the verified frontend source and browser regression cases; hostile facility names, addresses, and comments remain inert text. Safe Zone writes are disabled by default through `COMMUNITY_WRITES_ENABLED=false`.

The clean backend install reported 3 high-severity advisories; frontend reported none. A fresh advisory query could not reach npm's audit endpoint from this environment, so current root-package counts and remediation status are unverified. The previous audit counts in the historical report apply only to `db93a5f`; Developer B owns the remediation now in progress. Re-run audits on the exact final commit after that remediation lands.

## Hosting and secure configuration

Official Vercel and Render documentation confirms Node 24 support. This confirms runtime compatibility, not access to an account. No connected hosting account, verified HTTPS API URL, authorized production origin, billing approval, public deployment, or deployment test was available in this session. No paid service was activated.

Backend configuration names from the actual schema and example:

| Variable | Release setting |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Platform-assigned port |
| `FRONTEND_URL` | Exact approved HTTPS frontend origin |
| `DATABASE_URL` | Supabase PostgreSQL connection string; store only in backend secret settings |
| `COMMUNITY_WRITES_ENABLED` | `false` until a write-enabled test environment is approved |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com/v1` |
| `WEATHER_CACHE_TTL_SECONDS` | `600` |

The root Prisma migration config reads `DIRECT_URL`; it is not an application setting in the backend's Zod schema. Developer B must confirm the safe connection/pooler and migration requirements. No Supabase credentials were present or queried. This session has no direct communication channel to Developer B, so secure credential coordination and read-only connectivity verification remain pending. Never put database values in GitHub or frontend variables.

Vercel's project root is `frontend/`; use `VITE_API_BASE_URL=https://<verified-api-host>/api/v1` and `VITE_USE_MOCKS=false`. Narrow the current `connect-src 'self' https:` CSP to the approved API origin. Configure backend CORS to the exact deployed frontend origin. Account ownership and those domains remain unconfirmed.

## Release recommendation

**Keep the local HeatLab demonstration available; do not deploy this candidate yet.** The simulation fallback is verified, but this commit still needs the backend package/runtime dependency boundary confirmed, live Open-Meteo and Supabase checks from an authorized environment, an updated dependency audit, account/domain confirmation, and an explicitly approved release commit. See [deployment preparation](DEPLOYMENT_GUIDE.md), [known limitations](KNOWN_LIMITATIONS.md), and [release checklist](RELEASE_CHECKLIST.md).

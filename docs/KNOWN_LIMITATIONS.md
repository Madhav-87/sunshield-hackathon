# SunShield Known Limitations

Verified against `integration/final-release` commit `db93a5f799b702e1c0adeb9fda8011815ccd19de` on 21 November 2026 (IST). Recheck after teammate integration.

## Unimplemented live integrations

- `GET /api/v1/weather` is unmounted and returns 404.
- `POST /api/v1/heat/assess` and `/api/v1/protection/plan` return `503 WEATHER_PROVIDER_UNAVAILABLE`; `backend/src/server.ts` starts `createApp()` without an injected provider.
- Safe Zones discovery/details/submission/report routes are not mounted in the consolidated backend and return 404. Root Safe Zones services use mock tests only; no database connection/migration/seed was run.
- Enterprise API endpoints are not implemented. Employer UI is draft/demo only.
- No live Open-Meteo response, Supabase query, database write, public deployment, or hosted CORS/CSP check was performed.

## Security and dependency audit

- The historical `dangerouslySetInnerHTML` / `legacyMarkup` issue is **resolved in the tested integration commit**: those patterns are absent from `frontend/src`, and Chromium tests verified malicious facility names, addresses, and comments render inertly.
- The root Safe Zones package audit reports **2 critical, 3 high, and 1 moderate** advisories. Critical items include Vitest 3.2.7 and `tinypool`; high items include Prisma/@prisma/config and transitive `effect`. `npm audit --omit=dev` still reports three Prisma-related high advisories. Fix suggestions require major-version changes (Vitest 5.1.1 / Prisma 6.12.0); no automatic or forced fix was applied. Review and coordinate remediation before publishing this package or running untrusted CI changes.
- Backend clean install reported 3 high advisories, associated with its Prisma toolchain. Frontend clean install reported zero vulnerabilities.
- Dependency scans do not prove the application is completely secure. No public deployment was assessed.

## Build/test workflow limits

- Root `npm test` recursively discovers nested frontend tests and fails under the root Node environment (22 failed / 97 passed). The intended root Safe Zones tests pass when scoped with `npm.cmd test -- --root tests` (9 passed); frontend tests pass from `frontend/` (46 passed). Keep package boundaries explicit in CI.
- The root package has no `lint` script. Its unused `_availabilityStatus` test variable is not part of the frontend ESLint run; `frontend/npm run lint` passes.
- Frontend production build emits a >500 kB main-chunk warning and two third-party Zod comment-annotation warnings. Build succeeds; warnings were not hidden.
- Chromium acceptance is local Chromium only. Firefox/Safari, real mobile hardware, formal assistive technology, and qualified human translation review are not covered.
- No direct live-weather, map-tile outage, database-outage or production-host test was performed.

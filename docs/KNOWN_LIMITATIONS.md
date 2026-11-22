> **Closure update (21 November 2026):** This Developer C material was reviewed from qa/final-release-992b at 4dd73ff. Its independent test evidence remains scoped to 992b484. Subsequent integration ef01c75 independently verified actual Supabase reads (3 DEMO, 0 VERIFIED, 0 reports), one current migration and empty schema diff; root tests now include 23 passes with the real database test. The older missing-credentials statements below are historical, not current blockers. See [current release](FINAL_RELEASE.md) and [database evidence](release-evidence/closure-database-verification.json). Community writes remain disabled; public deployment remains unverified.

# SunShield Known Limitations

**Verified integration commit:** 992b4845a43848148e2bccdcdc5834efb0607704
**Review date:** 21 November 2026 (IST)

## Live integration and deployment

- In the clean repository-root production startup, weather returned HTTP 200 LIVE from Open-Meteo; occupational assessment returned HTTP 200 CACHED based on the real observation; protection planning returned HTTP 200 and passed schema validation.
- Safe Zone routes are mounted, but discovery returned sanitized HTTP 503 SAFE_ZONES_UNAVAILABLE because no DATABASE_URL was configured. Supabase read-only connectivity was not verified. One database integration test was skipped.
- Community writes remained disabled; no write request was made.
- Public deployment was not performed. Hosting account access, HTTPS URLs, exact CORS origin, production CSP, and billing authorization remain unconfirmed.
- Backend and frontend production behavior is verified locally only.

## Security and dependencies

- The historical unsafe HTML issue remains resolved in the frontend; hostile facility names, addresses, and comments render as inert text.
- Root full-tree npm audit reports 2 critical and 1 moderate development/test dependency findings in tinypool and Vitest/@vitest/mocker.
- Root and backend production-only audits (npm audit --omit=dev) each report zero vulnerabilities. Backend and frontend full package installs reported zero.
- No automatic dependency fixes were applied.
- No public deployment or external security assessment was performed.

## Build and test scope

- Exact hosting build sequence passed with Node 24: root npm ci, backend npm ci, npm run build. Repository-root npm start launched the compiled production app.
- Root npm test passes 22 tests across three files; the database integration test is skipped, not passed.
- Backend typecheck/build pass and tests pass 85/85 across seven files.
- Frontend typecheck/lint/build pass; unit tests pass 46/46 across three files.
- Chromium Playwright passes 39/39 cases. It uses local actual HeatLab and explicit fixtures for some UI integration cases; fixtures do not establish service connectivity.
- Frontend build reports a main chunk over 500 kB and two third-party Zod annotation warnings.
- Occupational recommendations are unvalidated prototype guidance, not medical advice or certified work-rest limits.
- Firefox/Safari, physical mobile devices, formal assistive technology, and qualified translation review are not covered.

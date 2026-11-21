# SunShield Release Checklist

**Verified candidate:** integration/final-release at 992b4845a43848148e2bccdcdc5834efb0607704
**Executable dependency patch:** 832a277000b35381c659d65dc2c4cf20befbfdb9
**QA branch:** qa/final-release-992b

## Verified

- [x] Node 24 clean exact hosting sequence: root npm ci, backend npm ci, npm run build.
- [x] Repository-root production npm start.
- [x] Root tests: 22 passed, 1 database integration test skipped.
- [x] Backend typecheck/build and 85 tests.
- [x] Frontend typecheck/lint/build and 46 tests.
- [x] Chromium acceptance: 39 passed.
- [x] Actual HTTP health, LIVE Open-Meteo, CACHED live assessment, planner, and both HeatLab simulations.
- [x] Root/backend production-only audits: zero vulnerabilities; backend/frontend package install audits: zero.
- [x] Historical unsafe HTML issue remains resolved; malicious text stays inert.

## Remaining release gates

- [ ] Obtain authorized direct Supabase configuration from Developer B and perform read-only connectivity verification.
- [ ] Run the skipped database integration test only when an authorized test URL is available.
- [ ] Review root full-tree development/test audit findings: 2 critical and 1 moderate in tinypool and Vitest tooling.
- [ ] Confirm authorized hosting accounts, exact public URLs, billing authority, frontend CORS origin, and backend Node 24 runtime settings.
- [ ] Deploy only an explicitly approved and security-reviewed commit.
- [ ] Verify public health and HeatLab first, then live integrations, CORS, CSP, routes, SOS, and browser errors over HTTPS.
- [ ] Keep COMMUNITY_WRITES_ENABLED=false unless a write-enabled test environment is authorized.
- [ ] Record exact deployed commit/URLs and variable names, never secret values.

## Recommendation

The local integrated demonstration passes with real weather and planning responses. Public deployment and Safe Zone/Supabase access are not verified. Resolve the database, hosting, and development-tool audit gates before release. Preserve the local fallback.

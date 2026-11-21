# SunShield Release Checklist

Current QA branch: `feature/release-qa`. Its baseline is `integration/final-release` at `db93a5f799b702e1c0adeb9fda8011815ccd19de`. Recheck against the final release candidate.

## Verified in this review

- [x] Node 24.22.3 backend typecheck, tests (64), and production build.
- [x] Node 24.22.3 frontend typecheck, lint, tests (46), and production build.
- [x] Root isolated Safe Zones tests (9) using `--root tests`; no database was contacted.
- [x] Chromium E2E suite (28), including actual-backend HeatLab, XSS regression, SOS, location denial, language, deep links, and responsive layouts.
- [x] Actual local HTTP smoke: health, both simulation scenarios, invalid simulation response/request IDs, and expected missing-provider/unmounted route statuses.
- [x] Historical unsafe HTML finding absent in production frontend source; harmless hostile text remains inert in browser tests.

## Release blockers

- [ ] Deliver and verify the real weather provider; weather endpoint is 404 and live assessment/planning return `503 WEATHER_PROVIDER_UNAVAILABLE`.
- [ ] Mount and verify Safe Zones API/database integration; current routes are 404 and no DB connectivity was tested.
- [ ] Review/remediate root package dependency audit findings (2 critical, 3 high, 1 moderate; no forced fixes used).
- [ ] Correct root `npm test` discovery so package-level tests do not pick up frontend tests; keep test roots separated.
- [ ] Obtain and independently verify the public backend/frontend deployment and exact production env values.
- [ ] Narrow Vercel CSP `connect-src` to the actual backend host after approval; verify deployed headers/CORS/deep links.
- [ ] Get qualified Hindi/Marathi review and cross-browser/physical-device testing if time allows.

## Deployment approval

- [ ] Developer A approves the exact release commit.
- [ ] Hosting/billing is authorized.
- [ ] Backend health and actual HeatLab pass on the public HTTPS URL.
- [ ] Frontend uses verified API URL and `VITE_USE_MOCKS=false`.
- [ ] Verify CORS, CSP, console, routes, SOS, and supported live integrations on deployed build.
- [ ] Record URLs, tested commit, timestamp, variable names (never secret values), and results.
- [ ] Keep the local HeatLab runbook and backup video available.

## Recommendation

The integrated local HeatLab demonstration is verified. Do not represent the complete live-weather/Safe-Zones MVP or a public deployment as ready until blockers above are resolved.

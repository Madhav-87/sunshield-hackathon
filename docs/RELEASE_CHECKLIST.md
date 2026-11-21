# SunShield Release Checklist

**Verified candidate:** integration/final-release at 8493165a0507d354fe422e918b5ce3290b14e181
**QA branch:** qa/final-release-8493165

## Verified on this commit

- [x] Node 24 backend typecheck/build; backend tests 85/85 across 7 files.
- [x] Frontend typecheck/lint/build; frontend tests 46/46 across 3 files.
- [x] Chromium Playwright acceptance 39/39, including local actual HeatLab API, SOS, security regressions, language coverage, and responsive routes.
- [x] Local production-mode backend startup and read-only HTTP smoke: health and HeatLab simulations pass; 5 PASS, 0 FAIL, 5 blocked.
- [x] Historical unsafe HTML finding remains resolved; hostile text renders inertly.

## Release blockers

- [ ] Resolve/verify backend deployment package contents: backend-only manifest omits repository-root @prisma/adapter-pg and pg runtime dependencies needed by Safe Zone storage.
- [ ] Verify live Open-Meteo weather, assessment, and planner from a network-enabled authorized environment.
- [ ] Obtain secure Supabase connection settings from Developer B and verify read-only connectivity; never share or commit credential values.
- [ ] Re-run current root/backend/frontend dependency audits after Developer B's remediation lands; npm audit registry access was unavailable in this QA session.
- [ ] Confirm authorized Vercel and backend hosting accounts, exact deployment URLs, owner-approved billing, and the backend Node 24 configuration.
- [ ] Deploy only an explicitly security-reviewed and approved release commit.
- [ ] Set exact frontend CORS origin and narrow CSP connect-src to the approved API host; verify public health and HeatLab first.

## Deployment evidence

- [ ] Exact approved release commit and review recorded.
- [ ] Backend public health and HeatLab pass over HTTPS.
- [ ] Live integrations and read-only Supabase check pass.
- [ ] Frontend uses verified HTTPS API URL and VITE_USE_MOCKS=false.
- [ ] Verify CORS, CSP, console errors, deep links, SOS, and supported workflows.
- [ ] Record public URLs and variable names only; keep secret values out of GitHub and reports.
- [ ] Preserve the local HeatLab fallback and runbook.

## Recommendation

The local HeatLab fallback is independently verified. This candidate is not ready for public deployment until the package/runtime boundary, live integrations, dependency audit, hosting authorization, and release approval gates are resolved.

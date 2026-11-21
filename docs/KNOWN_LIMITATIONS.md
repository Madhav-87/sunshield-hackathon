# SunShield Known Limitations

**Verified integration commit:** 8493165a0507d354fe422e918b5ce3290b14e181
**Review date:** 21 November 2026 (IST)

## Live integrations and deployment

- WeatherProvider is composed into the backend and GET /api/v1/weather, POST /api/v1/heat/assess, and POST /api/v1/protection/plan are mounted. On local QA, they returned sanitized HTTP 503 WEATHER_UNAVAILABLE; direct Open-Meteo connectivity was blocked by this environment. A live upstream observation remains unverified.
- Safe Zone routes are mounted. Without DATABASE_URL, read-only discovery returns sanitized HTTP 503 SAFE_ZONES_UNAVAILABLE. No Supabase query was run because no credentials or authorized connection were available.
- Safe Zone writes are gated by COMMUNITY_WRITES_ENABLED=false. This QA run called no write route.
- The backend package root does not declare @prisma/adapter-pg or pg; these are declared at repository root. Verify they are included in the actual backend deployment artifact before release.
- No Vercel/backend host account, production URL, exact CORS origin, deployed CSP, public health test, or billing approval was available. No deployment or paid service activation occurred.

## Security and dependency status

- The historical unsafe frontend HTML finding is resolved in this code: no dangerous HTML rendering path was found in the reviewed frontend code, and browser regressions confirm hostile facility names, addresses, and comments remain inert.
- The backend clean install reports 3 high-severity advisories. Frontend install reports zero. A fresh audit query failed because this environment could not connect to npm's audit endpoint; root package current counts and remediation state are unverified. Developer B owns the remediation. Re-run audit on the exact final commit.
- The previous root audit counts are preserved in the historical report and apply only to baseline db93a5f.
- No public deployment was assessed.

## Build and test boundaries

- On commit 8493165, backend typecheck/build pass and backend tests pass 85/85 across 7 files.
- Frontend typecheck/lint/build pass; frontend tests pass 46/46 across 3 files.
- Chromium Playwright passes 39/39 cases. Tests include local actual-backend HeatLab plus explicit UI fixtures for some service integrations. Fixture cases are not live provider/database verification.
- Frontend build warns about a main chunk over 500 kB and two third-party Zod annotations; build succeeds.
- Tests do not establish medical validity. Occupational recommendations remain unvalidated prototype policy, not medical advice or certified work-rest limits.
- Firefox/Safari, physical mobile devices, formal assistive technology, and qualified human translation review are not covered.

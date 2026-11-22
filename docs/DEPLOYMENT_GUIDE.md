# SunShield Deployment Guide

**Status:** deployment preparation only. The backend and frontend can be built locally; no hosting account, public URL, production origin, billing authorization, or deployment was verified.

## Application roots and runtime

- Backend hosting root: repository root. The build requires root package.json/lockfile, backend package.json/lockfile, generated Prisma code, root dist output, and backend/dist.
- Frontend Vercel root: frontend/. frontend/vercel.json runs npm run build, outputs dist, applies SPA rewrites and security headers.
- Runtime: Node 24. The root and backend packages constrain Node to >=24 <25; local Node v24.22.3 passed. Official Vercel and Render docs list Node 24 as supported.
- Keep build-time Prisma and TypeScript dependencies available during the build. Set production runtime variables for the start phase.

## Backend hosting commands

The exact sequence succeeded in a clean worktree:

    npm ci
    npm --prefix backend ci
    npm run build
    npm start

Do not configure backend/ as the host's root. Installing only backend dependencies is insufficient because root Prisma configuration and generated Safe Zone services require root dependencies. The start command is the repository-root npm start.

## Runtime and frontend configuration

Backend settings from backend/src/config/env.ts and backend/.env.example:

| Variable | Release setting |
|---|---|
| NODE_ENV | production |
| PORT | Platform-assigned listener port |
| FRONTEND_URL | Exact authorized frontend HTTPS origin |
| DATABASE_URL | Supabase connection stored as a backend secret |
| DIRECT_URL | Migration tooling only when confirmed by Developer B; not used by backend runtime schema |
| COMMUNITY_WRITES_ENABLED | false |
| OPEN_METEO_BASE_URL | https://api.open-meteo.com/v1 |
| WEATHER_CACHE_TTL_SECONDS | 600 |

Frontend build settings:

    VITE_API_BASE_URL=https://<verified-api-host>/api/v1
    VITE_USE_MOCKS=false

Never commit .env files or send database credentials through GitHub. Do not put credentials in frontend variables.

## Security and host configuration

- Configure backend CORS to the exact frontend origin using FRONTEND_URL.
- Narrow frontend/vercel.json connect-src from all HTTPS hosts to the approved backend origin.
- Verify Node 24, both dependency installations, generated Prisma code, root dist/src and dist/generated, backend/dist, platform PORT binding, and production start behavior.
- Keep COMMUNITY_WRITES_ENABLED=false unless a specific write-enabled test environment is authorized.
- Do not activate a paid service or deploy without account-owner authorization and an explicitly approved release commit.

## Verification order

1. Deploy the approved backend from the repository root and verify public HTTPS health and HeatLab simulation.
2. Verify live Open-Meteo weather, live assessment, protection planning, Safe Zone discovery, and Supabase read-only connectivity.
3. Deploy the frontend from frontend/ with the verified API URL and mocks disabled.
4. Verify CORS, CSP, deep-link refresh, browser errors, HeatLab, SOS, and primary workflows.
5. Record exact commit, public URLs, timestamp, variable names (not values), and results.

scripts/api-smoke.mjs performs read-only GETs and non-persistent simulation/assessment/planning POSTs. It does not call Safe Zone write routes. Run it against a local or explicitly authorized API only.

If deployment cannot be verified safely before the submission buffer, stop deployment attempts and preserve the verified local HeatLab demonstration.

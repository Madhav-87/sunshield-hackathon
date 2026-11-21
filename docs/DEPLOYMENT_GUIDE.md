# SunShield Deployment Guide

**Status:** preparation only. No hosting account access, verified public API URL, production origin, billing authorization, or deployment was confirmed.

## Application roots and runtime

- Frontend Vercel project root: frontend/; frontend/vercel.json runs npm run build, outputs dist, applies SPA rewrites and security headers.
- Backend package root requested for deployment: backend/; Express entry point is backend/src/server.ts, compiled to backend/dist/server.js.
- Runtime: Node 24. The backend package specifies >=24 <25; local Node v24.22.3 passed builds/tests. Vercel and Render documentation currently list Node 24 as supported.
- Repository root owns Prisma schema/generation and the Safe Zone service build.

## Deployment configuration

Build each package under Node 24:

    cd backend
    npm.cmd ci
    npm.cmd run build
    npm.cmd start

    cd frontend
    npm.cmd ci
    $env:VITE_API_BASE_URL = 'https://<verified-api-host>/api/v1'
    $env:VITE_USE_MOCKS = 'false'
    npm.cmd run build

Backend runtime settings from backend/src/config/env.ts:

| Variable | Release setting |
|---|---|
| NODE_ENV | production |
| PORT | Platform-assigned listener port |
| FRONTEND_URL | Exact approved frontend HTTPS origin |
| DATABASE_URL | Supabase PostgreSQL URL stored as a backend secret |
| COMMUNITY_WRITES_ENABLED | false pending an approved write-enabled environment |
| OPEN_METEO_BASE_URL | https://api.open-meteo.com/v1 |
| WEATHER_CACHE_TTL_SECONDS | 600 |

Set DIRECT_URL only for Prisma migration tasks if Developer B confirms it is needed. It is read by the repository-root Prisma config and is not accepted or used by the backend application schema. Do not commit a real .env, expose database URLs in logs, or put credentials in frontend build variables. Never send Supabase credentials through GitHub.

## Deployment package gate

Before configuring a backend host, verify the built deployment artifact includes the repository-root generated Prisma client/services and their runtime dependencies. Currently backend/package.json omits @prisma/adapter-pg and pg, although Safe Zone storage imports the adapter and the root package declares both. A backend-only production install has not been shown to include these modules. The current compile succeeds in the monorepo checkout, but that does not prove the backend-root deployment artifact will load Safe Zone storage.

## Security and hosting settings

- Set Vercel root to frontend/, VITE_API_BASE_URL to the verified public HTTPS API base, and VITE_USE_MOCKS=false.
- Set backend FRONTEND_URL to exactly the deployed frontend origin.
- Narrow frontend/vercel.json connect-src from all HTTPS hosts to the approved API host.
- Confirm the host is configured for Node 24, starts the compiled service with the platform port, and includes required Prisma modules.
- Do not activate paid services or deploy until the account owner authorizes them and the release commit passes security review.

## Verification order

1. Deploy the explicitly approved backend commit and check public health plus read-only HeatLab simulation.
2. Verify live weather, occupational assessment, planner, Safe Zone discovery, and Supabase read-only connectivity from the hosted environment.
3. Configure and deploy the frontend; verify CORS, CSP, HTTPS, deep-link refresh, browser console, HeatLab, SOS, and error states.
4. Record exact commit, public URLs, variable names (never values), timestamp, and results.

Use node scripts/api-smoke.mjs against a locally running or explicitly approved API. The script performs read-only GETs and non-persistent simulation/assessment/planning POSTs. It does not call Safe Zone write routes.

If deployment cannot be completed before the submission buffer, stop deployment attempts and preserve the independently verified local HeatLab demonstration.

# SunShield Deployment Guide

**Status:** deployment preparation only. The actual frontend/backend packages and Vercel configuration are present, but no hosting account, public backend URL, authorized billing, or deployment was verified.

## Application roots and commands

- Frontend: `frontend/`, native React + Vite. Vercel project root is `frontend`; `frontend/vercel.json` sets `npm run build`, `dist`, SPA rewrites, and security headers.
- Backend: `backend/`, the consolidated Express application. `backend/src/app.ts` composes middleware/routes; `backend/src/server.ts` is its only startup entry point.
- Repository root: Developer B's Prisma/Safe Zones infrastructure package and tests. It is not a second standalone Express service. Its Safe Zones router is not mounted in the core app.

Use Node 24. From `backend/` run `npm.cmd ci`, `npm.cmd run build`, then `npm.cmd start`. From `frontend/` run `npm.cmd ci`, configure the two Vite variables below, then `npm.cmd run build`. Backend requires the platform-assigned `PORT` and uses `FRONTEND_URL` for CORS.

## Frontend configuration

| Variable | Meaning | Behavior |
|---|---|---|
| `VITE_API_BASE_URL` | Public API origin/base; client normalizes to `/api/v1` | Development defaults to localhost; production defaults to same-origin `/api/v1` if unset |
| `VITE_USE_MOCKS` | Explicit demo fixtures | Mocks are used only when exactly `true`; API is the default |

For an approved public deployment, set `VITE_API_BASE_URL=https://<verified-backend-host>/api/v1` and `VITE_USE_MOCKS=false`. These are public build-time settings. Never add database passwords, private API keys, or Supabase service-role keys to frontend variables.

## Backend environment schema

These are the actual Zod-validated backend names and defaults in `backend/src/config/env.ts`:

| Variable | Required/default | Notes |
|---|---|---|
| `NODE_ENV` | Optional; `development` | Allowed: development, test, production |
| `PORT` | Optional; `8000` | Integer 1–65535; bind uses platform port |
| `FRONTEND_URL` | Optional; `http://localhost:5173` | Exact CORS origin |
| `DATABASE_URL` | Optional; empty string | No current core route requires a DB connection |
| `OPEN_METEO_BASE_URL` | Optional; `https://api.open-meteo.com/v1` | Config exists; provider is not wired into server composition |
| `WEATHER_CACHE_TTL_SECONDS` | Optional; `600` | Config exists; no live provider/cache is currently connected |

No supported `DIRECT_URL` setting exists in the consolidated backend schema. `DIRECT_URL` belongs to the root Prisma package config, not the backend service. Do not invent backend timeout/CORS names or put database secrets in frontend settings.

## Hosting workflow and limits

Proposed architecture remains Vercel frontend, an approved Node.js host (for example Render) for `backend/`, Supabase PostgreSQL, and Open-Meteo. Account access, platform limits, pricing, billing and public service URLs are unverified. Do not activate paid services without authorization.

Deploy only an approved release commit. Deploy backend first and verify its public health and actual HeatLab simulation endpoints. Then configure the real frontend API URL, deploy `frontend/`, and verify HTTPS, CORS, CSP, refresh/deep links, browser console and primary workflows. Current live weather and protection planning return `503 WEATHER_PROVIDER_UNAVAILABLE`; weather and Safe Zones return 404. Full-MVP public deployment is not release-ready until those integrations are delivered and tested.

## Existing Vercel controls

Preserve `frontend/vercel.json`: SPA rewrite to `index.html`; `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and CSP are configured. CSP currently allows `connect-src 'self' https:` and should be narrowed to the actual approved API host in coordination with Developer A. Do not disable CSP or deploy the placeholder URL in `frontend/.env.production.example`.

## Smoke verification

Build the backend first, then run from repo root:

```powershell
$env:SUNSHIELD_API_BASE_URL = 'http://localhost:8000/api/v1'
node .\scripts\api-smoke.mjs
```

The script uses compiled backend Zod schemas, sends only non-persistent simulation and read-only GET/assessment/planner requests, and reports PASS, FAIL, BLOCKED, or NOT IMPLEMENTED. It never submits Safe Zone writes. Use a public API URL only after the API owner authorizes smoke checks.

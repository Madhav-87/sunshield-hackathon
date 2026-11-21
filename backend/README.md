# SunShield backend

Developer A core intelligence MVP. Node.js 24 LTS, Express 5, strict TypeScript, Zod, Vitest and Supertest. Supabase PostgreSQL and Prisma are the agreed persistence stack; Developer B owns their integration. No database connection is needed for health, simulation or the engine tests.

## Local development

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm run dev
```

Other commands: `npm run typecheck`, `npm run build`, `npm start`, `npm test`. Start requires a completed build. Node 24 is required. Real credentials belong only in the ignored `.env`; the checked-in example intentionally leaves DATABASE_URL empty. Prisma and its client are installed but no schema, migrations or generated client are provided by Developer A.

Default environment: NODE_ENV=development; PORT=8000; FRONTEND_URL=http://localhost:5173; OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1; WEATHER_CACHE_TTL_SECONDS=600. DATABASE_URL is optional for the current modules. Developer B must supply any additional database variables. Environment validation reports invalid names without exposing values.

## Endpoints and frontend integration

| Method | Path | State |
| --- | --- | --- |
| GET | /api/v1/health | Available independently |
| POST | /api/v1/heat/assess | Requires injected real WeatherProvider |
| POST | /api/v1/protection/plan | Requires injected real WeatherProvider |
| POST | /api/v1/simulation/evaluate | Available independently |

Swagger: http://localhost:8000/docs/ . OpenAPI JSON: http://localhost:8000/openapi.json . Frontend API base: http://localhost:8000/api/v1 . Send application/json. Translate stable recommendation codes into en/hi/mr and always show the disclaimer and data mode. UNKNOWN means the assessment is unsupported and must never appear as clearance. The profile belongs in frontend local storage; this server does not persist it.

Try HeatLab:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/simulation/evaluate -ContentType application/json -Body (Get-Content -Raw examples/heatlab.json)
```

Full contracts: [API_CONTRACT.md](../docs/API_CONTRACT.md). Rule methodology and safety limits: [HEAT_RULES.md](../docs/HEAT_RULES.md). Frontend and Developer B should review these before merging integration changes.

## Developer B handoff

Implement `WeatherProvider.getWeather(latitude, longitude): Promise<WeatherResponse>` from [shared types](src/types/index.ts), then inject it into `createApp({weatherProvider})` in [server startup](src/server.ts). Business logic does not need to change. A missing provider returns 503 from live endpoints, never invented weather. Real upstream timeout/cache behavior is Developer B's responsibility. A returned observation with missing or invalid essential metrics yields UNKNOWN. Provider failures return sanitized 503 errors.

Developer B owns weather normalization/cache, Supabase connectivity, Prisma schema and migrations, Safe Zones, distance calculations, community reports, employer dashboard and infrastructure. Those files are not implemented here. The weather, Safe Zone and enterprise dashboard routes are not registered. The optional enterprise planning endpoint is deferred pending team agreement on its payload.

## Limitations and next work

The occupational rules are unvalidated prototype policy, not medical guidance or certified work-rest limits. No medical probabilities, WBGT estimates, symptom detection or guaranteed safe durations. Heat index has a conservative reporting envelope. No mandatory shift changes. Same-day schedules only; overnight shifts return 422. Planner uses the current local workday; ambiguous/nonexistent DST boundaries return 422. Forecast gaps remain UNKNOWN. Detailed source limitations are included in every assessment.

Next priorities:
1. Developer B and frontend review the completed timestamp and supplementary response contracts.
2. Inject Developer B's live weather provider and run real-weather integration checks.
3. Integrate Developer B's Safe Zones and database modules, registering their routes centrally.
4. Agree optional enterprise planning payload and implement it after P0 integration.
5. Configure deployment origin, HTTPS, provider timeouts and trusted proxy behavior with Developer B; perform mobile frontend acceptance and seek expert occupational health validation before real-world use.

Tests use deterministic fixtures and an injected clock, with no database or external requests. Verification results are recorded in [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md). Tests do not establish medical validity.

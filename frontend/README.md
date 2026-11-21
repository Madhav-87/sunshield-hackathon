# SunShield frontend

SunShield is a React, TypeScript, and Vite frontend for worker heat-safety guidance. The app is
frontend-only; backend services are owned by the team.

## Run locally

```sh
npm install
npm run dev
```

The default setup uses contract-shaped demonstration services. They are clearly labeled and do
not claim to be live weather, verified facilities, or a real heat assessment.

To connect an available backend, copy `.env.example` to `.env.local` and set:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
```

`VITE_API_BASE_URL` is configurable for local, test, and production environments. Do not add
database credentials or Supabase service-role keys to frontend environment files.

## Frontend structure

- `src/pages/` contains the emergency and employer demonstration pages.
- `src/components/` contains Tailwind UI primitives, the OpenStreetMap view, and the Recharts
  weather chart.
- `src/services/` contains the shared API client and endpoint services.
- `src/types/` contains frontend types for the agreed TRD request and response contracts.
- `src/mocks/` contains explicitly simulated weather, assessments, plans, and demo-only locations.
- `src/locales/` contains English, Hindi, and Marathi emergency guidance.

Worker preferences are stored in browser local storage. HeatLab uses separate simulation inputs
and does not change the saved worker profile or live weather data.

HeatLab checks `GET /health` when opened in API mode. Simulation stays on its labeled demo response
unless mock mode is disabled. In API mode, the client will not send `POST /simulation/evaluate`
until the finalized `API_CONTRACT.md` is available to confirm its request and response shape.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
```

There is no frontend test script configured yet.

## Backend contracts still pending

The finalized `API_CONTRACT.md` is not currently present in this workspace, and the backend at
`localhost:8000` was unreachable during this update. Simulation therefore has not been sent against
the backend. Safe-zone submissions and reports and enterprise planning also remain placeholders
until their request schemas are available. The frontend does not send invented payloads.

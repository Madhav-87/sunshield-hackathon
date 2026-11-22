# SunShield — Heat Safety Companion

## Quick Start - local development (Node.js 24)

From Windows PowerShell or Command Prompt:

~~~powershell
cd D:\codestorm
npm.cmd run setup
npm.cmd run dev
~~~

Setup installs the three existing lockfiles, safely creates missing ignored development environment files and builds Prisma/shared/backend modules. Daily startup checks configuration and ports, builds changed artifacts, starts both services and requests the default browser at http://localhost:5173. Press Ctrl+C to stop both.

Double-click alternatives: [Setup-SunShield.bat](Setup-SunShield.bat), then [Start-SunShield.bat](Start-SunShield.bat). Diagnose with `npm.cmd run doctor`, or `npm.cmd run doctor -- --database` for optional authorized read-only connectivity. Individual services: `npm.cmd run dev:backend` and `npm.cmd run dev:frontend`.

Existing manual startup and production build/start remain available. [Local development guide](docs/LOCAL_DEVELOPMENT_SETUP.md). [Actual verification](docs/LOCAL_DEVELOPMENT_VERIFICATION.md).

SunShield is a hackathon prototype for estimated occupational heat guidance, hourly protection planning, cooling-resource discovery, and comparative HeatLab simulations. It is not medically validated, certified work-rest scheduling, or permission to continue unsafe work.

## Verified release scope

- Native React application: eleven routes, English/Hindi/Marathi, SOS, and actual-engine HeatLab.
- One Express application: health, shared Open-Meteo weather/cache, occupational assessment, forecast-based planning, Safe Zone reads, and OpenAPI.
- Actual local Supabase read-only checks: three **DEMO** facilities, zero VERIFIED facilities, zero reports. Normal discovery excludes DEMO; an empty real-facility result is correct.
- Community writes remain disabled. Public deployment, actual database writes, and physical-device testing are unverified.

See [final release](docs/FINAL_RELEASE.md), [integration handoff](docs/INTEGRATION_HANDOFF.md), [release evidence](docs/release-evidence/README.md), and [known limitations](docs/KNOWN_LIMITATIONS.md). Historical QA reports name their exact tested commits.

## Local startup — Node.js 24

From the repository root in PowerShell:

~~~powershell
node --version
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd run build
$env:NODE_ENV = 'production'
$env:PORT = '8000'
$env:FRONTEND_URL = 'http://localhost:5173'
$env:COMMUNITY_WRITES_ENABLED = 'false'
npm.cmd start
~~~

In a separate terminal at the repository root:

~~~powershell
npm.cmd --prefix frontend ci
$env:VITE_API_BASE_URL = 'http://localhost:8000/api/v1'
$env:VITE_USE_MOCKS = 'false'
npm.cmd --prefix frontend run dev -- --host localhost --port 5173 --strictPort
~~~

Open <http://localhost:5173/heatlab>. Health: <http://localhost:8000/api/v1/health>. OpenAPI UI: <http://localhost:8000/docs/>. Follow the [demo runbook](docs/DEMO_RUNBOOK.md).

Store authorized DATABASE_URL and DIRECT_URL only in ignored environment files or hosting secrets. Root Prisma CLI consumes DIRECT_URL; application storage uses DATABASE_URL. Existing process/backend settings take precedence over root environment fallback. Never place credentials in VITE variables. Health and HeatLab do not need successful external weather or database access.

## Architecture and deployment

[backend/](backend/) owns central Express composition and the engine. Root [src/](src/) owns reviewed Safe Zone/database infrastructure. Build produces root dist and backend/dist plus generated Prisma modules. **Backend hosting root must be the repository root**, retaining both dependency installations and both output trees. Frontend hosting root is [frontend/](frontend/).

Use exact approved HTTPS API/CORS origins, mocks disabled, and a narrowed frontend CSP before deployment. No public deployment is verified. See the [deployment guide](docs/DEPLOYMENT_GUIDE.md).

## Checks

~~~powershell
npm.cmd run typecheck
npm.cmd --prefix backend run typecheck
npm.cmd --prefix backend test
$env:RUN_DATABASE_INTEGRATION_TESTS = 'true'
npm.cmd test
npm.cmd --prefix frontend run typecheck
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
node scripts/api-smoke.mjs
~~~

The opt-in database test is read-only and needs authorized credentials. Browser setup is in [frontend/README.md](frontend/README.md). Do not run migration/seed/reset commands as release verification.

Unique suites: backend 85; infrastructure 22 plus one actual database test; frontend 46; Chromium 39. Repeated checks are not extra test cases. All production dependency audits are clear; root development tooling still has two critical and one moderate finding pending Developer B's patch.

## Team and limits

Developer A owns engine/frontend integration; B owns weather/database/Safe Zones; C owns independent QA/deployment coordination; D owns product/presentation evidence. D's deliverable branch/location has not been supplied on origin. No presentation artifacts are invented.

Enterprise expansion, PWA, authentication expansion, measured-impact claims, clinical validation, and verified real-facility availability are outside this release. No license grant is invented; ownership/licensing requires an explicit owner decision.

# Local development setup

Install **Node.js 24.x including npm** from https://nodejs.org/, then reopen your terminal. Git and network access are needed for initial dependency installation. These scripts need no administrator permissions or PowerShell execution-policy changes. Use `npm.cmd` on Windows to avoid npm.ps1 restrictions.

## Quick start

```powershell
cd D:\codestorm
node --version
npm.cmd --version
npm.cmd run setup
npm.cmd run dev
```

Setup uses `npm ci` in root, backend and frontend with existing lockfiles. It creates only missing ignored development environment files, generates Prisma, builds shared infrastructure and compiles the backend. It never upgrades dependencies, migrates, resets, seeds or writes application data. Repeated setup intentionally reinstalls dependencies; daily startup does not install anything.

Daily use:

```powershell
cd D:\codestorm
npm.cmd run dev
```

The launcher validates configuration and exact ports, builds changed artifacts, starts Express, waits up to 45 seconds for SunShield UP health, then starts Vite, waits for HTTP readiness and requests your default browser. Logs identify each service. Press Ctrl+C to stop both.

| Service     | Default URL                         |
| ----------- | ----------------------------------- |
| Application | http://localhost:5173               |
| Backend     | http://localhost:8000               |
| Health      | http://localhost:8000/api/v1/health |
| Swagger     | http://localhost:8000/docs/         |

## Windows double-click launchers

Double-click **Setup-SunShield.bat** once, then **Start-SunShield.bat** for daily use. Both navigate to their own directory and use npm.cmd regardless of the current working directory. Errors remain visible. Start keeps its console visible for logs and supports Ctrl+C. If cmd asks `Terminate batch job (Y/N)?`, answer Y after services stop.

Suppress browser opening for automation or terminal-only work:

```powershell
$env:SUNSHIELD_NO_OPEN='true'
npm.cmd run dev
Remove-Item Env:SUNSHIELD_NO_OPEN
```

## Persistent environment configuration

Setup exclusively creates **backend/.env.development.local** only when absent:

```dotenv
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:5173
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
WEATHER_CACHE_TTL_SECONDS=600
COMMUNITY_WRITES_ENABLED=false
```

Backend precedence, highest first: shell/process variables; existing backend/.env; existing root/.env; backend/.env.development.local; built-in development defaults. Existing backend dotenv loading is unchanged. The launcher supplies effective values before starting it. The development-specific file is consumed only by these local scripts, so it cannot override production startup.

Setup also exclusively creates **frontend/.env.development.local**:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
```

Frontend configuration uses Vite's existing development-mode loader. Shell variables have highest precedence; mode-specific files override generic .env/.env.local. Restart after environment changes. The frontend child receives public VITE variables and selected OS/runtime variables; backend/database configuration is not forwarded. Never put secrets in VITE variables or frontend files. [Vite environment reference](https://vite.dev/guide/env-and-mode).

All secret environment files remain ignored. Existing environment files are never rewritten or removed. Setup reports variable names, not sensitive values, on configuration errors. Existing example files contain placeholders only.

The combined launcher requires matching `http://localhost:PORT/api/v1`, a loopback frontend HTTP origin, mocks false and community writes false. Local scripts refuse NODE_ENV=production; existing production startup remains available. They do not overwrite an inherited production setting. For alternate ports, override all corresponding values:

```powershell
$env:PORT='8100'
$env:FRONTEND_URL='http://localhost:5200'
$env:VITE_API_BASE_URL='http://localhost:8100/api/v1'
npm.cmd run dev
```

## Database configuration

Keep authorized DATABASE_URL and DIRECT_URL in the existing ignored root/.env, backend environment or process settings. Setup preserves those files and never copies credentials. Prisma CLI uses DIRECT_URL; application storage uses DATABASE_URL.

Missing/blank database settings are allowed. Health, weather, assessments, planning and HeatLab can run; Safe Zones return the existing sanitized 503. Unavailable configured storage likewise does not block unrelated sections. Malformed URLs or placeholder credentials fail local validation without revealing values. Community writes remain disabled.

Optional authorized connectivity check:

```powershell
npm.cmd run doctor -- --database
```

This performs only SELECT 1, with a bounded timeout. It does not migrate or write data.

## Independent services and original manual workflow

After setup, use separate terminals:

```powershell
cd D:\codestorm
npm.cmd run dev:backend
```

```powershell
cd D:\codestorm
npm.cmd run dev:frontend
```

Each command owns and stops only its service. Independent frontend mode can target a separately running HTTPS API via VITE_API_BASE_URL; its backend must allow the exact configured frontend origin. Backend mode watches backend/shared modules. Frontend mode retains Vite HMR.

The original manual commands remain independent of the orchestrator:

```powershell
# Terminal 1
cd D:\codestorm
$env:NODE_ENV='development'
$env:PORT='8000'
$env:FRONTEND_URL='http://localhost:5173'
$env:COMMUNITY_WRITES_ENABLED='false'
npm.cmd run build
npm.cmd start
```

```powershell
# Terminal 2
cd D:\codestorm\frontend
$env:VITE_API_BASE_URL='http://localhost:8000/api/v1'
$env:VITE_USE_MOCKS='false'
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

```powershell
# Optional Terminal 3
Invoke-RestMethod http://localhost:8000/api/v1/health
```

Manual backend build/start retains its original behavior without the new watcher. Direct Vite startup now defaults to localhost to agree with backend CORS. localhost and 127.0.0.1 are different browser origins.

## Diagnostics and troubleshooting

```powershell
cd D:\codestorm
npm.cmd run doctor
```

Doctor reports PASS, WARNING, FAIL or SKIPPED for Node/npm, dependency availability, environment/API/CORS agreement, generated/build artifacts, ports, health identity, frontend connectivity and optional database access. Free ports with stopped services are SKIPPED, not failures. An occupied port with an unavailable expected HTTP response is FAIL. Running backend CORS is checked against the exact frontend origin. Liveness does not certify database/weather readiness.

For `Cannot connect. Check your connection and try again.`:

1. Run doctor and check health. Frontend HTTP readiness alone does not imply backend readiness.
2. Open http://localhost:5173 and use exact FRONTEND_URL. Opening 127.0.0.1 while CORS allows localhost causes browser rejection.
3. Inspect actual requests in browser Network tools. VITE_API_BASE_URL must point to the intended backend; restart Vite after edits. Keep mocks false.
4. Weather 503 indicates unavailable upstream weather/data; inspect backend logs/network. Safe Zones 503 indicates missing/unavailable storage. Neither should be concealed with mocks or unrestricted CORS.

Inspect port ownership without terminating unrelated processes:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000,5173 |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Stop the owning service in its own terminal or configure matching alternate ports. Ports never silently change. Both loopback families and wildcard bindings are checked because Windows permits some overlapping wildcard binds. Ignored .build resource locks prevent concurrent owned launchers before ports bind. Dead-PID locks are reclaimed; uncertain/live owners are refused. If a lock is unreadable or its PID was reused, confirm the old terminal and services are stopped before removing only the reported lock file.

## Reloads, failures and cleanup

Vite preserves React, TypeScript and CSS HMR. Backend/shared changes are debounced and serialized: gracefully stop backend, rebuild changed artifacts, restart and wait for health. Changes to root src, Prisma schema and build configuration regenerate/compile infrastructure as needed. Generated Prisma output is excluded from watching to prevent loops. Source/config hashes and output fingerprints in ignored .build/local-dev.json skip unnecessary builds and detect missing/modified outputs.

Compilation errors leave backend stopped with visible errors while frontend stays available. Fix/save to retry. Startup compilation failures exit. Unexpected child failures stop companion services. Readiness has a 45-second bound. Environment and launcher-script changes require restarting the launcher.

Ctrl+C requests graceful shutdown through development-only IPC wrappers. Backend uses its existing drain/storage-disconnect handler; Vite.close releases frontend resources. Parent disconnection also requests shutdown. A bounded fallback force-stops only the owned child PID. No unrelated Node processes are enumerated or terminated.

## Production and verification

Existing production workflow remains separate:

```powershell
cd D:\codestorm
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd run build
$env:NODE_ENV='production'
npm.cmd start
```

Retain both root dist and backend/dist and securely provision production settings. Neither production script imports development orchestration or opens a browser. Frontend production build/Vercel settings remain unchanged. Local scripts never deploy.

```powershell
npm.cmd run test:local-dev
# Stop any services using 8000/5173 before integration verification.
node scripts/verify-local-dev.mjs
```

The integration verifier temporarily creates named source probes and changes/restores CSS/Vite config to test HMR and startup failures. Do not edit those files concurrently. Its finally block restores original bytes and checks environment files/lockfiles. Browser flows use actual APIs. See [actual verification](LOCAL_DEVELOPMENT_VERIFICATION.md).

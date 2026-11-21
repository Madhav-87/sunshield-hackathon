# SunShield Local Demonstration Runbook

This is a **local demonstration**, not full offline functionality. HeatLab runs against the actual local engine. Live weather, the Protection Planner, Safe Zones, map tiles, and database access require their service integrations and connectivity; the weather provider and Safe Zones API are not mounted in this release commit.

## Runtime and dependencies

Use Node.js 24. The QA runtime verified was Node `v24.22.3` / npm `11.19.1`. On this workstation, the checksum-verified portable Node distribution is at `C:\Users\sahil\OneDrive\Desktop\SunShield-Node24-Portable\node-v24.22.3-win-x64`. In each PowerShell terminal:

```powershell
$node24 = 'C:\Users\sahil\OneDrive\Desktop\SunShield-Node24-Portable\node-v24.22.3-win-x64'
$env:PATH = "$node24;$env:PATH"
node --version
npm.cmd --version
```

On another team machine, use its authorized Node 24 installation path. The current system installation is Node 22 and does not meet the backend engine requirement. Use `npm.cmd` in PowerShell.

## Start the backend

Open terminal 1 at the repository root:

```powershell
Set-Location backend
npm.cmd ci
$env:NODE_ENV = 'production'
$env:PORT = '8000'
$env:FRONTEND_URL = 'http://localhost:5173'
npm.cmd run build
npm.cmd start
```

No database credentials are needed for health or simulation. Do not add real credentials for this demonstration. Verify health from terminal 2:

```powershell
Invoke-RestMethod http://localhost:8000/api/v1/health
```

## Start the React frontend

Open terminal 2 at the repository root and set the same Node 24 PATH:

```powershell
Set-Location frontend
npm.cmd ci
$env:VITE_API_BASE_URL = 'http://localhost:8000/api/v1'
$env:VITE_USE_MOCKS = 'false'
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173/` or go directly to `http://localhost:5173/heatlab`.

## Mandatory HeatLab walkthrough

The native HeatLab sends two actual `POST /api/v1/simulation/evaluate` requests using the same conditions: **35 °C, 50% relative humidity, 5 km/h wind**.

1. Show the construction worker with heavy workload, direct sunlight, limited water, unavailable shade, and employer-controlled schedule. Expected actual engine result: **CRITICAL**, with `STOP_UNSAFE_ACTIVITY` at CRITICAL priority.
2. Show the street vendor with light workload, partial shade, available water and shade, and flexible schedule. Expected actual engine result: **HIGH**, with `REDUCE_STRENUOUS_ACTIVITY` at HIGH priority.
3. Both responses have the same environmental indicators and a heat index of about **40.68 °C**. The UI identifies the results as **SIMULATION**, retains returned priorities and limitations, and provides English, Hindi, and Marathi safety wording.
4. Change an input, evaluate, then reset. Browser acceptance verified that scenarios have independent state and do not alter saved worker preferences.
5. Make clear that neither assessment is medical clearance or permission to keep working. Show the prototype, medical-validation, and work-permission limitations.

SOS is available at `http://localhost:5173/sos` without database or weather access. Present weather, planner, and Safe Zones unavailable states honestly; do not describe fixtures as live data.

## Local API smoke check

After building the backend, from the repository root:

```powershell
$env:SUNSHIELD_API_BASE_URL = 'http://localhost:8000/api/v1'
node .\scripts\api-smoke.mjs
```

The probe sends non-persistent simulation requests and read-only GET/assessment/planning requests. It does not submit Safe Zone writes. Expected current integration statuses are recorded in `RELEASE_QA_REPORT.md`.

## Limitations and backup recording

Do not describe this local demo as deployed or fully offline. Real external weather and Supabase access are not configured. Coordinate with Developer D to capture a backup video of this actual working application.

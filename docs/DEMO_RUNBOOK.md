# SunShield local demonstration

Use Node.js 24 and the exact repository-root startup commands in [README](../README.md). Install root and backend packages, build from root, and start from root. Frontend runs separately with VITE_USE_MOCKS=false. Keep COMMUNITY_WRITES_ENABLED=false. Preserve an already running authorized backend.

1. Verify <http://localhost:8000/api/v1/health> and open <http://localhost:5173/heatlab> directly.
2. Evaluate the construction/vendor comparison: actual HTTP engine requests share 35°C, 50% humidity, 5 km/h wind, and approximately 40.68°C heat index.
3. Show construction CRITICAL / STOP_UNSAFE_ACTIVITY and vendor HIGH / REDUCE_STRENUOUS_ACTIVITY. Keep SIMULATION, recommendation priorities, and all limitations visible. Results are computed, never hardcoded.
4. Edit, evaluate, and reset. Profiles remain independent. Switch English/Hindi/Marathi; qualified human language review remains outstanding.
5. Show actual weather/dashboard/planner only when requests succeed. CACHED preserves the original observation timestamp. Plans are estimated guidance, not certified work-rest scheduling.
6. Normal Safe Zone discovery is empty in the current database. Explicit demo visibility shows three DEMO facilities with map distances, categories, and details. No verified real facilities exist; these are not verified cooling resources.
7. SOS at <http://localhost:5173/sos> remains accessible after the frontend loads when backend requests fail. HeatLab requires the local backend but no external weather/database.

Run node scripts/api-smoke.mjs after backend build/start. It sends read-only discovery/details and non-persistent assessment/planning/simulation requests, never community writes. Its fallback detail lookup explicitly requests includeDemo=true and preserves verification status.

This is a local demonstration, not a fully offline or publicly deployed product. Weather, database reads, and map tiles require connectivity. See [release evidence](release-evidence/README.md) for actual screenshots and preserved historical failures. Physical smartphone testing remains unverified.

# Actual local release evidence

Captured from the running integrated application, with mocks disabled, on 21 November 2026. These are local browser screenshots and HTTP responses, not a public deployment or simulated external-service success. The worker profile is an explicit demonstration profile at Pune city-center coordinates; weather is actual Open-Meteo data.

[Exact changed-file inventory since acceptance snapshot 5f26712](changed-files.txt).

- [HTTP status matrix and actual JSON bodies](http-smoke.json): health/weather/assessment/three schedule-type plans/HeatLab, Safe Zone storage failure, disabled-write guards, invalid inputs and documentation availability. No database write was performed.
- [Original actual LIVE-to-CACHED capture](live-cache-check.json): weather-integration milestone provenance, preserving original fetch/observation timestamps. This was captured before Safe Zone composition and is not a claim that the later blocked production-mode root restart succeeded.
- [Actual dashboard](live-dashboard.png): source/cache/observation timestamp, occupational guidance and honest unavailable Safe Zone card.
- [Actual weather](live-weather.png): Open-Meteo observation and hourly chart. CACHED means a retained real observation, not a simulation; do not hide that label.
- [Actual protection plan](live-plan.png): today's requested shift, real hourly data and estimated guidance; not a certified work-rest plan.
- [Actual HeatLab](heatlab-simulation.png): real engine HTTP comparison with SIMULATION and all limitations. Inputs 35 C / 50% / 5 km/h; outputs 40.68 C, CRITICAL construction and HIGH vendor.
- [Actual Safe Zone unavailable state](safe-zones-unavailable.png): storage credentials unavailable to Developer A, not an invented real-resource map.

At capture, Pune observations were 21.5 C / 51% / 5 km/h, observed 22:15 IST. Cool actual conditions returned CAUTION and no reported heat index outside the established envelope. No threshold was changed to produce a presentation result. API values and timestamps naturally change; see each captured response for provenance.

Developer B's reported Supabase result (three DEMO facilities, zero reports, one migration/empty diff) is not independently established by these files. Do not claim verified real resources, medical safety, measured impact, database write success or deployed/public integration. Current implementation/build/deployment gates are in [the release handoff](../FINAL_RELEASE.md).

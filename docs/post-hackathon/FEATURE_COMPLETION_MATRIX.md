# Feature completion matrix

Audit date: 22 November 2026 (IST). Baseline: ef01c7530bf78948e68094436128330b7f3e7912. Node.js 24.13.0 / npm 11.4.1. Audit and planning only; no product fixes, dependency changes, database mutations, or deployment.

“Fully implemented and verified” means the stated **prototype scope** was exercised locally, not medically validated or production-certified. “Partially implemented” includes working subpaths with material missing behavior. Placeholder is deliberate non-executable product scope; Broken denotes a reproduced defect. Missing original requirements and new startup scope are separated in [gap analysis](REQUIREMENTS_GAP_ANALYSIS.md).

| Module | Status | Actual scope/evidence | Missing or limiting behavior |
| --- | --- | --- | --- |
| Worker onboarding | Fully implemented and verified | Three-step form, strict complete profile, actual city coordinates, browser persistence, validation/recovery tests | Same-day shifts; only three manual cities; no server account |
| Worker dashboard | Partially implemented | Real weather/assessment/discovery queries; independent errors; location changes | SFT-01: old advisory can remain after expiration in an open tab |
| Worker profile | Fully implemented and verified | Validated device-local profile restore/edit; blocked-storage in-memory recovery | No account synchronization/delete action; not persistent backend identity |
| Live weather | Fully implemented and verified | Shared real Open-Meteo provider, validated units/timezones/nulls and actual HTTP 200 | No SLA/commercial-service decision; not worksite measurement |
| Weather cache | Fully implemented and verified | Per-process bounded 500-entry cache, TTL 600s, original timestamps; fake-clock TTL tests and actual CACHED read | No single-flight, distributed cache, persistence or retry/backoff |
| Occupational engine | Fully implemented and verified | Deterministic shared engine; UNKNOWN/stale/extreme overrides; regression tests and actual HeatLab | Unvalidated product thresholds; health/clothing/acclimatization excluded; wind does not change heat-index formula |
| Protection Planner | Partially implemented | Actual hourly forecast, partial periods, timezone/DST/gaps, fixed/employer/flexible constraints | Same-day/current-date only; optionalScheduleAdvice returned but not rendered; no certified work-rest intervals |
| Safe Zone discovery | Partially implemented | Actual DB reads, category/radius/sort/map/demo exclusion; geographic regression tests | Availability-only UI unsupported; verification/search filtering client-side over up to 100 results; no verified real resources |
| Facility details | Partially implemented | Three real detail records read; address/amenities/status shown | Detail panel lacks explicit verification/DEMO badge even though cards/map show it |
| Community submissions | Partially implemented | Strict request/form; PENDING/UNKNOWN enforced in service; mocked/fixture success | Actual persistence disabled and unverified; no moderation/auth/abuse identity |
| Community reports | Partially implemented | Validated comment/status; mocked service and fixture UI | Actual writes disabled; no moderation, report aggregation or verified availability update |
| SOS | Fully implemented and verified | Public route, tel:112, symptom/cooling/fluid text; backend-outage browser checks | No actual call placed; expert review and device validation pending; not offline-installable |
| HeatLab | Fully implemented and verified | Actual engine, two independent scenarios, reset/edit/cancel, SIMULATION and limitations | Not a live forecast; future time-sensitive clinical claims out of scope |
| Employer dashboard | Placeholder | Explicit draft/pending UI, no enterprise API request | No dashboard endpoint, aggregation, tenant access or persisted worksite workflow |
| Employer planner | Placeholder | Local form review only, explicitly uncalculated | No plan endpoint/engine execution/persistence; schema models alone are insufficient |
| English/Hindi/Marathi | Partially implemented | 245 matching keys, safety fallback, actual render and browser switching | Qualified language review, regional speech voices and city-name localization pending; no-profile language resets on reload |
| Accessibility | Partially implemented | Labels, keyboard skip/focus, reduced motion, 48px primary controls; 11-route axe run no violations | No full manual WCAG audit, screen-reader or physical-device evidence |
| Responsive design | Fully implemented and verified | Existing Chromium tests cover 320–1920px; current actual 390px routes no horizontal overflow | Desktop mobile emulation does not prove Android/iOS, zoom or assistive technology behavior |
| Supabase integration | Partially implemented | Actual application-client reads, migration and schema alignment | Runtime overprivileged; RLS bypass; backups/restore and deployment role unverified |
| Authentication | Not implemented | No identity/session/JWT/login middleware | Original MVP intentionally anonymous; startup accounts require design and consent |
| Authorization | Not implemented | Write-off flag and validation exist, but no identities/roles | No moderator/organization/tenant object authorization; CORS is not authorization |
| Security | Partially implemented | Helmet, fixed origin, size/rate limits, errors, request IDs, inert React text, no secret values committed in inspected HEAD | Root dev advisories, privileged DB role, broad HTTPS CSP, no tenant access model or external assessment |
| Error handling | Fully implemented and verified | Sanitized errors, request IDs, abort/timeout/retry/empty states, dependency isolation tests | Generic 503 copy hides disabled-feature specifics; no operational telemetry/readiness |
| Testing coverage | Partially implemented | 85 backend, 23 root incl. DB, 46 frontend; Chromium acceptance | No measured coverage %, real writes, authorization, dense-data load, cross-browser or clinical validation |
| Performance | Partially implemented | Lazy routes/map/chart, bounded weather cache, query cancellation | No measured 3-second target, load/SLO proof, single-flight or scalable spatial index; >500kB main chunk |
| Deployment readiness | Partially implemented | Repository-root build/start structure, PORT, CORS, SPA rewrites/headers | No verified public deployment, approved production secrets/origin/CSP, commercial-weather terms or incident/rollback drill |
| Notifications | Not implemented | No notification service/subscription/jobs | New startup/P2 scope, permission/delivery/failure design required |
| PWA/offline | Not implemented | No manifest/service worker/offline strategy | Loaded SOS independence is not offline support |
| Advanced occupational intelligence | Not implemented | Existing prototype only | Any WBGT/physiology/personalization requires qualified validation and explicit consent |
| Open-session freshness | Broken | Real responses + browser-only 65-minute clock advance: request count/advisory unchanged, no stale warning | SFT-01; no threshold change required |

Route and endpoint details are in [complete audit](COMPLETE_CODEBASE_AUDIT.md). A future pilot needs real verified facility operations; three DEMO rows cannot satisfy resource-availability claims.

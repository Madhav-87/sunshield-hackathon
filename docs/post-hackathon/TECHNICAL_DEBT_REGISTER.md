# Technical debt register

Audit date: 22 November 2026 (IST). Baseline: ef01c7530bf78948e68094436128330b7f3e7912. Node.js 24.13.0 / npm 11.4.1. Audit and planning only; no product fixes, dependency changes, database mutations, or deployment.

P0 = blocks responsible startup/pilot progression; P1 = before relevant workflow rollout; P2 = improvement after essentials. Confirmed denotes source/runtime evidence, not a hypothetical exploit. IDs map to [roadmap](DEVELOPMENT_ROADMAP.md).

| ID | Priority | Confirmed debt / impact | Evidence and proposed resolution |
| --- | --- | --- | --- |
| SFT-01 | P0 | Open dashboard does not refresh/expire old advice; stale label not time-driven | Actual 65-minute clock probe. Add explicit validity lifecycle, safe refresh/failure display and clock tests; preserve server thresholds |
| SEC-01 | P0 | Runtime DB owner bypasses RLS, can write/delete and manage roles/DB | Read-only catalog checks. Separate migration owner from least-privilege runtime; review RLS grants, never change shared DB without separately approved plan |
| SEC-02 | P0 | Root Vitest3.2.7/tinypool1.1.1/@vitest/mocker advisory chain | Full audit 2 critical + 1 moderate dependency entries; production0. Review minimal maintained-compatible patch in isolation, not npm audit fix --force |
| SAF-01 | P0 | Prototype safety thresholds/translation not expert validated | Explicit code limitations, no validation evidence. Expert review, traceable approval and pilot stop criteria; do not tune thresholds for demos |
| SZ-01 | P1 | Detail panel omits verification/DEMO badge; cards/popups show it | Actual browser detail inspection. Add stable disclosure and regression for every status |
| SZ-02 | P1 | “Available only” cannot work from discovery shape; returns unsupported state | Router strips availabilityStatus; frontend deliberately blocks filter. Agree additive contract/semantics and wire actual filter, avoid fabricated availability |
| SZ-03 | P1 | Client search/verification filtering over server-limited100 can hide matches | Source-confirmed; no dense real dataset here. Server filters/pagination semantics and dense fixture acceptance |
| SZ-04 | P1 | No moderation, verifier identity/history/expiry, report processing | Models/store only current statuses and append reports. Add authorized moderation before any public writes |
| SZ-05 | P1 | Actual write persistence not verified; UI still offers submission/report | Flag503 verified; fixture success only. Capability/disabled UX plus separately authorized isolated write verification |
| PLN-01 | P1 | optionalScheduleAdvice accepted but never displayed | Response/client field present, protection UI absent. Translate/expose safe optional advice, preserve fixed schedules |
| PLN-02 | P2 | Same-day/current-date only; GPS timezone derives from device | Intentional documented MVP scope, becomes a gap for other regions/shifts. Clarify before extending schemas/tests |
| PRF-01 | P1 | Profiles have no cloud identity, schema version, delete/export or consent flow | localStorage only, original MVP intentional. Design optional accounts/privacy first; keep SOS public |
| LOC-01 | P1 | No-profile language resets on reload; city names untranslated; voice availability device-dependent | Explicit current behavior/test, not corrupted Devanagari. Persist standalone language preference and obtain human/voice review |
| CON-01 | P1 | Frontend/backend Zod contract duplication; weaker output metadata in client | Fixture parity is not complete generated parity. Version contract/export tests; preserve existing APIs |
| DOC-01 | P1 | Database README claims no central app; parity report says provider absent; old counts/blockers intermixed | Historical reports valuable but active summaries stale. Label evidence scopes and authoritative startup; never delete history to conceal failures |
| DEP-01 | P1 | Two backend package roots/Prisma runtimes/build outputs complicate deploy | Builds work; deployment-root error is easy. CI artifact checks and explicit package ownership; no architecture rewrite now |
| SEC-03 | P1 | CSP allows all HTTPS connections; no proxy trust/distributed rate limiter strategy | Template config, no public host chosen. Pin real endpoints/proxy hops and verify abuse behavior before deploy |
| OBS-01 | P1 | Health only liveness; no readiness/structured telemetry/alerting | Console startup and generic errors. Add privacy-safe service health/metrics and incident runbook without startup dependency gate |
| PERF-01 | P1 | Concurrent cache misses duplicate upstream requests; per-process cache not shared | Map has no in-flight promise registry. Measure/implement single-flight and upstream bounds; do not assume Redis needed |
| PERF-02 | P1 | Bounding-box candidate pages scan all matches; dense-region cost unbenchmarked | Haversine before final limit is correct; optimize only after realistic EXPLAIN/load evidence, consider spatial indexing later |
| PERF-03 | P2 | Main JS ~502.72kB, chart ~424.70kB, map ~154.95kB minified | Lazy split already exists; no measured mobile target. Benchmark before bundle work; warnings not build failures |
| TST-01 | P1 | Missing aging-in-place, RLS/tenant auth, isolated writes, cross-browser and load tests | Existing85/23/46/39 do not certify these. Add risk-based regression/CI with separate fixture/live tiers |
| DB-01 | P1 | Worksite boolean access lacks LIMITED/timezone; no membership/moderation/profile/notification schema | Startup schema gap, not permission to migrate now. Agree models/privacy and migration/rollback review |
| API-01 | P1 | Safe Zone OpenAPI success lacks schemas; address max only global32KB; timestamps weakly typed in places | Add contract parity and bounds in reviewed compatible changes; do not silently break clients |
| LIC-01 | P0 before commercial use | Weather free endpoint limited to noncommercial use; attribution is text without required link; repo license absent | Official Open-Meteo terms/licence reviewed. Owner decides commercial plan/attribution and repository licensing; no legal grant inferred |
| OPS-01 | P1 | No committed CI workflow, verified public deployment, restore drill or production rollback | Build success is insufficient for launch. Approved staging and operational acceptance required |
| DEMO-01 | Informational | Seed records, heatlab presets/default35/50/5, fixed mocked timestamps and enterprise draft | Intentional explicit demonstration behavior; preserve labels. Never relabel as live/verified or silently use fixtures on errors |

No confirmed unreachable application module or unused dependency was identified for safe removal. Legacy frontend was already removed during reengineering; root source is active infrastructure, not a duplicate server. Candidate duplicate dependencies, reserved recommendation codes and script fixtures need ownership/usage review rather than deletion. Standalone SQL/migration/Prisma model duplication needs drift governance because Prisma diff does not certify all CHECK/RLS policies.

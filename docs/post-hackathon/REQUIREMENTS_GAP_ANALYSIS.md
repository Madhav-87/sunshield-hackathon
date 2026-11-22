# Requirements gap analysis

Audit date: 22 November 2026 (IST). Baseline: ef01c7530bf78948e68094436128330b7f3e7912. Node.js 24.13.0 / npm 11.4.1. Audit and planning only; no product fixes, dependency changes, database mutations, or deployment.

## Sources and authority

Freshly read supplied SunShield_PRD.pdf (2 pages), SunShield_SRD.pdf (2), SunShield_TRD.pdf (4), v1.0 proposed team baseline dated 21 November, plus [API contract](../API_CONTRACT.md), [heat rules](../HEAT_RULES.md), [implementation record](../IMPLEMENTATION.md), integration/release/parity reports. PDF SHA-256 provenance: [inventory](evidence/source-inventory.json). Extracted scratch copies were refreshed from original PDFs; originals unchanged. No missing requirement was invented.

TRD proposed Python/FastAPI and explicitly left backend choice open. Existing documented Node/Express handoff superseded it. React/Express/Prisma are accepted actual implementation, not a reason to rewrite to the proposed stack or install shadcn. PDF 10PM deadline was superseded by the user's midnight instruction and submission; historic timing is not a current product defect.

## Original functional requirements

| Requirement | Original priority/source | Outcome | Remaining gap |
| --- | --- | --- | --- |
| OBJ-01 / FR-02 current/hourly weather | PRD P0; SRD/TRD | Implemented, actual LIVE/CACHED verified | Open-session freshness; commercial access/attribution; broader location/device verification |
| FR-01 worker setup/preferences | P0 | Implemented locally, validated and persisted; edit works | Same-day and three-city limits intentional; cloud profiles were P2, not missing MVP identity |
| OBJ-02 / FR-03 explainable engine | P0 | Implemented/verified prototype, shared codes/limits/UNKNOWN | Expert validation explicitly required before real safety deployment, not satisfied by tests |
| OBJ-03 / FR-04 planner in existing shift | P0 | Implemented actual forecast, gaps/partial hours/timezone/DST constraints | Optional flexibility code not displayed; active expiration; no overnight support (documented MVP restriction) |
| OBJ-04 / FR-05 cooling-resource discovery | P0 | Real DB/map/radius/category/distance/details implemented | No VERIFIED real resources; unsupported availability-only UI; DEMO status missing inside detail panel; verification/name filters limited to returned subset |
| FR-05 submissions/availability reporting | PRD P1; SRD present | Forms/service validation/mock tests implemented | Disabled actual writes, moderation and anti-abuse; no automatic verified availability update |
| OBJ-08 / FR-06 HeatLab | P0 | Implemented actual engine comparison/edit/reset/isolation; SIMULATION explicit | No live data overwrite; live-mode link returns dashboard. No requirement to fabricate forecast in lab |
| OBJ-05 / FR-07 regional critical text | P0 | Three dictionaries, key parity, codes/fallbacks and actual rendering verified | Qualified Hindi/Marathi review and real-device speech |
| FR-07 voice | PRD P1 | Browser voice selection/text fallback implemented | No prerecorded audio; confirm whether text fallback satisfies “voice or prerecorded fallback” acceptance where voices unavailable |
| OBJ-06 / FR-08 SOS | P0 | Public warning/cooling/fluid restriction and tel:112 verified | Qualified review, device dialer behavior; no real call placed |
| OBJ-07 / FR-09 enterprise | PRD P1 | Explicit draft screens and unused models only | No dashboard/plan endpoints, workforce aggregation/interventions or organization authorization |
| Eleven shared routes | SRD | All routes render and navigate; local refresh tested | Employer routes still placeholders; route existence is not feature completion |
| Accounts/persistence/push | PRD P2 | Device-local profile only | Server accounts/background alerts were stretch; startup proposals below |
| PWA/offline caching | PRD P2 | Not implemented | Loaded SOS independence is not install/offline support |

## Original nonfunctional acceptance

| Requirement | Evidence / gap |
| --- | --- |
| 320/390/430/768/1024/1440 responsive, ≥48px primary controls | Existing Chromium width suite plus actual 390px eleven-route audit; no full physical-device proof |
| WCAG 2.2 AA principles | Labels/keyboard/focus/reduced motion and axe checks pass sampled scope; full conformance/manual AT review absent |
| UI usable ≤3s, internal API ≤1s excluding upstream | No controlled network/device load benchmark. Single-request timings are observations, not acceptance/SLO proof |
| Location denied, empty, stale, errors/offline | Many fixture/actual recovery checks pass; aging-in-place stale state broken; full offline product absent |
| Privacy/location minimization | Device-local profile/no worker tracking; coordinates sent to backend/provider/map/navigation. Consent/retention/delete/analytics policy absent |
| HTTPS/restricted CORS/server secrets/input validation | Local safeguards exist; deployed HTTPS/CSP/proxy/secrets not independently verified; DB role excessive |
| Modern Chrome/Edge/Firefox/Safari | Chromium only. Edge/Firefox/Safari and real mobile remain unverified |
| Working deployment/public URL/backup recording | No verified deployment or backup recording supplied here; screenshots exist, not a demo video |
| No fictional resources/medical or wage guarantees | Correct DEMO exclusion and simulation labels; detail disclosure gap needs fix. No evidence supports impact or medical certification claims |

## Clarifications required before implementation

1. Who is the initial pilot user, geographic scope, operating partner and accountable occupational-health reviewer?
2. Can PENDING facilities be publicly discoverable, or must normal results be VERIFIED-only? Current contract intentionally includes PENDING.
3. Define verification evidence, verifier authority, recheck expiry, rejected-detail policy and report-to-availability moderation; community reports cannot self-verify.
4. Decide availability semantics, timezone/opening hours, future/overnight shifts, trusted GPS timezone and manual geocoding scope.
5. Define anonymous versus signed-in worker experience, retention/export/deletion, consent, employer tenant boundaries and emergency access.
6. Agree enterprise schemas and interventions; avoid inferred employee tracking, wage-saving or medical-safe-duration metrics.
7. Resolve voice fallback interpretation, production providers, weather commercial plan/attribution and repository licensing ownership.

## New recommendations (not retroactive requirements)

Least-privilege runtime identity, authenticated moderator/tenant workflows, cloud profile sync, notification consent/jobs, tested offline expiry, observability/restore/incident procedures, clinical evidence governance, CI security gates and controlled pilot methodology are startup readiness proposals. Advanced WBGT/health personalization, additional cities/analytics and enterprise expansion require explicit product approval; none were added in this audit.

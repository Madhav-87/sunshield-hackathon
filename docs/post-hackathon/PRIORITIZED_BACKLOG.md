# Prioritized backlog

Baseline ef01c7530bf78948e68094436128330b7f3e7912; audit complete 22 November 2026 IST. This backlog is proposed, not implementation approval. Full status/dependencies/modules/acceptance/complexity/verification for **each** task are in [task register](DEVELOPMENT_ROADMAP.md#task-register). [Evidence](CURRENT_PROJECT_STATUS.md#actual-verification) establishes current behavior.

## First implementation task: SFT-01

**Correct freshness for an application left open.** The actual dashboard retained its old advisory after a browser-only65-minute clock advance, sent no replacement request, and showed no stale warning. Existing backend checks already reject stale observations when called; do not alter heat rules.

Scope: explicit frontend result validity/aging and safe refresh/recovery across dashboard/planner and background resume. Preserve independent section failures, source/observation timestamps, UNKNOWN/stop prominence, SIMULATION independence, localization and cancellation. Do not redesign pages or automatically call an old result safe.

Acceptance: a clock-driven regression reproduces the current defect and passes with the correction; expired advice is clearly unsupported while refresh is pending or fails; no simulated fallback; an update cannot mix old profile/location with new response; approved age semantics align with existing backend validity rules. Verify en/hi/mr, online/offline/background resume and existing suites. Estimated M, about3–5 engineering days pending design/QA. No product implementation was started.

## Immediate ordering

| Rank | Tasks | Reason / gate |
| --- | --- | --- |
| 1 | SFT-01 | Confirmed user-visible safety lifecycle defect; smallest direct worker-safety correction |
| 2 | SEC-01 | Runtime DB privilege reduction design and approved isolated validation before any startup exposure |
| 3 | SEC-02 | Unremediated critical dev-tool advisory graph; accept only reviewed compatible patch, not unpushed proposal |
| 4 | SAF-01, LIC-01 | Start expert safety/language and commercial/license decisions early; external gates |
| 5 | SZ-01, PLN-01, DOC-01 | Focused disclosure/missing-response presentation/current-documentation corrections |
| 6 | CON-01, API-01, SZ-02, SZ-03 | Agree exact discovery/availability/filter semantics and contract parity before extending behavior |
| 7 | TST-01, DEP-01, PERF-04 | Reproducible CI/artifacts/risk tests and measured budgets, preserving local demo |
| 8 | DB-01, AUTH-01, AUTH-02, PRF-01 | Privacy/identity/tenancy/schema decisions before optional persisted worker/organization workflows |
| 9 | LOC-01, SZ-04, SZ-05 | Regional usability, authorized resource moderation and isolated write verification; keep shared writes false |
| 10 | SEC-03, OBS-01, PERF-01/02, OPS-01 | Approved production topology, telemetry, measured bottlenecks and staging/restore evidence |
| 11 | ENT-01 | Original P1 employer backend and tenant workflows after worker stability/contracts |
| 12 | PIL-01 | Go/no-go controlled pilot only after genuine resource operations, qualified safety/privacy and deployment acceptance |
| Later | PLN-02, PERF-03, NOT-01, PWA-01, ADV-01 | Optional schedule expansion/optimization/notifications/offline/research; explicitly approved scope only |

## Implementation entry/exit rules

- Create one focused feature/fix branch from develop per approved task; preserve hackathon backup and organizers' submission. No main changes until reviewed promotion.
- Keep historical tests/evidence. Add a meaningful regression for the actual defect, execute applicable suites and audits after dependencies change, and disclose failed/skipped/live versus fixture checks.
- Database role/schema/data changes require a separately approved preservation/rollback plan and authorized isolated environment. A roadmap row is not migration/write authorization.
- Community writes stay disabled, emergency access stays public, old engine behavior remains versioned; new safety policy requires qualified review.
- Public launch/pilot requires exact-commit independent QA, real host/configuration verification and explicit approval. Do not present a local build as deployed.
- Stop after this audit. Wait for approval to implement SFT-01 or another selected task.

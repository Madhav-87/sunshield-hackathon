# Read-only database audit

Audit date: 22 November 2026 (IST). Baseline: ef01c7530bf78948e68094436128330b7f3e7912. Node.js 24.13.0 / npm 11.4.1. Audit and planning only; no product fixes, dependency changes, database mutations, or deployment.

## Commands and boundaries

Existing authorized ignored root environment used. DATABASE_URL configured: yes. DIRECT_URL configured: yes. COMMUNITY_WRITES_ENABLED=false. Prisma7.10.1 inspected before commands; root Prisma config uses DIRECT_URL, application PostgreSQL adapter uses DATABASE_URL. dotenv root fallback never overrides process/backend variables. This audit did not copy, print or commit connection strings.

- Prisma validate: passed.
- Root production build generated Prisma client successfully (local files only).
- Prisma migration status tool: one migration; database schema up to date.
- Prisma7 read-only diff: node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema schema.prisma --exit-code; exit0, No difference detected.
- Application client connect and SELECT-only catalog/data inspection succeeded.
- RUN_DATABASE_INTEGRATION_TESTS=true actual root run:23 passed, comprising22 mocked/unit tests and1 live read-only database test. Source reviewed: connect, SELECT1, counts/groupBy/findMany/detail/discovery only; no mutations.

No migrate deploy/dev/reset, db push, seed, SQL DDL/DML, permission changes or live write verification. The disabled POST probes return503 before calling persistent services. No isolated write authorization exists; no live writes attempted.

## Actual data snapshot

| Entity/status | Count |
| --- | --- |
| Safe Zones total | 3 |
| DEMO | 3 |
| VERIFIED / PENDING / REJECTED | 0 / 0 / 0 |
| Reports | 0 |
| Organizations | 0 |
| Worksites | 0 |
| Applied migrations | 1:202611210001_init, finished, not rolled back |

Current data independently reproduced, not copied from Developer B's report. [Catalog/data evidence](evidence/database.json), [HTTP bodies](evidence/http.json). Empty Prisma diff verifies mapped schema alignment only; it is not complete proof of RLS/grant/CHECK/trigger semantics. SQL catalog inspection confirms coordinate/nonblank/count/schedule/comment checks. Actual RLS configuration exists beyond the migration's simple table definitions.

## API/frontend behavior

Normal discovery:200,0 facilities. Explicit includeDemo=true:200,3 facilities; all remain DEMO. Three existing UUID details:200, original status and metadata retained. Invalid coords/ID:422. Exact radius/nearest order/limit have mocked regression cases; live read-only test verifies real nearby demo exclusion/inclusion/detail, not a populated VERIFIED search. There are no verified real facilities to certify.

Actual frontend with mocks disabled: empty normal results; explicit demo cards/map/details/distance/category behavior verified. Cards and map popups label DEMO; **detail panel lacks that badge**, recorded SZ-01. Availability-only UI explicitly unsupported despite root service supporting an availability filter. No fabricated resources or status changes were introduced.

## Security/permission findings

All four application tables: RLS enabled, FORCE RLS false, zero policies. Runtime role owns them and has bypass_rls/create_database/create_roles plus full CRUD privileges; superuser=false. anon/authenticated roles have CRUD table grants, but RLS without policies normally denies rows; effective externally authenticated access was not probed. No public exploit or successful unauthorized write is claimed.

Required future action SEC-01: authorized role/policy design and test plan separating migration owner, runtime reads, future community append operations and moderator updates. Validate tenant/record scope before exposing new endpoints. Least privilege must be enforced by credentials and policies, not merely by a false application flag.

## Model limitations

- SafeZone has current verification/availability and lastVerifiedAt, but no verifier identity, source/evidence, verification expiration, immutable moderation history, structured opening-hours/timezone or audit events.
- SafeZoneReport appends status/comments; reporterTokenHash optional and route never supplies it. No authenticated attribution, deduplication, moderation/aggregation or automatic availability update.
- Organization/Worksite models exist without endpoints or memberships. Worksite uses water/shade booleans (no LIMITED), no timezone, unequal-only start/end constraint. These cannot implement agreed enterprise workflows by themselves.
- No persisted worker/account/session/consent/notification models; local worker profile is intentional MVP behavior.
- Bounding-box plus Haversine pagination is correct for result selection, but scans all candidates; dense-region/index/load behavior not established with three demo rows. Do not introduce PostGIS or migrations without measured need and approval.
- Standalone SQL/Prisma migration/model duplication and old database README require reconciliation in future documentation work; no existing schema scripts were run.

Backups/restore, network allowlists, provider dashboard advisors, row policies through Data API, secret rotation and production role configuration are unverified. These are launch gates, not current audit authorizations.

# Security audit

Audit date: 22 November 2026 (IST). Baseline: ef01c7530bf78948e68094436128330b7f3e7912. Node.js 24.13.0 / npm 11.4.1. Audit and planning only; no product fixes, dependency changes, database mutations, or deployment.

## Assessment

Local prototype controls are present; production security approval is **not granted**. No security fix, package upgrade, role change or migration was applied. This is source, dependency and authorized read-only configuration inspection, not a penetration test.

## Dependency findings

Fresh npm audit --json: root full 3 dependency entries (2 critical,1 moderate); root/backend/frontend production-only0; backend/frontend full0. Count vulnerable dependency entries, not unique CVEs or independent exploit chains. [Raw sanitized output](evidence/checks.json) includes exact installed graph/ranges. Root installed Vitest3.2.7 and tinypool1.1.1 remain. Existing Effect3.22.1 override preserved.

- [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3): tinypool worker-options prototype-pollution gadget, critical advisory.
- [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr): tinypool run-options gadget; installed1.1.1 is below reported patched2.1.2.
- [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) and [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9): Vitest/mocker tooling issues. Test/dev attack preconditions matter; no application HTTP RCE was demonstrated.

The proposed security/root-vitest-remediation is unverified/uncommitted/unpushed per handoff; no matching security/Vitest remote branch appeared in this audit. Its code cannot be meaningfully reviewed from a nonexistent artifact. Review of the **current advisory graph** is complete; implementation is deferred. Do not force an isolated tinypool major override that breaks the runner API or accept npm's suggested major upgrade without Node24 and full compatible checks. Use an isolated, reviewed patch after approval, preserve all23 root tests including read-only DB, and re-audit all scopes. No remediation was reproduced here.

## Database security — confirmed configuration risk

Runtime role is not superuser, but bypass_rls/create_database/create_roles are true; it owns all four application tables and has SELECT/INSERT/UPDATE/DELETE. All tables have RLS enabled, not forced, with zero policies. anon/authenticated have table-level CRUD privileges, but no policies ordinarily deny row access for those roles; table grants alone **do not prove exploitable public writes**. Runtime ownership/BYPASSRLS means its direct SQL bypasses that row-policy protection. No public Supabase REST probe, JWT/anon-key test or mutation was performed. [Catalog evidence](evidence/database.json).

Separate migration ownership from a dedicated minimal runtime role, assess schema/public grants and policy design, and validate effective privileges in an authorized test environment before launch. RLS enabled is not proof of least privilege. Do not alter current production data/permissions as an “audit fix.” Official [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) explains the role/policy boundary.

## Verified protections and residual gaps

| Area | Current protection | Remaining risk/gate |
| --- | --- | --- |
| Inputs | Strict Zod enums/coords/UUIDs/schedules; forbidden verification assignment; 32KB body | address lacks per-field max; response timestamp/code metadata weaker in frontend; agree bounds |
| Errors | Generic500/503, malformed-body codes, request IDs, no raw provider/DB stack | Privacy-safe server diagnostics absent; no production incident visibility |
| Rendering | Native React text, safe directions allowlist, CSP-compatible jitless Zod | Full XSS/pen-test assurance not claimed; broad HTTPS connect-src and inline styles require approved deployment policy |
| Traffic | 120/min API/IP, disabled community writes, optional10/15min shared write limiter | In-memory single-instance limiter; proxy topology unspecified; health shares quota |
| Authentication | Anonymous reads/profile MVP intentional | No sessions, RBAC, tenant isolation, moderator authorization, account recovery or revocation |
| Privacy | Profile local, no continuous location tracking in backend models | Stored exact coordinates/work context readable to same-origin code; no standalone erase/retention/consent workflow; provider/maps receive location |
| Writes | COMMUNITY_WRITES_ENABLED=false, actual503 verified | Flag is operational gate, not authorization. Enabling it without moderation/abuse controls is unsafe |
| Secrets | Ignored root .env, no tracked local env; required values configured only as booleans; current HEAD scan found no configured connection values | Not a full historical secret-forensics certification; hosting secrets/rotation/restricted DB role unverified |
| Startup | Lazy DB, bounded pool/query/operation, clean shutdown, PORT support | No public TLS/origin/secret validation or externally observed deployment |
| Provider | Operator-configured HTTPS endpoint, bounded timeout/cache, no user-provided URL | No commercial plan/SLA or contract for startup use; no retry/single-flight; attribution needs link |

## Product safety and launch conditions

SFT-01 permits stale previously valid advice to remain on screen. UNKNOWN server semantics and STOP guidance are correct when recomputed; client lifecycle must be corrected before worker pilot. Engine thresholds remain explicitly unvalidated, with no health/clothing/acclimatization or measured WBGT. Qualified occupational/clinical and regional-language review are non-negotiable pilot gates, not an invitation to invent new medical rules.

Commercial weather terms and data attribution require owner review: [Open-Meteo terms](https://open-meteo.com/en/terms) restrict the free API to noncommercial use; [licence](https://open-meteo.com/en/licence) requires attribution/link. This is a product dependency review, not legal advice or a purchase authorization. Repository ownership/licensing is undecided; no license was created.

Recommended controls before rollout: fix SFT-01; plan least privilege; review SEC-02 patch; keep writes off until authenticated moderation, isolated write tests and consent/abuse policy; independently verify approved staging TLS/CORS/CSP/proxy, secrets, alerts and restore. No public deployment was attempted.

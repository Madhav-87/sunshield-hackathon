> **Historical report:** this assessment records the obsolete root frontend checkout (`frontend-integration`, baseline `8429fcbb0aa795dc4808ed0fac588290df6979b3`). It is preserved for audit history and does not describe the current integration branch.

# SunShield Release QA Report

**Review date:** 21 November 2026 (IST)
**Branch:** `feature/release-qa`
**Release status:** Not ready for release verification

## Scope and evidence

This report records only checks performed against the files available in the current workspace. The repository has no commit on `main`; project files are untracked. `feature/release-qa` was created from this unborn state. The only committed project baseline available is `origin/frontend-integration` at `8429fcbb0aa795dc4808ed0fac588290df6979b3`; it is not the current working tree's complete integrated release commit.

The PRD, SRD, TRD, `API_CONTRACT.md`, integration handoff, prior QA/security reports, consolidated backend, and Developer A's rewritten frontend are absent. Backend HTTP behavior, public deployments, hosting account access, external weather, and database integrations were not verified. Previously reported test totals remain reports, not independently reproduced results.

## Findings

### P0 — Unescaped HTML rendering of dynamic content

`src/App.tsx` renders generated markup through `dangerouslySetInnerHTML`. `src/legacyMarkup.ts`'s `html` template helper inserts values with `String(...)` and performs no HTML escaping. Facility names and HeatLab recommendation text can originate from API responses and are interpolated into markup. This creates a cross-site scripting path if those values contain HTML. Reproduction for the frontend owner: serve a facility response whose `name` contains harmless markup such as `<img src=x onerror=alert(1)>`, open Safe Zones, and observe whether the markup becomes an element; repeat with a recommendation string in HeatLab after the simulation API is integrated. Do this only in a local isolated environment. Replace this rendering path with React text nodes or correctly context-escaped output before release. This affects the current root frontend; the integration copy also contains the same pattern.

### P1 — Real HeatLab request is not implemented

`src/services/simulation.service.ts` returns a demo-only unknown result in mock mode and rejects with `ContractUnavailableError` in API mode. The frontend README says it will not send `POST /simulation/evaluate` before the finalized API contract is available. The required real-engine scenarios and expected advisory results are therefore unverified and are not currently demonstrable from this frontend.

### P1 — Release lint check fails

`npm run lint` was executed on 21 November 2026 and failed with one ESLint error: `frontend-integration/tests/safezone.routes.test.ts:44:33`, `_availabilityStatus` is assigned but unused (`@typescript-eslint/no-unused-vars`). No source changes were made to silence the finding.

## Deployment and environment review

- No Vercel configuration, Render service configuration, GitHub Actions workflow, or root `docs/` release documentation was present at review time.
- The current Vite config contains no SPA rewrite or security header configuration. Vercel behavior has not been tested.
- The root application is a frontend package. The nested `frontend-integration/package.json` is Safe Zones database work and has no consolidated Express entry point, `build`, `start`, or `typecheck` scripts. Do not treat it as the authoritative backend deployment package.
- The nested package declares Node `>=24 <25`; the observed local runtime was Node `v22.19.0` with npm `10.9.3`. No runtime compatibility check was executed under Node 24.
- The frontend environment example sets mock mode to true and a localhost API URL. A production API host is unknown. No deployment variables or secrets were configured or inspected.

## Verification run

| Check | Result |
|---|---|
| `npm run lint` (root frontend package) | Failed: one unused-variable error above |
| `npm run build` (root frontend package) | Passed on 21 November 2026; TypeScript build and Vite production bundle completed |
| `node --check scripts/api-smoke.mjs` | Passed |
| `node scripts/api-smoke.mjs` | Failed to connect for `/health`, `/weather`, and `/safe-zones` at default `http://localhost:8000/api/v1`; confirms no local API was listening |
| Backend tests/build/API smoke tests | Not run; consolidated backend absent |
| Browser/viewport acceptance | Not run; no browser session or integrated frontend available |
| HeatLab real-engine acceptance | Not run; API contract and backend absent |
| Dependency audit | Not run |
| Public deployment / CORS / CSP / deep links | Not run |

## Release recommendation

Do not approve a public release from this checkout. Resolve the P0 rendering issue in the frontend owner's integrated rewrite, provide the agreed integrated commit and API contract, then run the checks in the release checklist. No production or test service was contacted and no deployment was performed.

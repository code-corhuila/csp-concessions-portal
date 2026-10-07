# csp-concessions-portal

> concessions bounded context: web UI (remote)

Part of the **Cinesync Platform** distributed system — team `cinesync-platform`, Group 1.
Governance and documentation live in [`csp-docs`](https://github.com/code-corhuila/csp-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `csp-docs`.

## Run and test

Node 22 LTS or 24.

```
npm ci
npm start        # serve the portal on http://localhost:4204
npm run lint
npm test         # Karma + Jasmine
npm run build
```

The portal is a remote of the shell (`csp-front`) and exposes two federated entries (ADR-027 in `csp-docs`):

| Entry | Routes | Area | Role | Shell mount |
|---|---|---|---|---|
| `./snack-routes` | `SNACK_ROUTES` | Snack selection of the purchase flow | `CLIENT` | `/booking/snack-selection` (pending in `csp-front`) |
| `./routes` | `CONCESSIONS_ROUTES` | Products, combos, orders and inventory | `ADMIN` | `/admin/concessions` |

It creates no HTTP client of its own: inside the shell it would use the shell's.

## Cut 2: synthetic catalog (HU-FE-CONCESSIONS-001)

There is no `csp-concessions-api` in Cut 2. The snack selection reads a dataset burned into
`src/app/concessions/data/synthetic-catalog.ts` (prices in integer cents; not real records) through
`SyntheticCatalogService`, which lists only the items whose status is `PUBLISHED`. The order lives in memory
(`OrderDraftService`); a page reload empties it. Run on its own, `/` opens `/booking/snack-selection`
and `/admin/concessions/*` serves the administration placeholders. The look follows
`12-ux-ui/design-system.md` of `csp-docs`.

## Local deployment

Copy `.env.example` to `.env` and run:

```bash
docker network create csp-frontend
docker compose -f deploy/compose.yml up --build
```

The optional `PORT` variable controls the host port mapped to the portal. The
shared `csp-frontend` network is external so the portal can connect to the
platform gateway.
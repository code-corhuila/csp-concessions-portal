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

The portal is a remote of the shell (`csp-front`) and exposes two federated entries, one per area
and role (ADR-027 in `csp-docs`). It creates no HTTP client of its own: inside the shell it would use
the shell's.

| Entry | Routes | Area | Role | Shell mount |
|---|---|---|---|---|
| `./snack-routes` | `SNACK_ROUTES` | Snack selection of the purchase flow | `CLIENT` | `/booking/snack-selection` (not mounted yet in `csp-front`) |
| `./routes` | `CONCESSIONS_ROUTES` | Products, combos, orders and inventory | `ADMIN` | `/admin/concessions` |

## Cut 2: synthetic catalog (HU-FE-CONCESSIONS-001)

There is no `csp-concessions-api` in Cut 2. The portal shows a dataset burned into
`src/app/concessions/data/synthetic-catalog.ts`, with prices in integer cents. These are not real
records. `SyntheticCatalogService` lists only the items whose status is `PUBLISHED`.

| Item | Type | Price (cents) | Status | Listed |
|---|---|---|---|---|
| Popcorn (large) | Product | 500 | `PUBLISHED` | yes |
| Nachos with cheese | Product | 350 | `PUBLISHED` | yes |
| Limited edition combo | Product | 990 | `INACTIVE` | no |
| Combo Familiar | Combo | 1200 | `PUBLISHED` | yes |

The order lives in memory (`OrderDraftService`) and a page reload empties it. A quantity must be a
positive integer.

| Route | Behaviour |
|---|---|
| `/booking/snack-selection` | Product and combo cards, an add button on each, and the order with quantities, subtotals and total. An empty order says so |
| `/admin/concessions/*` | Administration screens: placeholders in Cut 2 |

Run on its own, `/` opens `/booking/snack-selection`. The screen is in Spanish and the look follows
`12-ux-ui/design-system.md` and the mockup of `csp-docs`.

## Local deployment

Copy `.env.example` to `.env` and run:

```bash
docker network create csp-frontend
docker compose -f deploy/compose.yml up --build
```

The optional `PORT` variable controls the host port mapped to the portal. The
shared `csp-frontend` network is external so the portal can connect to the
platform gateway.
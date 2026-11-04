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
| `./routes` | `CONCESSIONS_ROUTES` | Products, combos and inventory (orders is a placeholder) | `ADMIN` | `/admin/concessions` |

## The catalog of the snack selection (HU-CONCESSIONS-004)

The snack selection reads its catalog from `csp-concessions-api` through the gateway: `SnackCatalogService` loads every
page of `GET /products` and `GET /combos` (100 at a time) when the page opens and lists only the items whose status is
`PUBLISHED`; the API already hides the others from a caller without the write permission, and the filter keeps that
rule. Prices are integer cents. If the API cannot be reached, the page says that the catalog is not available and lists
nothing. The standalone run has no token, so the API answers 401 until the portal runs inside the shell.

The order lives in memory (`OrderDraftService`) and a page reload empties it. A quantity must be a
positive integer.

| Route | Behaviour |
|---|---|
| `/booking/snack-selection` | Published product and combo cards of the API, an add button on each, and the order with quantities, subtotals and total. An empty order says so; a failed load says that the catalog is not available |
| `/admin/concessions/products` | Table of the products of the API and form for a new one (saved as a draft with no stock); publish, deactivate and reactivate, each a `PATCH` to `csp-concessions-api` |
| `/admin/concessions/combos` | Combos with their components; a new combo takes published products in positive whole quantities |
| `/admin/concessions/inventory` | Stock and last reason per product, an adjustment form that never leaves negative stock, and the movements |
| `/admin/concessions/orders` | Placeholder |

The products of the administration come from `csp-concessions-api` through the gateway (`AdminProductsStore` lists,
creates and changes their status with the shell's authenticated client; standalone runs have no token, so the API answers
401). The combos and the inventory movements are still in memory (`AdminCombosStore`, `AdminInventoryStore`) and a page
reload restores them; the stock adjusted in the inventory screen is only shown, it is not sent to the API.

Run on its own, `/` opens `/booking/snack-selection`. The screen is in Spanish and the look follows
`12-ux-ui/design-system.md` and the mockup of `csp-docs`.

## Local deployment

Copy `.env.example` to `.env` and run:

```bash
docker network create csp-frontend
docker compose -f deploy/compose.yml up --build
```

The optional `PORT` variable controls the host port mapped to the portal. The shell loads this portal from
another origin, so the container renders its CORS rule from `CORS_ALLOWED_ORIGIN_REGEX` when it starts (ADR-026) and
refuses to start without it; the development value is `^http://localhost:420[0-5]$` and `deploy/compose.yml` sets it
when it is not defined. CI builds the image and checks that it answers the allowed origin, stays silent for any other
and does not start without the variable. The
shared `csp-frontend` network is external so the portal can connect to the
platform gateway.
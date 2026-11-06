# Changelog

All notable changes of `csp-concessions-portal` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/). A release is a `release/<version>` branch cut from `main` and filled with the commits of `qa`,
re-applied with `git cherry-pick -x` (numerals 6.2.3, 10 and 11 of the course norm); it reaches `main` by pull request, never by merging `qa`,
and is tagged `v<version>` once it is merged.

## [Unreleased]

## [3.0.0] - 2026-11-04

Release 3.0.0 of the Concessions portal, aligned with the 3.0.0 of the platform: HU-CONCESSIONS-004 (the snack selection reads the real catalog and sends the order with the reservation), HU-CONCESSIONS-006 (the administration products screen works against the real Concessions API through the gateway), HU-CONCESSIONS-002 (the administration combos screen) and HU-CONCESSIONS-003 and HU-CONCESSIONS-007 (the administration inventory screen: adjustments and movement history), promoted from `qa` to `main`.

### Changed
- HU-CONCESSIONS-002: the administration combos screen lists and creates combos through `csp-concessions-api` instead of an in-memory list: it reads every page of `GET /combos`, saves a new combo with `POST /combos` (as a draft) and publishes it with `PATCH /combos/{comboId}`, each with an `Idempotency-Key`. When the API refuses to publish (a component is not published), the draft stays in the list and the reason is shown. The synthetic combo is removed.
- HU-CONCESSIONS-003 and HU-CONCESSIONS-007: the administration inventory screen sends each stock adjustment to `POST /stock/adjust` (a positive quantity is a receipt, a negative one a withdrawal) with an `Idempotency-Key`, reads the balances and the history again afterwards, and lists the movements of `GET /stock/movements`, every page, newest first. The free-text reason is removed because the contract has none: the movement shows the type the API records (`Entrada` or `Ajuste`). The synthetic movements and the in-memory stock are removed.
- HU-CONCESSIONS-004: the snack selection of the client lists the published products and combos of `csp-concessions-api` instead of the synthetic catalog, reading every page of `GET /products` and `GET /combos`, and says that the catalog is not available when the API fails. The synthetic catalog is removed.
- HU-CONCESSIONS-004: the snack selection sends the order to `POST /orders` with its `Idempotency-Key` (the same while the draft does not change) and the `reservationId` of the address when it is a UUID, shows the reason when the API refuses it and keeps the draft; with a reservation it offers "Omitir" and "Continuar al pago" to `/booking/checkout/<id>`.
- HU-CONCESSIONS-006: the administration products screen lists, creates and changes the status of products through `csp-concessions-api` instead of an in-memory list: publish, deactivate and reactivate (`PATCH /products/{productId}` with an `Idempotency-Key`), the reason of a refused change is shown, and an inactive product offers "Reactivar". The combos and inventory screens load the same products; their own data and the stock adjustments stay in memory. The standalone run now provides `HttpClient` (without the token of the shell). The synthetic administration products are removed.

### Fixed
- The container healthcheck (`deploy/Dockerfile` and `deploy/compose.yml`) calls `http://127.0.0.1/health` instead of `http://localhost/health`: inside the container `localhost` resolves first to `::1`, nginx listens on IPv4 only, and Docker reported the portal as `unhealthy` while it served traffic ([#50](https://github.com/code-corhuila/csp-concessions-portal/issues/50)).

## [2.0.0] - 2026-10-08

MVP 2 (Cut 2), first release of the portal. Story HU-FE-CONCESSIONS-001
([#6](https://github.com/code-corhuila/csp-concessions-portal/issues/6)): the client browses products and combos and builds the snack
order, and the administrator manages products, combos and inventory, all over a dataset shipped inside the portal.

### Added

- Federated remote of the shell, standalone runtime and the mockup look (HU-UI-001,
  [csp-docs#1](https://github.com/code-corhuila/csp-docs/issues/1)). ([#17](https://github.com/code-corhuila/csp-concessions-portal/issues/17))
- Synthetic catalog typed in cents that lists only the `PUBLISHED` products and combos.
  ([#18](https://github.com/code-corhuila/csp-concessions-portal/issues/18))
- Order draft with quantities (positive integers only) and the total computed in cents.
  ([#19](https://github.com/code-corhuila/csp-concessions-portal/issues/19))
- Snack selection screen for the customer step (`./snack-routes`, mounted by the shell at `/booking/snack-selection`).
  ([#20](https://github.com/code-corhuila/csp-concessions-portal/issues/20))
- Two federated entries, one per role (ADR-027, [csp-docs#103](https://github.com/code-corhuila/csp-docs/issues/103)): `./snack-routes` for the
  customer and `./routes` for the administration. ([#24](https://github.com/code-corhuila/csp-concessions-portal/issues/24))
- Administration area (`/admin/concessions`, role `ADMIN`) with its layout and navigation
  ([#31](https://github.com/code-corhuila/csp-concessions-portal/issues/31)) and three screens over a synthetic store: products
  ([#28](https://github.com/code-corhuila/csp-concessions-portal/issues/28)), inventory with auditable adjustments that reject zero and
  negative stock ([#30](https://github.com/code-corhuila/csp-concessions-portal/issues/30)) and combos built from published products
  ([#29](https://github.com/code-corhuila/csp-concessions-portal/issues/29)).
- CI workflow and container files (`deploy/Dockerfile`, `deploy/nginx.conf`, `deploy/compose.yml`, health endpoint `/health`, network
  `csp-frontend`).
- Specs for the catalog, the order draft, the screens and the routes; 68 specs, 100% of lines.

### Fixed

- The shell can load the portal when it runs as a container: nginx now answers `Access-Control-Allow-Origin` for the origins allowed by
  `CORS_ALLOWED_ORIGIN_REGEX`, which the container renders when it starts (ADR-026, amended on 2026-10-08), and CI builds the image and checks
  it. ([#43](https://github.com/code-corhuila/csp-concessions-portal/issues/43))

### Known limits

- The administration area has no authorization of its own: the shell mounts it behind its role guard, which is a client-side check on the session of the auth portal and not a security boundary until a backend enforces it.
- There is no backend: the dataset is burned into the portal; the calls to `csp-concessions-api` come in a later cut.
- Open follow-ups, not in this release: guard the administration routes inside the portal
  ([#12](https://github.com/code-corhuila/csp-concessions-portal/issues/12); the shell already guards them), move the HTTP client and the
  idempotency key behind the shared contract ([#11](https://github.com/code-corhuila/csp-concessions-portal/issues/11)), import the shared error
  contract from `csp-front` ([#8](https://github.com/code-corhuila/csp-concessions-portal/issues/8)), and keep the hardening headers on the health endpoint
  ([#14](https://github.com/code-corhuila/csp-concessions-portal/issues/14)).
- No integration or contract tests against an API: the portal does not call one yet.

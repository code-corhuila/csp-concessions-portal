# Changelog

All notable changes of `csp-concessions-portal` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/). A release is a `release/<version>` branch cut from `main` and filled with the commits of `qa`,
re-applied with `git cherry-pick -x` (numerals 6.2.3, 10 and 11 of the course norm); it reaches `main` by pull request, never by merging `qa`,
and is tagged `v<version>` once it is merged.

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

- There is no backend: the dataset is burned into the portal; the calls to `csp-concessions-api` come in a later cut.
- Open follow-ups, not in this release: guard the administration routes inside the portal
  ([#12](https://github.com/code-corhuila/csp-concessions-portal/issues/12); the shell already guards them), move the HTTP client and the
  idempotency key behind the shared contract ([#11](https://github.com/code-corhuila/csp-concessions-portal/issues/11)), import the shared error
  contract from `csp-front` ([#8](https://github.com/code-corhuila/csp-concessions-portal/issues/8)), and keep the hardening headers on the health endpoint
  ([#14](https://github.com/code-corhuila/csp-concessions-portal/issues/14)).
- No integration or contract tests against an API: the portal does not call one yet.

# Changelog

## 0.4.0 — 2026-05-23

### Changed (BREAKING)

- **Connection moved out of this package.** The concrete
  `CalmConnection` class and the `DEFAULT_CALM_SERVICE_ROUTES` map are
  removed. Connection construction (auth strategy, transport, URL
  assembly) is now a server-level concern — see
  `@mcp-abap-adt/calm-server`'s `connection/` module. This package now
  ships only the API surface (`CalmClient`, `core/*` resource
  primitives, OData helpers, error types) and depends on the
  `ICalmConnection` interface from `@mcp-abap-adt/interfaces`.

  Migration: build an `ICalmConnection` (e.g. via `createCalmConnection`
  from `@mcp-abap-adt/calm-server`, or your own implementation) and pass
  it to `new CalmClient(connection)`.

- **`toCalmApiError` removed; replaced by `calmErrorFromBody`.** The old
  helper was axios-coupled (read `error.response`). The new
  transport-agnostic `calmErrorFromBody(status, body)` builds the same
  `CalmApiError` from an already-extracted status + parsed body, so a
  `fetch`-based connection produces the identical error contract.

- **`axios` dropped as a runtime dependency.** The package no longer
  performs HTTP itself.

### Removed

- `CalmConnection`, `CalmAuthMode`, `ICalmConnectionOptions` exports.
- `DEFAULT_CALM_SERVICE_ROUTES`, `CalmServiceRouteMap` exports.

## 0.3.0 — 2026-05-13

### Fixed (BREAKING)

- **`CalmTask.list` / `CalmFeature.list`** now require `projectId` as
  the first positional argument; the optional `ODataQuery` is the
  second. Both endpoints (`/tasks` and `/Features`) are exposed by
  Cloud ALM as Spring controllers with `@RequestParam UUID projectId`,
  so `projectId` must travel as a plain HTTP query parameter — putting
  it into `$filter` returns HTTP 400. See issue #3 (extends the
  pattern fixed for `listDeliverables` / `listWorkstreams` in #1).
- **`CalmFeature.getByDisplayId` / `getByDisplayIdWithExpand`** now
  require `projectId` as the first positional argument. Both delegate
  through `listFeatures` and inherit the same contract; displayId
  values like `6-123` are themselves project-scoped, so this matches
  the underlying data model.

  Migration:

  ```ts
  // before (0.2.x)
  await client.getTasks().list(
    ODataQuery.new().filter("projectId eq 'P1'").top(20),
  );
  await client.getFeatures().getByDisplayId('6-123');

  // after (0.3.0)
  await client.getTasks().list('P1', ODataQuery.new().top(20));
  await client.getFeatures().getByDisplayId('P1', '6-123');
  ```

  URLs produced: `/tasks?projectId=P1&$top=20`,
  `/Features?projectId=P1&$filter=displayId%20eq%20'6-123'&$top=1`.

### Added

- **`src/core/_internal/url.ts`** — shared `odataAfterProjectId`
  helper now used by all four `?projectId=<uuid>` endpoints
  (`/tasks`, `/Features`, `/deliverables`, `/workstreams`). Replaces
  the inline duplicate that was added in 0.2.0.

## 0.2.0 — 2026-05-13

### Fixed (BREAKING)

- **`CalmTask.listDeliverables` / `listWorkstreams`** now require
  `projectId` as the first positional argument; the optional
  `ODataQuery` becomes the second. The SAP Cloud ALM Tasks service
  exposes these endpoints with `@RequestParam UUID projectId`, so
  `projectId` must travel as a plain HTTP query param — placing it
  into the OData `$filter` does NOT satisfy the server (the sandbox
  sometimes tolerates the missing param and returns an empty page; a
  real tenant 400s). Discovered against the public api.sap.com
  sandbox via `@mcp-abap-adt/calm-server`'s integration probe. See
  issue #1.

  Migration:

  ```ts
  // before (0.1.x)
  await client.getTasks().listDeliverables(
    ODataQuery.new().filter("projectId eq 'P1'"),
  );

  // after (0.2.0)
  await client.getTasks().listDeliverables('P1');
  // optional OData query is layered after projectId:
  await client.getTasks().listDeliverables('P1', ODataQuery.new().top(5));
  ```

  Same migration for `listWorkstreams`. URLs produced:
  `/deliverables?projectId=P1` (with `&$top=5` etc. layered on).

## 0.1.0 — 2026-04-24

Initial usable release — all 9 Cloud ALM services are covered with unit-tested
client handlers. Integration testing against a live tenant is the next step.

### Added

- **`CalmConnection`** — concrete `ICalmConnection` on axios. OAuth2 + XSUAA
  (via injected `ITokenRefresher`) and sandbox (static API key) modes, 401/403
  retry, OData/HTTP/Network error translation via `CalmApiError`.
- **`CalmClient`** factory with 9 getters: `getFeatures`, `getDocuments`,
  `getTestCases`, `getHierarchy`, `getAnalytics`, `getProcessMonitoring`,
  `getTasks`, `getProjects`, `getLogs`.
- **Resource handlers** (OData v4 where applicable):
  - `CalmFeature` — CRUD, `getByDisplayId`, `$expand`, external references,
    priorities/statuses lookups
  - `CalmDocument` — CRUD, types/statuses lookups
  - `CalmTestCase` — CRUD, activities, actions (wire field `parent_ID`)
  - `CalmHierarchy` — CRUD, `$expand`
  - `CalmAnalytics` (read-only) — 17 named endpoints + `queryDataset`
  - `CalmProcessMonitoring` (read-only) — 5 list + 2 getById
  - `CalmTask` — CRUD, comments, references, workstreams, deliverables
  - `CalmProject` — list/get/create, timeboxes, team members, programs
  - `CalmLog` — domain-specific REST (not OData): `get`, `post` with
    `logsFilters[serviceId]` bracket-notation query
- **`ODataQuery`** builder with RFC 3986 filter encoding, canonical param
  order, chainable API (`filter/select/expand/orderby/top/skip/count/search`).
- **`CalmApiError`** with typed codes (`ODATA_ERROR`, `HTTP_ERROR`,
  `NOT_FOUND`, `JSON_PARSE`, `NETWORK`, `UNKNOWN`).
- **`DEFAULT_CALM_SERVICE_ROUTES`** — seed route map for the 9 services,
  fully override-able via `CalmConnection({ serviceRoutes })`.
- **Docs**: `docs/ARCHITECTURE.md`, `docs/TESTING.md` (integration test data
  requirements checklist).

### Requires

- `@mcp-abap-adt/interfaces` ^7.1.0 (for `ICalmConnection` / `CalmService`)

### Notes

- 13 unit-test suites, 109 tests, no network calls.
- Integration tests against a live Cloud ALM tenant deferred to 0.2.0.

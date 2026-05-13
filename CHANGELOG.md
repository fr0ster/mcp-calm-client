# Changelog

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

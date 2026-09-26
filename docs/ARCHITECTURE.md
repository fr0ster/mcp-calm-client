# Architecture

## Purpose

`@mcp-abap-adt/calm-client` — TypeScript client library for SAP Cloud ALM OData/REST APIs. It is **not** an MCP server; it is a transport-agnostic library that resource-specific classes consume through a single narrow contract (`ICalmConnection`).

The functional scope was migrated from the Rust project `sap-cloud-alm-odata-mcp`. The architecture is a mirror of `@mcp-abap-adt/adt-clients` (factory + core-per-resource + interface isolation).

## Design principles

1. **Interface isolation.** Resource clients depend on `ICalmConnection` only (from `@mcp-abap-adt/interfaces-calm`). This package ships no concrete connection (`CalmConnection` moved out in 0.4.0); the consumer supplies one, e.g. `createCalmConnection` from `@mcp-abap-adt/calm-server`.
2. **Auth is not here.** OAuth2 (XSUAA `client_credentials`) and sandbox API-key belong to the `ICalmConnection` implementation, which typically takes an `ITokenRefresher` from `@mcp-abap-adt/auth-broker`. No file this package publishes imports an auth package or an auth contract, so `@mcp-abap-adt/interfaces-auth` is not a peer dependency.
3. **No hardcoded endpoints as a single source of truth.** Service routes have sensible defaults seeded from the Rust source, but every deployment can override them in its connection implementation.
4. **No MCP-server-specific code.** No MCP tools, no stdio transport, no CLI. The library is consumable from any TS runtime.
5. **Errors are one type.** Any failure surfaces as `CalmApiError` with a typed `code`. OData error envelopes, plain HTTP errors and network errors are all normalized.

## Layered structure

```
┌──────────────────────────────────────────────────────────────────┐
│ Consumer code (an MCP server, a CLI, a web app, …)               │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ CalmClient  (factory: getFeatures(), getDocuments(), ...)        │
└──────────────────────────────────────────────────────────────────┘
                               │ ICalmConnection
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ core/{feature,document,task,...}  (handler + CRUD + types)       │
└──────────────────────────────────────────────────────────────────┘
                               │ ICalmConnection.makeRequest()
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ ICalmConnection implementation — the consumer's, not this        │
│ package's (transport, auth header, 401 retry, service routes;    │
│ e.g. @mcp-abap-adt/calm-server, ITokenRefresher from auth-broker)│
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                       SAP Cloud ALM APIs
```

## Package boundaries

| Package | Role |
|---|---|
| `@mcp-abap-adt/interfaces-calm` | Cloud ALM's own contracts: `ICalmConnection`, `CalmService`, `CALM_SERVICES`, `ICalmRequestOptions`, `ICalmResponse`. |
| `@mcp-abap-adt/interfaces-auth` | `ITokenRefresher` — used by connection implementations and by this repository's integration-test connection; not a peer dependency. |
| `@mcp-abap-adt/interfaces-utils` | `ILogger`. |
| `@mcp-abap-adt/auth-providers` | `ClientCredentialsProvider` (XSUAA OAuth2) and other token providers. |
| `@mcp-abap-adt/auth-stores` | `XsuaaServiceKeyStore`, `XsuaaSessionStore`, `SafeXsuaaSessionStore`. |
| `@mcp-abap-adt/auth-broker` | `AuthBroker` (3.x: `{ sessionStore, serviceKeyStore?, provider }`) — orchestrates provider + stores, creates `ITokenRefresher`. |
| **`@mcp-abap-adt/calm-client`** (this) | `CalmClient`, `calmErrorFromBody`, `core/*` resource clients, `ODataQuery`, `CalmApiError`. |

No auth package — implementation or contract — is imported by the published code. A consumer wires `AuthBroker` once and injects the resulting `ITokenRefresher` into its own connection.

## Directory layout (current)

```
src/
  odata/          ODataQuery, ODataCollection / error types
  errors/         CalmApiError + typed CALM_API_ERROR_CODES
  connection/
    parseCalmError.ts     calmErrorFromBody(status, body) → CalmApiError
  clients/
    CalmClient.ts         factory (populated as core/* lands)
  core/
    feature/              (reference implementation, next)
    document/
    task/
    project/
    testCase/
    hierarchy/
    analytics/
    processMonitoring/
    log/
  utils/
  __tests__/
    unit/                 pure-function tests (no I/O)
    integration/          live-tenant tests (see docs/TESTING.md)
  index.ts                public surface
```

## URL composition

A Cloud ALM request URL is built from three parts:

```
{baseUrl}{apiPrefix}{serviceRoute}{requestPath}?{queryString}
```

- `baseUrl` — tenant host, e.g. `https://<tenant>.eu10.alm.cloud.sap` (OAuth2) or `https://sandbox.api.sap.com/SAPCALM` (sandbox).
- `apiPrefix` — `/api` for OAuth2 mode, empty for sandbox. Chosen by the connection implementation.
- `serviceRoute` — resolved by the connection implementation from the `CalmService` the handler names (e.g. `/calm-features/v1`).
- `requestPath` — set by the resource client (e.g. `/Features({uuid})`).
- `queryString` — OData query string from `ODataQuery.toQueryString()` (or plain `params` for REST clients).

**Rule — `url` vs `params`**: OData query strings are RFC 3986 pre-encoded by `ODataQuery.toQueryString()` and must be **concatenated into `url`**, never passed as axios `params` (axios would re-encode and corrupt the already-encoded `$filter`/`$search` values). `ICalmRequestOptions.params` is reserved for plain REST `key=value` pairs (strings/numbers/booleans) where axios's default encoding is safe — used only by Tasks, Projects, Logs clients.

## Auth flow (in the connection implementation)

Shown for orientation; none of it runs in this package.

```
AuthBroker({ sessionStore, serviceKeyStore, provider })   (auth-broker 3.x)
   ├── XsuaaServiceKeyStore              → UAA credentials for the destination
   ├── provider (factory or instance)    → IRefreshableTokenProvider, e.g. ClientCredentialsProvider
   ├── XsuaaSessionStore                 → persists token (+ refresh token, never the client secret)
   └── createTokenRefresher(destination) → ITokenRefresher { getToken, refreshToken }
                                                │
                                                ▼
                                       ICalmConnection implementation
                                           ├── getToken()     (each request)
                                           └── refreshToken() (on 401/403 — a new token since auth-broker 3.0.0)
```

The **sandbox mode** bypasses this entirely: the connection sends an `APIKey` header and performs no token refresh.

## Error model

All errors thrown from resource clients (and, by convention, from a connection that uses `calmErrorFromBody`) are `CalmApiError` instances with:

- `code: CalmApiErrorCode` — one of `ODATA_ERROR`, `HTTP_ERROR`, `NOT_FOUND`, `JSON_PARSE`, `NETWORK`, `UNKNOWN`. `NOT_FOUND` is client-fabricated (e.g. `getByDisplayId` returned an empty collection) and distinct from transport-level `HTTP_ERROR` with status 404.
- `status?: number` — HTTP status if available.
- `serviceCode?: string` — OData-level error code (`error.code`).
- `body?: unknown` — raw response body for diagnostics.
- `cause?: unknown` — underlying error (axios error, JSON.parse error, …).

Classification rule (see `src/connection/parseCalmError.ts`):

1. If the response body has shape `{ error: { code: string, message: string } }` → `fromOData`.
2. Else if there is an HTTP response → `fromHttp`.
3. Else (no response → network error) → `fromNetwork`.

## 401/403 retry (in the connection implementation)

Only in OAuth2 mode with a `tokenRefresher`:

1. First attempt fails with 401 or 403.
2. `tokenRefresher.refreshToken()` is invoked. With auth-broker 3.x it forces a new token from the provider (`IRefreshableTokenProvider.refreshTokens()`); 2.x returned the cached token the server had just refused.
3. Request is retried **once**.
4. Any further failure surfaces as `CalmApiError`.

Sandbox mode does **not** retry — the API key is static.

## Resource client pattern (planned)

Each resource module (e.g. `core/feature/`) follows the ADT-eternal pattern:

```
core/feature/
  CalmFeature.ts       handler class, methods: list/get/create/update/delete/...
  types.ts             IFeatureConfig (camelCase public), IFeatureState,
                       IFeatureCreateParams (snake_case wire DTO)
  list.ts              low-level fn: (connection, query) → IODataCollection<Feature>
  get.ts
  create.ts
  update.ts
  delete.ts
  externalReferences.ts    sub-entity CRUD (Features specifically)
  index.ts             public re-exports
```

Handlers take only `ICalmConnection` in their constructor. Low-level `*.ts` functions are pure-enough to unit-test with a mock connection.

## Non-goals

- **No persistence/cache**: the library does not store entities locally.
- **No batch ($batch)**: not planned in 0.x — can be added as an optional wrapper later.
- **No live OData metadata parsing**: entity types are modeled statically in `types.ts` per resource.
- **No authentication logic**: OAuth2/XSUAA is entirely delegated.
- **No MCP integration**: consumers wrap this library into their own MCP server if desired.

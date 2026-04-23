# Architecture

## Purpose

`@mcp-abap-adt/calm-client` — TypeScript client library for SAP Cloud ALM OData/REST APIs. It is **not** an MCP server; it is a transport-agnostic library that resource-specific classes consume through a single narrow contract (`ICalmConnection`).

The functional scope was migrated from the Rust project `sap-cloud-alm-odata-mcp`. The architecture is a mirror of `@mcp-abap-adt/adt-clients` (factory + core-per-resource + interface isolation).

## Design principles

1. **Interface isolation.** Resource clients depend on `ICalmConnection` only (from `@mcp-abap-adt/interfaces`). The concrete `CalmConnection` is a convenience default; consumers may inject any implementation.
2. **Auth is delegated.** OAuth2 (XSUAA `client_credentials`) and sandbox API-key are handled by the existing ecosystem (`@mcp-abap-adt/auth-broker` + `auth-providers` + `auth-stores`) via the `ITokenRefresher` interface. The library never talks to `/oauth/token` itself.
3. **No hardcoded endpoints as a single source of truth.** Service routes have sensible defaults seeded from the Rust source, but every deployment can override them via `CalmConnection({ serviceRoutes })`.
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
│ CalmConnection  (axios + auth header + 401-retry + error map)    │
│        │                                                         │
│        ├── ITokenRefresher ──→ @mcp-abap-adt/auth-broker         │
│        │                           │                             │
│        │                           ├─ ClientCredentialsProvider  │
│        │                           ├─ XsuaaServiceKeyStore       │
│        │                           └─ XsuaaSessionStore          │
│        │                                                         │
│        ├── DEFAULT_CALM_SERVICE_ROUTES  (override-able)          │
│        └── toCalmApiError (OData / HTTP / Network → CalmApiError)│
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                       SAP Cloud ALM APIs
```

## Package boundaries

| Package | Role |
|---|---|
| `@mcp-abap-adt/interfaces` | Shared contracts: `ICalmConnection`, `CalmService`, `ICalmRequestOptions`, `ICalmResponse`, `ITokenRefresher`, `ILogger`. |
| `@mcp-abap-adt/auth-providers` | `ClientCredentialsProvider` (XSUAA OAuth2) and other token providers. |
| `@mcp-abap-adt/auth-stores` | `XsuaaServiceKeyStore`, `XsuaaSessionStore`, `SafeXsuaaSessionStore`. |
| `@mcp-abap-adt/auth-broker` | `AuthBroker` — orchestrates provider + stores, creates `ITokenRefresher`. |
| **`@mcp-abap-adt/calm-client`** (this) | `CalmConnection`, `CalmClient`, `core/*` resource clients, `ODataQuery`, `CalmApiError`. |

No concrete auth implementation is imported by this library at runtime — only interfaces. Consumers wire `AuthBroker` once and inject the resulting `ITokenRefresher`.

## Directory layout (current)

```
src/
  odata/          ODataQuery, ODataCollection / error types
  errors/         CalmApiError + typed CALM_API_ERROR_CODES
  connection/
    CalmConnection.ts     concrete ICalmConnection impl
    serviceRoutes.ts      DEFAULT_CALM_SERVICE_ROUTES (seed, override-able)
    parseCalmError.ts     internal: toCalmApiError(axios/unknown) → CalmApiError
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
- `apiPrefix` — `/api` for OAuth2 mode, empty for sandbox. Override via `CalmConnection({ apiPrefix })`.
- `serviceRoute` — from `DEFAULT_CALM_SERVICE_ROUTES` (e.g. `/calm-features/v1`). Override via `CalmConnection({ serviceRoutes })`.
- `requestPath` — set by the resource client (e.g. `/Features({uuid})`).
- `queryString` — OData query string from `ODataQuery.toQueryString()` (or plain `params` for REST clients).

**Rule — `url` vs `params`**: OData query strings are RFC 3986 pre-encoded by `ODataQuery.toQueryString()` and must be **concatenated into `url`**, never passed as axios `params` (axios would re-encode and corrupt the already-encoded `$filter`/`$search` values). `ICalmRequestOptions.params` is reserved for plain REST `key=value` pairs (strings/numbers/booleans) where axios's default encoding is safe — used only by Tasks, Projects, Logs clients.

## Auth flow

```
AuthBroker
   ├── XsuaaServiceKeyStore.load(path)   → { uaaUrl, clientId, clientSecret }
   ├── ClientCredentialsProvider         → POSTs to {uaaUrl}/oauth/token
   ├── XsuaaSessionStore                 → persists JWT + expiration
   └── createTokenRefresher(destination) → ITokenRefresher { getToken, refreshToken }
                                                │
                                                ▼
                                       CalmConnection
                                           ├── getToken()     (each request)
                                           └── refreshToken() (on 401/403)
```

The **sandbox mode** bypasses this entirely: `CalmConnection({ apiKey })` sends an `APIKey` header and performs no token refresh.

## Error model

All errors thrown from `CalmConnection.makeRequest()` and from resource clients are `CalmApiError` instances with:

- `code: CalmApiErrorCode` — one of `ODATA_ERROR`, `HTTP_ERROR`, `NOT_FOUND`, `JSON_PARSE`, `NETWORK`, `UNKNOWN`. `NOT_FOUND` is client-fabricated (e.g. `getByDisplayId` returned an empty collection) and distinct from transport-level `HTTP_ERROR` with status 404.
- `status?: number` — HTTP status if available.
- `serviceCode?: string` — OData-level error code (`error.code`).
- `body?: unknown` — raw response body for diagnostics.
- `cause?: unknown` — underlying error (axios error, JSON.parse error, …).

Classification rule (see `src/connection/parseCalmError.ts`):

1. If the response body has shape `{ error: { code: string, message: string } }` → `fromOData`.
2. Else if there is an HTTP response → `fromHttp`.
3. Else (no response → network error) → `fromNetwork`.

## 401/403 retry

Only in OAuth2 mode with a `tokenRefresher`:

1. First attempt fails with 401 or 403.
2. `tokenRefresher.refreshToken()` is invoked (forces new token from provider).
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

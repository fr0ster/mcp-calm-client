# @mcp-abap-adt/calm-client

[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://stand-with-ukraine.pp.ua)

TypeScript client library for the **SAP Cloud ALM** OData/REST APIs. Provides
typed, testable handlers for all nine Cloud ALM services (Features, Documents,
Test Management, Process Hierarchy, Analytics, Process Monitoring, Tasks,
Projects, Logs) over a single narrow connection contract (`ICalmConnection`).

Authentication is delegated to the existing `@mcp-abap-adt` ecosystem
(`auth-broker` + `auth-providers` + `auth-stores`); this package never talks
to `/oauth/token` itself.

- **Status**: 0.1.0 — all nine services covered with unit tests (no live
  integration yet; see [docs/TESTING.md](docs/TESTING.md)).
- **Reference architecture**: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Installation

```bash
npm install @mcp-abap-adt/calm-client
```

Peer dependency:

```bash
npm install @mcp-abap-adt/interfaces  # ^7.1.0
```

For the auth pipeline (OAuth2 tenant mode):

```bash
npm install @mcp-abap-adt/auth-broker @mcp-abap-adt/auth-providers @mcp-abap-adt/auth-stores
```

## Quick start

### OAuth2 mode (production tenant)

```ts
import { AuthBroker } from '@mcp-abap-adt/auth-broker';
import { ClientCredentialsProvider } from '@mcp-abap-adt/auth-providers';
import {
  XsuaaServiceKeyStore,
  XsuaaSessionStore,
} from '@mcp-abap-adt/auth-stores';
import {
  CalmClient,
  CalmConnection,
  ODataQuery,
} from '@mcp-abap-adt/calm-client';

// 1. Load XSUAA service key and wire the auth broker.
const serviceKeyStore = new XsuaaServiceKeyStore('/path/to/keys');
const serviceKey = await serviceKeyStore.load('my-tenant');

const broker = new AuthBroker(
  {
    sessionStore: new XsuaaSessionStore(
      '/path/to/sessions',
      serviceKey.uaa.url,
    ),
    serviceKeyStore,
    tokenProvider: new ClientCredentialsProvider({
      uaaUrl: serviceKey.uaa.url,
      clientId: serviceKey.uaa.clientid,
      clientSecret: serviceKey.uaa.clientsecret,
    }),
  },
  'none',
);

// 2. Build the connection. It takes the token refresher from the broker;
//    the library never sees client credentials directly.
const connection = new CalmConnection({
  baseUrl: 'https://<tenant>.<region>.alm.cloud.sap',
  tokenRefresher: broker.createTokenRefresher('calm'),
});

// 3. Use the factory to access resource handlers.
const calm = new CalmClient(connection);

const features = await calm.getFeatures().list(
  ODataQuery.new()
    .filter("projectId eq 'P1' and statusCode eq 'OPEN'")
    .orderby('modifiedAt', 'desc')
    .top(50),
);
```

### Sandbox mode (SAP API Business Hub)

```ts
import { CalmClient, CalmConnection } from '@mcp-abap-adt/calm-client';

const connection = new CalmConnection({
  baseUrl: 'https://sandbox.api.sap.com/SAPCALM',
  apiKey: process.env.CALM_API_KEY!,
});

const calm = new CalmClient(connection);
const projects = await calm.getProjects().list();
```

In sandbox mode, `CalmConnection` sends an `APIKey` header, uses an empty
API prefix (no `/api`), and performs no token refresh — the API key is static.

## Services

| Method | Handler | Cloud ALM path | Notes |
|---|---|---|---|
| `getFeatures()` | `CalmFeature` | `/calm-features/v1` | CRUD, `getByDisplayId`, `$expand`, external references, priorities/statuses |
| `getDocuments()` | `CalmDocument` | `/calm-documents/v1` | CRUD, types/statuses |
| `getTestCases()` | `CalmTestCase` | `/calm-testmanagement/v1` | CRUD, activities + actions (wire field `parent_ID`) |
| `getHierarchy()` | `CalmHierarchy` | `/calm-processhierarchy/v1` | CRUD, `$expand` |
| `getAnalytics()` | `CalmAnalytics` | `/calm-analytics/v1/odata/v4/analytics` | Read-only, 17 named endpoints + `queryDataset` |
| `getProcessMonitoring()` | `CalmProcessMonitoring` | `/calm-processmonitoring/v1` | Read-only, 5 list + 2 getById |
| `getTasks()` | `CalmTask` | `/calm-tasks/v1` | CRUD, comments, references, workstreams, deliverables |
| `getProjects()` | `CalmProject` | `/calm-projects/v1` | list/get/create, timeboxes, team members, programs |
| `getLogs()` | `CalmLog` | `/calm-logs/v1` | Domain-specific REST (not OData): `get` / `post` |

All OData services accept an optional `ODataQuery` for filtering, sorting,
pagination, `$expand`, and `$count`. Logs uses a named-params query language
(provider, from/to, `logsFilters[serviceId]`, pagination).

## OData query builder

```ts
import { ODataQuery } from '@mcp-abap-adt/calm-client';

const q = ODataQuery.new()
  .filter("projectId eq 'P1'")
  .select(['uuid', 'title', 'statusCode'])
  .expand(['externalReferences'])
  .orderby('modifiedAt', 'desc')
  .top(25)
  .skip(50)
  .count();

q.toQueryString();
// '?$filter=projectId%20eq%20%27P1%27&$select=uuid,title,statusCode&$expand=externalReferences&$orderby=modifiedAt desc&$top=25&$skip=50&$count=true'
```

String values in filters use RFC 3986-compliant encoding (single quotes,
parentheses, `*`, `!` all percent-encoded — safer than the JS default).
Escape embedded single quotes by doubling them: `"name eq 'O''Reilly'"`.

## Errors

Every failure from `CalmConnection.makeRequest()` and from resource handlers
is a `CalmApiError`:

```ts
import { CalmApiError, CALM_API_ERROR_CODES } from '@mcp-abap-adt/calm-client';

try {
  await calm.getFeatures().get('missing-uuid');
} catch (err) {
  if (err instanceof CalmApiError) {
    switch (err.code) {
      case CALM_API_ERROR_CODES.NOT_FOUND:
      case CALM_API_ERROR_CODES.HTTP_ERROR:
        console.warn(`HTTP ${err.status}: ${err.message}`);
        break;
      case CALM_API_ERROR_CODES.ODATA_ERROR:
        console.warn(`OData ${err.serviceCode}: ${err.message}`);
        break;
      case CALM_API_ERROR_CODES.NETWORK:
        console.warn('Network failure:', err.cause);
        break;
    }
  }
}
```

Codes: `ODATA_ERROR`, `HTTP_ERROR`, `NOT_FOUND`, `JSON_PARSE`, `NETWORK`,
`UNKNOWN`. `NOT_FOUND` is fabricated client-side (e.g. `getByDisplayId`
returned an empty collection) — distinct from transport-level
`HTTP_ERROR` with status 404.

## Service route overrides

`CalmConnection` ships defaults seeded from the Rust reference implementation
(`mcp-abap-adt-interfaces/src/connection/CalmService.ts` +
`src/connection/serviceRoutes.ts`). Override for tenant-specific paths:

```ts
new CalmConnection({
  baseUrl: '…',
  tokenRefresher,
  serviceRoutes: {
    features: '/custom/features/v2',   // overrides default
    // others keep defaults
  },
});
```

`apiPrefix` can also be overridden if your tenant exposes Cloud ALM on a
non-standard prefix:

```ts
new CalmConnection({ baseUrl: '…', tokenRefresher, apiPrefix: '' });
```

## Testing

- Unit tests (`src/__tests__/unit/`) — pure-function, no I/O. 13 suites,
  109 tests.
  ```bash
  npm run test
  ```
- Integration tests — see [docs/TESTING.md](docs/TESTING.md) for the exact
  credentials and fixture data required per service before running against
  a live tenant or the SAP API Business Hub sandbox.

## Development (running from a fresh clone)

```bash
# 1. Install dependencies (including peer + dev deps from npm registry)
git clone <repo-url> && cd mcp-calm-client
npm install

# 2. Type-check without emitting (fast sanity check)
npm run test:check

# 3. Full build — cleans dist/, runs biome check, emits dist/
npm run build

# 4. Unit tests (no credentials required, always runs)
npm run test
# → 13 suites, 109 tests; integration suites self-skip with a single notice
```

### Running integration tests

1. Copy the env template: `cp .env.example .env`
2. Fill in either OAuth2 (`CALM_MODE=oauth2` + UAA credentials from your
   XSUAA service key) or sandbox (`CALM_MODE=sandbox` + `CALM_API_KEY`)
   variables. See [docs/TESTING.md](docs/TESTING.md) for the full
   mapping from BTP service-key JSON to env vars and the per-service
   fixture checklist (`CALM_TEST_*`).
3. `npm run test` — integration suites light up automatically.

`.env` is git-ignored; `.env.example` is the tracked template.

### Debug logging

Scope-gated via env flags (matches the `@mcp-abap-adt` ecosystem):

```bash
CALM_LOG_LEVEL=debug          # error | warn | info | debug (default info)
DEBUG_CALM_CONNECTORS=true    # CalmConnection retries, 401 refresh, URLs
DEBUG_CALM_LIBS=true          # resource-client internals
DEBUG_CALM_TESTS=true         # test execution progress
```

All logs go through `@mcp-abap-adt/logger` (`DefaultLogger`), so output
format is consistent with `@mcp-abap-adt/adt-clients` and the rest of
the ecosystem.

### Available npm scripts

| Script | What it does |
|---|---|
| `npm run build` | Clean → biome check → `tsc -p tsconfig.json` (emits `dist/`) |
| `npm run build:fast` | `tsc` only (skips biome) |
| `npm run clean` | Remove `dist/` and `*.tsbuildinfo` |
| `npm run lint` | Biome `--write` |
| `npm run lint:check` | Biome check only |
| `npm run format` | Biome formatter |
| `npm run test` | Jest (all suites, sequential) |
| `npm run test:check` | `tsc --noEmit -p tsconfig.test.integration.json` |

## Architecture

High level:

```
consumer → CalmClient → handlers → ICalmConnection → CalmConnection (axios)
                                                       ├─ ITokenRefresher ─→ AuthBroker
                                                       └─ DEFAULT_CALM_SERVICE_ROUTES
```

- Handlers depend only on `ICalmConnection` — the concrete `CalmConnection`
  is a convenience; swap in any implementation for tests or alternate
  transports.
- `CalmConnection` handles Bearer/APIKey injection, 401/403 retry, and
  OData/HTTP/Network error translation to `CalmApiError`.
- No MCP-server code in this library — consumers wrap it into their own
  MCP servers if desired.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full layered
description, URL composition rules, error model, and retry logic.

## License

MIT — see [LICENSE](LICENSE).

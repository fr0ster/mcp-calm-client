# @mcp-abap-adt/calm-client

[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://stand-with-ukraine.pp.ua)

TypeScript client library for the **SAP Cloud ALM** OData/REST APIs. Provides
typed, testable handlers for all nine Cloud ALM services (Features, Documents,
Test Management, Process Hierarchy, Analytics, Process Monitoring, Tasks,
Projects, Logs) over a single narrow connection contract (`ICalmConnection`).

This package ships no connection and does no authentication. It takes any
`ICalmConnection` (from `@mcp-abap-adt/interfaces-calm`) — the transport,
the Bearer or API-key header and the retry after a 401 are that
implementation's, for example `createCalmConnection` from
`@mcp-abap-adt/calm-server`. Nothing in the published code imports an auth
package.

- **Reference architecture**: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Installation

```bash
npm install @mcp-abap-adt/calm-client
```

One peer dependency — the contract every module imports:

```bash
npm install @mcp-abap-adt/interfaces-calm   # ^1.0.1  ICalmConnection, CalmService, ICalmRequestOptions, ICalmResponse
```

`@mcp-abap-adt/interfaces-auth` and `@mcp-abap-adt/interfaces-utils` are
**no longer peer dependencies** (they were `^1.2.0` and `^1.1.0` up to 0.7.0). No file this package publishes refers to either, so they
only told consumers which major to install — and a consumer on the
`auth-broker` 3 family, which needs `interfaces-auth` 2.1, got a conflicting
instruction. Whoever builds the connection declares the auth contract it
uses.

Not `@mcp-abap-adt/interfaces`: that facade is **deleted** as of its 52.0.0. npm still serves 51.0.0 to anyone pinned to it, and nothing further ships there — which is why a peer dependency on it had to go.

## Quick start

```ts
import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';
import { CalmClient, ODataQuery } from '@mcp-abap-adt/calm-client';

// Any ICalmConnection: calm-server's createCalmConnection, or your own.
declare const connection: ICalmConnection;

const calm = new CalmClient(connection);

const features = await calm.getFeatures().list(
  ODataQuery.new()
    .filter("projectId eq 'P1' and statusCode eq 'OPEN'")
    .orderby('modifiedAt', 'desc')
    .top(50),
);
```

### Tokens for an OAuth2 connection (auth-broker 3)

A connection that sends a Bearer token usually takes an `ITokenRefresher`
(`@mcp-abap-adt/interfaces-auth`). With `@mcp-abap-adt/auth-broker` 3.x,
`@mcp-abap-adt/auth-providers` 4.2+ and `@mcp-abap-adt/auth-stores` 1.2.3+
(the broker and the providers require Node.js 22 or 24):

```ts
import { AuthBroker } from '@mcp-abap-adt/auth-broker';
import { ClientCredentialsProvider } from '@mcp-abap-adt/auth-providers';
import {
  XsuaaServiceKeyStore,
  XsuaaSessionStore,
} from '@mcp-abap-adt/auth-stores';

const broker = new AuthBroker({
  sessionStore: new XsuaaSessionStore(
    '/path/to/sessions',
    'https://<tenant>.<region>.alm.cloud.sap',
  ),
  serviceKeyStore: new XsuaaServiceKeyStore('/path/to/keys'),
  // Called once per destination, seeded with the stored UAA credentials.
  provider: (destination, auth) => {
    if (!auth?.uaaUrl || !auth.uaaClientId || !auth.uaaClientSecret) {
      throw new Error(`No UAA credentials stored for ${destination}`);
    }
    return new ClientCredentialsProvider({
      uaaUrl: auth.uaaUrl,
      clientId: auth.uaaClientId,
      clientSecret: auth.uaaClientSecret,
    });
  },
});

// Hand this to the ICalmConnection implementation.
const tokenRefresher = broker.createTokenRefresher('calm');
```

From auth-broker 3.0.0 `tokenRefresher.refreshToken()` always obtains a new
token (2.x could return the one the server had just refused), so a
connection that calls it after a 401 no longer risks a 401 loop. The broker
constructor lost its second (`browser`) argument and `tokenProvider` is now
`provider`; see auth-broker's CHANGELOG, *Migrating from 2.2.0*.

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

Every failure a resource handler raises is a `CalmApiError`; an
`ICalmConnection` implementation can build one from an error body with
`calmErrorFromBody`:

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

## Testing

- Unit tests (`src/__tests__/unit/`) — pure-function, no I/O. 12 suites,
  93 tests.
  ```bash
  npm run test
  ```
- Integration tests — see [docs/TESTING.md](docs/TESTING.md) for the exact
  credentials and fixture data required per service before running against
  a live tenant or the SAP API Business Hub sandbox.
- Need to request tenant access from your Cloud ALM admin?
  [`docs/ADMIN-REQUEST-TEMPLATE.md`](docs/ADMIN-REQUEST-TEMPLATE.md) is
  a copy-paste email template covering the service binding, scopes, and
  sandbox-project asks.

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
# → 12 unit suites, 93 tests; integration suites self-skip with a single notice
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
DEBUG_CALM_CONNECTORS=true    # test connection: URLs, token requests
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
consumer → CalmClient → handlers → ICalmConnection (supplied by the consumer)
```

- Handlers depend only on `ICalmConnection`; the concrete connection —
  transport, Bearer/API-key header, 401 retry, service routes — belongs to
  the consumer (for example `@mcp-abap-adt/calm-server`).
- No MCP-server code in this library — consumers wrap it into their own
  MCP servers if desired.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full layered
description, URL composition rules, error model, and retry logic.

## License

**GNU Lesser General Public License v3.0 only** (`LGPL-3.0-only`).
Earlier published versions were MIT and stay MIT — a licence change is not
retroactive.

Copyright © 2026 Oleksii Kyslytsia

This library is free software: you can redistribute it and/or modify it under the
terms of the GNU Lesser General Public License as published by the Free Software
Foundation, version 3.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. See the GNU Lesser General Public License for more details.

Both texts ship with the package and both are needed: [`LICENSE`](LICENSE) is the
LGPL, [`COPYING`](COPYING) is the GPL it is written on top of, since the LGPL is a
set of additional permissions over the GPL and cannot be read alone.

**What this means if you depend on this package.** Linking it into your own
program — importing it, as every consumer of an npm package does — does not put
your program under the LGPL. What the licence asks is that changes *to this
library* stay free, and that your users can replace it with their own build.


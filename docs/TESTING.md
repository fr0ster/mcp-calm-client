# Testing

Two test layers with different trust boundaries and data requirements.

## Layer 1 — Unit tests (`src/__tests__/unit/`)

Pure-function contracts, no I/O. Always run, no credentials needed.

```bash
npm run test
# or unit-only:
npx jest --runInBand src/__tests__/unit
```

13 suites, 109 tests covering:
- `ODataQuery` — query-string construction, RFC 3986 encoding, canonical param order.
- `CalmApiError` — factory methods, prototype chain, cause propagation.
- `serviceRoutes` — all 9 `CalmService` keys present, no `/api` prefix baked in, 1:1 parity with Rust `config.rs`.
- `CalmConnection` — construction guards, URL composition, auth injection, 401 retry, error translation.
- 9 handlers (Features, Documents, TestCase, Hierarchy, Analytics, ProcessMonitoring, Tasks, Projects, Log) — tested against a mock `ICalmConnection`.

## Layer 2 — Integration tests (`src/__tests__/integration/`)

Exercised against a **live Cloud ALM tenant** (OAuth2 mode) or the **SAP API Business Hub sandbox** (API key).

Integration suites **self-skip** when `CALM_MODE` is unset — no credentials, no failures; unit tests still run. `globalSetup` logs a single notice:

```
[INFO] ℹ️ [calm globalSetup] CALM_MODE not set — integration tests will be skipped.
```

### Required environment

Copy `.env.example` to `.env` (git-ignored) and fill in. Both modes share `CALM_MODE` as the entry point.

#### OAuth2 mode (real tenant)

```bash
CALM_MODE=oauth2
CALM_BASE_URL=https://<tenant>.<region>.alm.cloud.sap
CALM_UAA_URL=https://<tenant>.authentication.<region>.hana.ondemand.com
CALM_UAA_CLIENT_ID=sb-…!b…|calm!b…
CALM_UAA_CLIENT_SECRET=…=
```

Source values from your **XSUAA service key** (BTP Cockpit → Instance → Service Binding → View → Key):

```json
{
  "uaa": {
    "url":          "<- CALM_UAA_URL",
    "clientid":     "<- CALM_UAA_CLIENT_ID",
    "clientsecret": "<- CALM_UAA_CLIENT_SECRET"
  },
  "url": "<- optional; fall back to CALM_BASE_URL pattern>"
}
```

Regions: `eu10`, `eu20`, `us10`, `ap10`, `jp10`, `ca10`, `eu11`, `cn20`.

#### Sandbox mode (SAP API Business Hub)

```bash
CALM_MODE=sandbox
CALM_API_KEY=<your-key>          # from https://api.sap.com/ → SAPCALM → Show API Key
# CALM_BASE_URL defaults to https://sandbox.api.sap.com/SAPCALM
```

### Optional per-service fixtures

Resource-specific integration tests self-skip if their fixture is unset, so you can dial in gradually:

| Env var | Used by |
|---|---|
| `CALM_TEST_PROJECT_ID` | tasks / projects (required filter scope) |
| `CALM_TEST_FEATURE_UUID` | features `get`, `getWithExpand` |
| `CALM_TEST_FEATURE_DISPLAY_ID` | features `getByDisplayId` |
| `CALM_TEST_DOCUMENT_UUID` | documents `get` |
| `CALM_TEST_TASK_ID` | tasks `get` |
| `CALM_TEST_TEST_CASE_UUID` | test management `get` |
| `CALM_TEST_HIERARCHY_NODE_UUID` | hierarchy `get`, `getWithExpand` |
| `CALM_TEST_ANALYTICS_PROVIDER` | analytics `queryDataset` (default: `Tasks`) |
| `CALM_TEST_LOG_PROVIDER` + `CALM_TEST_LOG_SERVICE_ID` | logs `get` |

### Destructive tests

```bash
CALM_DESTRUCTIVE=1
```

Enables create/update/delete round-trips. Off by default — safer first run is read-only. When enabled, destructive tests target `CALM_TEST_PROJECT_ID`; use a **dedicated test project**, not production work.

### Debug logging

Scope-gated via env flags (matches the `@mcp-abap-adt/adt-clients` pattern):

```bash
CALM_LOG_LEVEL=debug              # log level (error|warn|info|debug, default: info)
DEBUG_CALM_CONNECTORS=true        # CalmConnection: retries, 401 refresh, URLs
DEBUG_CALM_LIBS=true              # resource-client internals
DEBUG_CALM_TESTS=true             # test execution progress
```

All logging goes through `@mcp-abap-adt/logger` (`DefaultLogger`) — same format as other packages in the ecosystem.

### Running integration tests

```bash
# Unit + integration, .env governs mode
npx jest --runInBand

# Integration-only
npx jest --runInBand src/__tests__/integration

# Specific service
npx jest --runInBand src/__tests__/integration/features.integration.test.ts
```

Jest runs tests sequentially (`maxWorkers: 1`, `maxConcurrency: 1`) to avoid cross-test interference against a single tenant.

## What the integration suite verifies per client

A client is considered integration-verified when all four pass against the live target:

1. **Happy read**: list with `$top=1`, response deserializes as the declared TS type.
2. **Get by id**: fetch a fixture entity, types match.
3. **$expand** (OData only): where the client exposes expand-capable relations, verify the expanded payload deserializes.
4. **Write round-trip** (destructive mode only, skipped otherwise): create → update → delete.

Currently scaffolded: `connectivity.integration.test.ts`, `features.integration.test.ts` (all four flows). Remaining 8 clients get equivalent suites as fixtures are collected from the target tenant.

## Data checklist before first OAuth2 run

- [ ] `uaa.url`, `uaa.clientid`, `uaa.clientsecret` from service key → `.env`
- [ ] `CALM_BASE_URL` (tenant host) → `.env`
- [ ] Dedicated test `projectId`
- [ ] One safe-to-read feature UUID + displayId
- [ ] One safe-to-read document UUID
- [ ] One safe-to-read task id
- [ ] One test-case UUID
- [ ] A hierarchy node UUID with children (for `$expand`)
- [ ] A valid analytics provider name
- [ ] Log provider string + sample `serviceId`

For sandbox, SAP's API Business Hub docs list canned sample IDs per service — capture them into the same `.env` under the `CALM_TEST_*` keys.

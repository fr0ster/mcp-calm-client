# Implementation Plan: `@mcp-abap-adt/calm-client`

Міграція функціоналу Rust MCP-сервера `~/prj/sap-cloud-alm-odata-mcp` у TypeScript-бібліотеку клієнт-класів за архітектурою `~/prj/mcp-abap-adt-clients`.

## Вихідні точки

- **Ціль**: бібліотека клієнтів (не MCP-сервер) для SAP Cloud ALM OData/REST сервісів.
- **Еталон архітектури**: `~/prj/mcp-abap-adt-clients` — factory + core-на-ресурс + depend-on-interface-only.
- **Джерело функціоналу**: `~/prj/sap-cloud-alm-odata-mcp/src/` (Rust) — 9 API-клієнтів, OData query builder, типи.
- **НЕ портуємо**: `src/auth.rs`, `src/server.rs`, `src/main.rs`, `src/debug.rs`, `src/config.rs` (MCP-специфіка + auth замінюється існуючою екосистемою).

## Рішення по архітектурі

1. **`ICalmConnection`** додається у `@mcp-abap-adt/interfaces` (разом з `IAbapConnection`).
2. **Конкретна `CalmConnection`** живе всередині `@mcp-abap-adt/calm-client` (легка реалізація поряд з контрактом; виокремити в окремий пакет — пізніше, коли виросте).
3. **Ім'я пакета**: `@mcp-abap-adt/calm-client`.
4. **Auth**: повністю переиспользуємо `@mcp-abap-adt/auth-broker` + `@mcp-abap-adt/auth-providers` (`ClientCredentialsProvider` для XSUAA) + `@mcp-abap-adt/auth-stores` (`XsuaaServiceKeyStore`, `XsuaaSessionStore`). Жодного нового OAuth-коду.
5. **Service routes**: дефолтна мапа як seed з Rust-коду, **завжди override-able** через конструктор `CalmConnection({ serviceRoutes?: Partial<Record<CalmService, string>> })`. Хардкод як єдине джерело правди заборонений.
6. **Клієнти залежать тільки від `ICalmConnection`** (дзеркало ADT-еталона з `IAbapConnection`).

## Цільова структура

```
mcp-calm-client/src/
  types/
    ICalmConnection.ts           // або import з @mcp-abap-adt/interfaces
    CalmService.ts               // 'features'|'documents'|'tasks'|'projects'|'testManagement'|'hierarchy'|'analytics'|'processMonitoring'|'logs'
  connection/
    CalmConnection.ts            // concrete implements ICalmConnection
    serviceRoutes.ts             // DEFAULT_CALM_SERVICE_ROUTES (seed, перевіряється проти tenant)
    parseCalmError.ts
  clients/
    CalmClient.ts                // factory: getFeatures()/getDocuments()/...
  core/
    feature/  { CalmFeature.ts, types.ts, list.ts, get.ts, create.ts, update.ts, delete.ts, externalReferences.ts, index.ts }
    document/
    task/
    project/
    testCase/
    hierarchy/
    analytics/
    processMonitoring/
    log/
  odata/
    ODataQuery.ts                // порт src/odata.rs
    ODataCollection.ts
  errors/
    CalmApiError.ts
    codes.ts
  utils/
  __tests__/integration/
  index.ts
```

## Peer / dependencies

```json
"peerDependencies": {
  "@mcp-abap-adt/interfaces": "^7.0.0"
},
"dependencies": {
  "axios": "^1"
},
"devDependencies": {
  "@mcp-abap-adt/auth-broker": "^1.0.5",
  "@mcp-abap-adt/auth-providers": "^1.0.5",
  "@mcp-abap-adt/auth-stores": "^1.0.4"
}
```

## Build / lint / test stack

Копіюється 1:1 з `mcp-abap-adt-clients`:
- TypeScript strict, CommonJS es2022, declaration maps
- Biome (не ESLint), single quotes, semicolons, 2-space indent
- Jest: `maxWorkers: 1`, `maxConcurrency: 1`, timeout 15min, integration-only
- `.env` per-середовище (sandbox.env, prod.env)

## Scope per Cloud ALM service

**OData v4 (6)**: Features, Documents, TestManagement, ProcessHierarchy, Analytics, ProcessMonitoring — шарять `ODataQuery`.
**REST (3)**: Tasks, Projects, Logs — прямі HTTP-параметри, базовий `CalmRestClientBase` (внутрішньо).

## Порядок робіт (18 задач)

| # | Задача | Залежності |
|---|---|---|
| 1 | Add ICalmConnection + CalmService to `@mcp-abap-adt/interfaces` | — |
| 2 | Scaffold `@mcp-abap-adt/calm-client` package | #1 |
| 3 | Port ODataQuery builder from Rust `src/odata.rs` (+ unit tests) | #2 |
| 4 | Implement CalmConnection (concrete ICalmConnection) — перепише існуючий preliminary stub (auth через `ITokenRefresher`, sandbox vs OAuth2 `/api` префікс, axios 401-retry, error translation через `CalmApiError`, консолідація `parseCalmError` як internal adapter) | #1, #2 |
| 5 | Extract default service routes from Rust `api/*.rs` | — |
| 6 | Implement CalmApiError + error codes | #2 |
| 7 | **Port Features client as reference implementation** | #3, #4, #5, #6 |
| 8 | Port Documents client (OData) | #7 |
| 9 | Port TestManagement client (OData) | #7 |
| 10 | Port ProcessHierarchy client (OData with $expand) | #7 |
| 11 | Port Analytics client (OData, read-only) | #7 |
| 12 | Port ProcessMonitoring client (OData) | #7 |
| 13 | Port Tasks client (REST) | #7 |
| 14 | Port Projects client (REST) | #13 |
| 15 | Port Logs client (REST) | #13 |
| 16 | Implement CalmClient factory + public `src/index.ts` | #8–#15 |
| 17 | Integration tests against Cloud ALM sandbox | #16 |
| 18 | README + CHANGELOG 0.1.0 | #16 |

**Features (#7) — референс-клієнт**: має CRUD + sub-entity (ExternalReferences) + lookup-колекції (statuses/priorities). Патерн, встановлений тут, копіюється в решту 8.

## Ключові принципи по ходу роботи

- **Interface isolation**: core-хендлери беруть тільки `ICalmConnection` в конструктор. `CalmConnection` — convenience default, користувач може принести свою реалізацію.
- **Naming**: `I<Entity>` для публічної сутності (`IFeature`, `IDocument`), `ICreate<Entity>Params` / `IUpdate<Entity>Params` для write-DTO. `Config`/`State` суфікси з ADT-еталону **не застосовуються** — Cloud ALM не має lock/activation lifecycle, тому tracking state-у не потрібен.
- **No hardcoded endpoints as single source of truth**: `DEFAULT_CALM_SERVICE_ROUTES` — seed, override через конструктор або конфіг-файл.
- **No MCP-specific code**: жодних посилань на rmcp/MCP tools/stdio.
- **No session/lock semantics** (на відміну від ADT): Cloud ALM CRUD immediate, operation chains простіші.

## Відкриті питання / ризики

- `$expand` поведінка Cloud ALM — реально exercised тільки в Hierarchy + Features→ExternalReferences. Перевіряється в integration-фазі (#17).
- Чи всі 9 сервісів працюють з одним XSUAA service-key / одним токеном. Перевіряється в #17.
- Default service routes можуть не відповідати реальним URL tenant'а — вивіряються live під час #17, оновлюються без breaking change (override пришвидшує).

## Референси

- Reference arch: `~/prj/mcp-abap-adt-clients/src/` (особливо `clients/AdtClient.ts`, `core/class/`, `core/shared/AdtUtils.ts`)
- Sister precedent: `~/prj/mcp-abap-adt-gcts-client/` (окремий пакет для іншого REST-неймспейсу)
- Functional source: `~/prj/sap-cloud-alm-odata-mcp/src/api/*.rs`, `src/odata.rs`
- Auth: `~/prj/mcp-abap-adt-auth-broker/src/AuthBroker.ts`, `~/prj/mcp-abap-adt-auth-providers/src/providers/ClientCredentialsProvider.ts`, `~/prj/mcp-abap-adt-auth-stores/src/stores/xsuaa/`
- Interfaces: `~/prj/mcp-abap-adt-interfaces/src/` (auth/, connection/, token/, serviceKey/, session/)

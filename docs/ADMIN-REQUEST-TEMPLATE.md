# Requesting Cloud ALM API access — template for admins

When setting up `@mcp-abap-adt/calm-client` (or `@mcp-abap-adt/calm-server`)
against a live tenant, send your SAP Cloud ALM admin the message below.
Adapt the **Use case** line, project scope, and signature; the rest is
specific to what the client library actually consumes.

---

## Email template (copy / paste / adapt)

> **Subject:** Cloud ALM API access — service binding + credentials for `<your-project-name>`
>
> Hi <admin name>,
>
> I'm wiring up a TypeScript integration against our SAP Cloud ALM tenant
> and need API credentials from you. Details below; the ask is a standard
> OAuth2 service binding, nothing unusual.
>
> ### Use case
>
> <1–2 sentences about what the integration does — e.g. "automated reports
> on feature status by project, triggered weekly from our CI", or "Claude
> MCP integration for interactive ad-hoc queries against Cloud ALM
> entities">. Read-heavy; destructive operations (create/update/delete)
> <will / will not> be used, and only on a dedicated test project.
>
> ### Tenant details needed
>
> 1. **Tenant identifier** — the subdomain used for API URLs
>    (`<tenant>.<region>.alm.cloud.sap`).
> 2. **Region code** — `eu10` / `eu20` / `us10` / `ap10` / `jp10` / `ca10`
>    / `eu11` / `cn20`.
>
> ### XSUAA service binding
>
> Please create a binding to the Cloud ALM service in our subaccount and
> share the **service key JSON** (or at least its four fields below)
> via whatever secure channel we use for credentials (1Password /
> LastPass / internal secret store — **not plain email**).
>
> The key contains:
>
> ```json
> {
>   "uaa": {
>     "url":          "https://<tenant>.authentication.<region>.hana.ondemand.com",
>     "clientid":     "sb-…!b…|calm!b…",
>     "clientsecret": "…"
>   },
>   "url": "https://<tenant>.<region>.alm.cloud.sap"
> }
> ```
>
> ### Scopes / role collection
>
> The integration needs to call the following Cloud ALM APIs. Please
> assign the corresponding scopes on the service binding (or attach a
> role collection that grants them):
>
> | Cloud ALM service | Purpose | Read | Write |
> |---|---|:---:|:---:|
> | Feature Delivery (`calm-features`) | feature backlog, status, priorities | ✅ | `<yes/no>` |
> | Documents (`calm-documents`) | knowledge artefacts, specs | ✅ | `<yes/no>` |
> | Tasks (`calm-tasks`) | actionable work items, comments | ✅ | `<yes/no>` |
> | Projects (`calm-projects`) | project list, timeboxes, team members | ✅ | `<yes/no>` |
> | Test Management (`calm-testmanagement`) | manual test cases, activities, actions | ✅ | `<yes/no>` |
> | Process Hierarchy (`calm-processhierarchy`) | process structure nodes | ✅ | `<yes/no>` |
> | Analytics (`calm-analytics`) | pre-aggregated metrics | ✅ | — |
> | Process Monitoring (`calm-processmonitoring`) | business / solution processes | ✅ | — |
> | Logs (`calm-logs`) | application log read-out | ✅ | — |
>
> If possible, please lean **read-only** wherever possible — I'll explicitly
> come back for write scopes on a per-service basis once the read flow is
> validated.
>
> ### Test / sandbox project
>
> If we're going to exercise write operations at any point, I'd like a
> **dedicated test project** set up in Cloud ALM that I can safely
> create / update / delete entities in, separate from any real
> engagement project. Please share the project ID once ready.
>
> ### Rate limits / quotas
>
> Is there a request-per-minute cap I should design around, or a quota
> on the subaccount I need to factor in?
>
> ### Rotation policy
>
> What's our standard rotation cadence for service-binding secrets? I'd
> like to align our secret store with that.
>
> ---
>
> Happy to jump on a call if anything here is unclear or if there's a
> different workflow in our org for provisioning API access. Thanks!
>
> — <your name>

---

## What you do with the answer

Once the admin responds with a service key, paste the four fields into
your local `.env` (git-ignored):

```env
CALM_MODE=oauth2
CALM_BASE_URL=<value from service key's "url", or derived from tenant+region>
CALM_UAA_URL=<uaa.url>
CALM_UAA_CLIENT_ID=<uaa.clientid>
CALM_UAA_CLIENT_SECRET=<uaa.clientsecret>
```

Then:

```bash
# Run the unit + integration suites:
npx jest --runInBand
# Or launch the MCP server:
npx @mcp-abap-adt/calm-server
```

If the admin can only grant sandbox access (no tenant yet), request an
**API Business Hub sandbox key** instead — the setup collapses to:

```env
CALM_MODE=sandbox
CALM_API_KEY=<key from https://api.sap.com/>
```

## Security notes (relay to admin if helpful)

- The client library never stores the service key — it's read from
  process env only.
- Tokens are requested on demand via the OAuth2 `client_credentials`
  flow; no refresh token is issued, so rotation of the client secret
  immediately invalidates all downstream access.
- Scopes are evaluated per-request by Cloud ALM; minimal-scope bindings
  are recommended over blanket read/write.

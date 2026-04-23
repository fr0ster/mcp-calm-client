import type { CalmService } from '@mcp-abap-adt/interfaces';

export type CalmServiceRouteMap = Record<CalmService, string>;

/**
 * Default Cloud ALM service route suffixes (relative to the API path prefix).
 *
 * Full URL: `{baseUrl}{apiPrefix}{serviceRoute}`
 *   - baseUrl:   tenant host, e.g. `https://<tenant>.eu10.alm.cloud.sap`
 *                (sandbox: `https://sandbox.api.sap.com/SAPCALM`)
 *   - apiPrefix: `/api` for OAuth2 mode, empty for sandbox mode
 *   - serviceRoute: one of the values below
 *
 * Seeded from `sap-cloud-alm-odata-mcp/src/config.rs`. Verify against
 * a live tenant; override via `CalmConnection({ serviceRoutes })`.
 */
export const DEFAULT_CALM_SERVICE_ROUTES: CalmServiceRouteMap = {
  features: '/calm-features/v1',
  documents: '/calm-documents/v1',
  tasks: '/calm-tasks/v1',
  projects: '/calm-projects/v1',
  testManagement: '/calm-testmanagement/v1',
  hierarchy: '/calm-processhierarchy/v1',
  analytics: '/calm-analytics/v1/odata/v4/analytics',
  processMonitoring: '/calm-processmonitoring/v1',
  logs: '/calm-logs/v1',
};

import { CALM_SERVICES } from '@mcp-abap-adt/interfaces';
import { DEFAULT_CALM_SERVICE_ROUTES } from '../../../connection/serviceRoutes';

describe('DEFAULT_CALM_SERVICE_ROUTES', () => {
  test('covers every CalmService key', () => {
    const routeKeys = Object.keys(DEFAULT_CALM_SERVICE_ROUTES).sort();
    const serviceKeys = [...CALM_SERVICES].sort();
    expect(routeKeys).toEqual(serviceKeys);
  });

  test('every value starts with a single leading slash', () => {
    for (const [service, route] of Object.entries(
      DEFAULT_CALM_SERVICE_ROUTES,
    )) {
      expect(route.startsWith('/')).toBe(true);
      expect(route.startsWith('//')).toBe(false);
      expect(route).not.toMatch(/\s/);
      expect(service).toBeTruthy();
    }
  });

  test('no /api prefix baked in (prefix is a connection concern)', () => {
    for (const route of Object.values(DEFAULT_CALM_SERVICE_ROUTES)) {
      expect(route.startsWith('/api/')).toBe(false);
    }
  });

  test('matches Rust config.rs suffixes', () => {
    expect(DEFAULT_CALM_SERVICE_ROUTES).toEqual({
      features: '/calm-features/v1',
      documents: '/calm-documents/v1',
      tasks: '/calm-tasks/v1',
      projects: '/calm-projects/v1',
      testManagement: '/calm-testmanagement/v1',
      hierarchy: '/calm-processhierarchy/v1',
      analytics: '/calm-analytics/v1/odata/v4/analytics',
      processMonitoring: '/calm-processmonitoring/v1',
      logs: '/calm-logs/v1',
    });
  });
});

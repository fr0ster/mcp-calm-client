import {
  ANALYTICS_ENDPOINTS,
  type AnalyticsEndpoint,
  type IListProvidersResult,
} from './types';

const DESCRIPTIONS: Record<AnalyticsEndpoint, string> = {
  Requirements: 'Requirements analytics data',
  Projects: 'Projects analytics data',
  Tasks: 'Tasks analytics data',
  Defects: 'Defects analytics data',
  Tests: 'Tests analytics data',
  Features: 'Features analytics data',
  ConfigurationItems: 'Configuration items analytics data',
  Metrics: 'Metrics analytics data',
  Requests: 'Requests analytics data',
  Exceptions: 'Exceptions analytics data',
  StatusEvents: 'Status events analytics data',
  QualityGates: 'Quality gates analytics data',
  Jobs: 'Jobs analytics data',
  ServiceLevels: 'Service levels analytics data',
  ScenarioExecutions: 'Scenario executions analytics data',
  MonitoringEvents: 'Monitoring events analytics data',
  Messages: 'Messages analytics data',
};

/**
 * Static list of known analytics providers. Kept in sync with
 * `ANALYTICS_ENDPOINTS`; does not hit the server.
 */
export function listAnalyticsProviders(): IListProvidersResult {
  return {
    providers: ANALYTICS_ENDPOINTS.map((name) => ({
      name,
      description: DESCRIPTIONS[name],
    })),
    note: 'Use these names with CalmAnalytics.getEndpoint(name, query).',
  };
}

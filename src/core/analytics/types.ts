/**
 * Named analytics endpoints exposed by Cloud ALM `/calm-analytics/v1/odata/v4/analytics`.
 * Mirrors the dedicated getters in the Rust reference implementation; callers
 * pass one of these values to `CalmAnalytics.getEndpoint()` for discoverable,
 * type-safe access.
 */
export const ANALYTICS_ENDPOINTS = [
  'Requirements',
  'Projects',
  'Tasks',
  'Defects',
  'Tests',
  'Features',
  'ConfigurationItems',
  'Metrics',
  'Requests',
  'Exceptions',
  'StatusEvents',
  'QualityGates',
  'Jobs',
  'ServiceLevels',
  'ScenarioExecutions',
  'MonitoringEvents',
  'Messages',
] as const;

export type AnalyticsEndpoint = (typeof ANALYTICS_ENDPOINTS)[number];

export interface IAnalyticsProviderInfo {
  name: AnalyticsEndpoint;
  description: string;
}

export interface IListProvidersResult {
  providers: IAnalyticsProviderInfo[];
  note: string;
}

export interface IQueryDatasetOptions {
  additionalFilter?: string;
  top?: number;
  skip?: number;
}

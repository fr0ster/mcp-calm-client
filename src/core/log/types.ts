export interface IGetLogsParams {
  provider: string;
  format?: string;
  version?: string;
  period?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  /** Translated to the `logsFilters[serviceId]=…` bracket query param. */
  serviceId?: string;
  observedTimestamp?: boolean;
  onLimit?: string;
}

export interface IPostLogsParams {
  useCase: string;
  serviceId: string;
  version?: string;
  dev?: boolean;
  tag?: string;
}

/**
 * Log payload (OpenTelemetry-style). Shape is intentionally loose — the Logs
 * API accepts and returns caller-defined records under its own schema.
 */
export type LogRecords = unknown;

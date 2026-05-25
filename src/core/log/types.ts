export interface IGetLogsParams {
  provider: string;
  format?: string;
  version?: string;
  period?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  /**
   * Emitted as a plain `serviceId` query param. The live Logs API requires it
   * alongside `provider` and 428s without it (the bracket form
   * `logsFilters[serviceId]` is rejected).
   */
  serviceId?: string;
  observedTimestamp?: boolean;
  /**
   * Server-side count-cap strategy. `limit`/`offset` only page when this is
   * `'truncate'`; `get()` defaults it to `'truncate'` when `limit`/`offset`
   * is set and this is left unset.
   */
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

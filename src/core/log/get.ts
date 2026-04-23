import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IGetLogsParams, LogRecords } from './types';

/**
 * GET outbound logs. Cloud ALM's `/calm-logs/v1/logs` uses a domain-specific
 * query-string language (not OData): `provider=…`, `logsFilters[serviceId]=…`,
 * date ranges, pagination. Named params are translated to that shape here.
 */
export async function getLogs<T = LogRecords>(
  connection: ICalmConnection,
  params: IGetLogsParams,
): Promise<T> {
  const q: Record<string, unknown> = { provider: params.provider };
  if (params.format !== undefined) q.format = params.format;
  if (params.version !== undefined) q.version = params.version;
  if (params.period !== undefined) q.period = params.period;
  if (params.from !== undefined) q.from = params.from;
  if (params.to !== undefined) q.to = params.to;
  if (params.limit !== undefined) q.limit = params.limit;
  if (params.offset !== undefined) q.offset = params.offset;
  if (params.serviceId !== undefined) {
    q['logsFilters[serviceId]'] = params.serviceId;
  }
  if (params.observedTimestamp !== undefined) {
    q.observedTimestamp = params.observedTimestamp;
  }
  if (params.onLimit !== undefined) q.onLimit = params.onLimit;

  const response = await connection.makeRequest<T>({
    service: 'logs',
    url: '/logs',
    method: 'GET',
    params: q,
    timeout: 60_000,
  });
  return response.data;
}

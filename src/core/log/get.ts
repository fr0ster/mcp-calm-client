import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IGetLogsParams, LogRecords } from './types';

/**
 * GET outbound logs. Cloud ALM's `/calm-logs/v1/logs` uses a domain-specific
 * query-string language (not OData): `provider=…`, `serviceId=…`, date
 * ranges, pagination. Named params are translated to that shape here.
 *
 * NOTE: `serviceId` is a plain top-level query parameter. The live Logs
 * API requires it alongside `provider` and rejects the bracket form
 * `logsFilters[serviceId]` with HTTP 428 "A required parameter is
 * missing : serviceId".
 */
export async function getLogs<T = LogRecords>(
  connection: ICalmConnection,
  params: IGetLogsParams,
): Promise<T> {
  const q: Record<string, unknown> = { provider: params.provider };
  if (params.format !== undefined) q.format = params.format;
  if (params.version !== undefined) q.version = params.version;
  if (params.category !== undefined) q.category = params.category;
  if (params.period !== undefined) q.period = params.period;
  if (params.from !== undefined) q.from = params.from;
  if (params.to !== undefined) q.to = params.to;
  if (params.limit !== undefined) q.limit = params.limit;
  if (params.offset !== undefined) q.offset = params.offset;
  if (params.serviceId !== undefined) {
    q.serviceId = params.serviceId;
  }
  if (params.observedTimestamp !== undefined) {
    q.observedTimestamp = params.observedTimestamp;
  }
  // The live Logs API has no classic paging: `limit`/`offset` alone trip the
  // server count cap (HTTP 403 "total count is over the limit") instead of
  // paging. They only take effect when `onLimit=truncate` is also sent. So
  // when the caller asks to page but doesn't pick an onLimit strategy,
  // default to `truncate` — otherwise the request 403s on any real window.
  if (params.onLimit !== undefined) {
    q.onLimit = params.onLimit;
  } else if (params.limit !== undefined || params.offset !== undefined) {
    q.onLimit = 'truncate';
  }

  const response = await connection.makeRequest<T>({
    service: 'logs',
    url: '/logs',
    method: 'GET',
    params: q,
    timeout: 60_000,
  });
  return response.data;
}

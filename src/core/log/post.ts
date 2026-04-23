import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IPostLogsParams, LogRecords } from './types';

/**
 * POST inbound logs. URL query string carries `useCase`, `serviceId`,
 * optional `version`, `dev`, `tag`. Body is the caller-provided log records
 * (OpenTelemetry-style — no schema enforced by this library).
 */
export async function postLogs<T = LogRecords>(
  connection: ICalmConnection,
  params: IPostLogsParams,
  records: LogRecords,
): Promise<T> {
  const q: Record<string, unknown> = {
    useCase: params.useCase,
    serviceId: params.serviceId,
  };
  if (params.version !== undefined) q.version = params.version;
  if (params.dev !== undefined) q.dev = params.dev;
  if (params.tag !== undefined) q.tag = params.tag;

  const response = await connection.makeRequest<T>({
    service: 'logs',
    url: '/logs',
    method: 'POST',
    params: q,
    data: records,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60_000,
  });
  return response.data;
}

import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import { ODataQuery } from '../../odata/ODataQuery';
import type { IQueryDatasetOptions } from './types';

/**
 * Query the generic `/DataSet` endpoint by provider name. Internally emits
 * a `$filter` combining `provider eq '<provider>'` with any caller-supplied
 * filter (joined via `and`), plus optional `$top` / `$skip`.
 */
export async function queryAnalyticsDataset<T = unknown>(
  connection: ICalmConnection,
  provider: string,
  options: IQueryDatasetOptions = {},
): Promise<T> {
  const escaped = provider.replace(/'/g, "''");
  const providerFilter = `provider eq '${escaped}'`;
  const full = options.additionalFilter
    ? `${providerFilter} and ${options.additionalFilter}`
    : providerFilter;

  let q = ODataQuery.new().filter(full);
  if (options.top !== undefined) q = q.top(options.top);
  if (options.skip !== undefined) q = q.skip(options.skip);

  const response = await connection.makeRequest<T>({
    service: 'analytics',
    url: `/DataSet${q.toQueryString()}`,
    method: 'GET',
  });
  return response.data;
}

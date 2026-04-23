import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { AnalyticsEndpoint } from './types';

/**
 * GET a named analytics collection with an optional OData query.
 * Returns raw JSON as `T` (default `unknown`) — schema varies per endpoint.
 */
export async function getAnalyticsEndpoint<T = unknown>(
  connection: ICalmConnection,
  endpoint: AnalyticsEndpoint,
  query?: ODataQuery,
): Promise<T> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<T>({
    service: 'analytics',
    url: `/${endpoint}${qs}`,
    method: 'GET',
  });
  return response.data;
}

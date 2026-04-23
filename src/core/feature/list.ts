import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { IFeature } from './types';

export async function listFeatures(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IFeature>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IFeature>>({
    service: 'features',
    url: `/Features${qs}`,
    method: 'GET',
  });
  return response.data;
}

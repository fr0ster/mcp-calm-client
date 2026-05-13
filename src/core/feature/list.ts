import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { odataAfterProjectId } from '../_internal/url';
import type { IFeature } from './types';

/**
 * List features in a project. The Features service's controller
 * declares `@RequestParam UUID projectId`, so the param travels on
 * the URL — placing it in OData `$filter` does NOT satisfy the
 * server. See issue #3.
 */
export async function listFeatures(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<IFeature>> {
  const url = `/Features?projectId=${encodeURIComponent(projectId)}${odataAfterProjectId(query)}`;
  const response = await connection.makeRequest<IODataCollection<IFeature>>({
    service: 'features',
    url,
    method: 'GET',
  });
  return response.data;
}

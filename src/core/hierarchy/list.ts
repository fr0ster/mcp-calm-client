import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { IHierarchyNode } from './types';

export async function listHierarchyNodes(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IHierarchyNode>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<
    IODataCollection<IHierarchyNode>
  >({
    service: 'hierarchy',
    url: `/HierarchyNodes${qs}`,
    method: 'GET',
  });
  return response.data;
}

import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ITaskReference } from './types';

export async function listTaskReferences(
  connection: ICalmConnection,
  taskId: string,
  query?: ODataQuery,
): Promise<IODataCollection<ITaskReference>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<
    IODataCollection<ITaskReference>
  >({
    service: 'tasks',
    url: `/tasks/${encodeURIComponent(taskId)}/references${qs}`,
    method: 'GET',
  });
  return response.data;
}

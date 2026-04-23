import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ICreateTaskCommentParams, ITaskComment } from './types';

export async function listTaskComments(
  connection: ICalmConnection,
  taskId: string,
  query?: ODataQuery,
): Promise<IODataCollection<ITaskComment>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITaskComment>>(
    {
      service: 'tasks',
      url: `/tasks/${encodeURIComponent(taskId)}/comments${qs}`,
      method: 'GET',
    },
  );
  return response.data;
}

export async function createTaskComment(
  connection: ICalmConnection,
  taskId: string,
  params: ICreateTaskCommentParams,
): Promise<ITaskComment> {
  const response = await connection.makeRequest<ITaskComment>({
    service: 'tasks',
    url: `/tasks/${encodeURIComponent(taskId)}/comments`,
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

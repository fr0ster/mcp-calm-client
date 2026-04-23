import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ITask, IUpdateTaskParams } from './types';

export async function updateTask(
  connection: ICalmConnection,
  id: string,
  params: IUpdateTaskParams,
): Promise<ITask> {
  const response = await connection.makeRequest<ITask>({
    service: 'tasks',
    url: `/tasks/${encodeURIComponent(id)}`,
    method: 'PATCH',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

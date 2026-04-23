import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ITask } from './types';

export async function getTask(
  connection: ICalmConnection,
  id: string,
): Promise<ITask> {
  const response = await connection.makeRequest<ITask>({
    service: 'tasks',
    url: `/tasks/${encodeURIComponent(id)}`,
    method: 'GET',
  });
  return response.data;
}

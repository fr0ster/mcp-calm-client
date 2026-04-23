import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateTaskParams, ITask } from './types';

export async function createTask(
  connection: ICalmConnection,
  params: ICreateTaskParams,
): Promise<ITask> {
  const response = await connection.makeRequest<ITask>({
    service: 'tasks',
    url: '/tasks',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

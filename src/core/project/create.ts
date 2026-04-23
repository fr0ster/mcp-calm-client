import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateProjectParams, IProject } from './types';

export async function createProject(
  connection: ICalmConnection,
  params: ICreateProjectParams,
): Promise<IProject> {
  const response = await connection.makeRequest<IProject>({
    service: 'projects',
    url: '/projects',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

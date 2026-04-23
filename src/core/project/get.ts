import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IProgram, IProject } from './types';

export async function getProject(
  connection: ICalmConnection,
  id: string,
): Promise<IProject> {
  const response = await connection.makeRequest<IProject>({
    service: 'projects',
    url: `/projects/${encodeURIComponent(id)}`,
    method: 'GET',
  });
  return response.data;
}

export async function getProgram(
  connection: ICalmConnection,
  id: string,
): Promise<IProgram> {
  const response = await connection.makeRequest<IProgram>({
    service: 'projects',
    url: `/programs/${encodeURIComponent(id)}`,
    method: 'GET',
  });
  return response.data;
}

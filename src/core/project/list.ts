import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { IProgram, IProject } from './types';

export async function listProjects(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IProject>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IProject>>({
    service: 'projects',
    url: `/projects${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function listPrograms(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IProgram>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IProgram>>({
    service: 'projects',
    url: `/programs${qs}`,
    method: 'GET',
  });
  return response.data;
}

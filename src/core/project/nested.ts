import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ITeamMember, ITimebox } from './types';

export async function listProjectTimeboxes(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<ITimebox>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITimebox>>({
    service: 'projects',
    url: `/projects/${encodeURIComponent(projectId)}/timeboxes${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function listProjectTeamMembers(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<ITeamMember>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITeamMember>>({
    service: 'projects',
    url: `/projects/${encodeURIComponent(projectId)}/teams${qs}`,
    method: 'GET',
  });
  return response.data;
}

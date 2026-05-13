import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { IDeliverable, ITask, IWorkstream } from './types';

export async function listTasks(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<ITask>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITask>>({
    service: 'tasks',
    url: `/tasks${qs}`,
    method: 'GET',
  });
  return response.data;
}

/**
 * Build an OData query suffix that appends after an existing
 * `?projectId=...` segment: the OData query string starts with `?`,
 * which we replace with `&` so the URL stays well-formed. Returns
 * empty when no query is provided.
 */
function odataAfterProjectId(query?: ODataQuery): string {
  if (!query) return '';
  return query.toQueryString().replace(/^\?/, '&');
}

/**
 * List workstreams for a project. The Tasks service exposes this
 * endpoint as a Spring controller with `@RequestParam UUID projectId`,
 * so `projectId` must travel as a plain HTTP query param — placing
 * it into the OData `$filter` does NOT satisfy the server. Some
 * sandbox variants tolerate the missing param and return an empty
 * page; a real tenant 400s. See issue #1.
 */
export async function listWorkstreams(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<IWorkstream>> {
  const url = `/workstreams?projectId=${encodeURIComponent(projectId)}${odataAfterProjectId(query)}`;
  const response = await connection.makeRequest<IODataCollection<IWorkstream>>({
    service: 'tasks',
    url,
    method: 'GET',
  });
  return response.data;
}

/**
 * List deliverables for a project. Same `?projectId=<uuid>` contract
 * as `listWorkstreams` — see the comment there.
 */
export async function listDeliverables(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<IDeliverable>> {
  const url = `/deliverables?projectId=${encodeURIComponent(projectId)}${odataAfterProjectId(query)}`;
  const response = await connection.makeRequest<IODataCollection<IDeliverable>>(
    {
      service: 'tasks',
      url,
      method: 'GET',
    },
  );
  return response.data;
}

import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { odataAfterProjectId } from '../_internal/url';
import type { IDeliverable, ITask, IWorkstream } from './types';

/**
 * List tasks in a project. The Tasks service's controller declares
 * `@RequestParam UUID projectId`, so the param travels on the URL —
 * placing it in OData `$filter` does NOT satisfy the server. See
 * issue #3.
 */
export async function listTasks(
  connection: ICalmConnection,
  projectId: string,
  query?: ODataQuery,
): Promise<IODataCollection<ITask>> {
  const url = `/tasks?projectId=${encodeURIComponent(projectId)}${odataAfterProjectId(query)}`;
  const response = await connection.makeRequest<IODataCollection<ITask>>({
    service: 'tasks',
    url,
    method: 'GET',
  });
  return response.data;
}

/**
 * List workstreams for a project. Same `?projectId=<uuid>` contract
 * as `listTasks` — see issue #1.
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
 * as `listTasks` — see issue #1.
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

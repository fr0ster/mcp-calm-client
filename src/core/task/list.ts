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

export async function listWorkstreams(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IWorkstream>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IWorkstream>>({
    service: 'tasks',
    url: `/workstreams${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function listDeliverables(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IDeliverable>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IDeliverable>>(
    {
      service: 'tasks',
      url: `/deliverables${qs}`,
      method: 'GET',
    },
  );
  return response.data;
}

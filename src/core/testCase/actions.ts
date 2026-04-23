import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ICreateTestActionParams, ITestAction } from './types';

export async function listTestActions(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<ITestAction>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITestAction>>({
    service: 'testManagement',
    url: `/Actions${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function createTestAction(
  connection: ICalmConnection,
  params: ICreateTestActionParams,
): Promise<ITestAction> {
  const response = await connection.makeRequest<ITestAction>({
    service: 'testManagement',
    url: '/Actions',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

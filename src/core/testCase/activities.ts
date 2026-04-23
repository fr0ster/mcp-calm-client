import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ICreateTestActivityParams, ITestActivity } from './types';

export async function listTestActivities(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<ITestActivity>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<
    IODataCollection<ITestActivity>
  >({
    service: 'testManagement',
    url: `/Activities${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function createTestActivity(
  connection: ICalmConnection,
  params: ICreateTestActivityParams,
): Promise<ITestActivity> {
  const response = await connection.makeRequest<ITestActivity>({
    service: 'testManagement',
    url: '/Activities',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

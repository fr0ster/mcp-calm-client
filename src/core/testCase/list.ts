import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { ITestCase } from './types';

export async function listTestCases(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<ITestCase>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<ITestCase>>({
    service: 'testManagement',
    url: `/ManualTestCases${qs}`,
    method: 'GET',
  });
  return response.data;
}

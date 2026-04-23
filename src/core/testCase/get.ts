import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ITestCase } from './types';

export async function getTestCase(
  connection: ICalmConnection,
  uuid: string,
): Promise<ITestCase> {
  const response = await connection.makeRequest<ITestCase>({
    service: 'testManagement',
    url: `/ManualTestCases/${encodeURIComponent(uuid)}`,
    method: 'GET',
  });
  return response.data;
}

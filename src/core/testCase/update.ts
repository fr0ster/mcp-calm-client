import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ITestCase, IUpdateTestCaseParams } from './types';

export async function updateTestCase(
  connection: ICalmConnection,
  uuid: string,
  params: IUpdateTestCaseParams,
): Promise<ITestCase> {
  const response = await connection.makeRequest<ITestCase>({
    service: 'testManagement',
    url: `/ManualTestCases/${encodeURIComponent(uuid)}`,
    method: 'PATCH',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

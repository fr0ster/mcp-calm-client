import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateTestCaseParams, ITestCase } from './types';

export async function createTestCase(
  connection: ICalmConnection,
  params: ICreateTestCaseParams,
): Promise<ITestCase> {
  const response = await connection.makeRequest<ITestCase>({
    service: 'testManagement',
    url: '/ManualTestCases',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

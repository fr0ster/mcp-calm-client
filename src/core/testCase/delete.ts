import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';

export async function deleteTestCase(
  connection: ICalmConnection,
  uuid: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'testManagement',
    url: `/ManualTestCases/${encodeURIComponent(uuid)}`,
    method: 'DELETE',
  });
}

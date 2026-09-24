import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';

export async function deleteDocument(
  connection: ICalmConnection,
  uuid: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'documents',
    url: `/Documents/${encodeURIComponent(uuid)}`,
    method: 'DELETE',
  });
}

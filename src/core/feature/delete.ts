import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';

export async function deleteFeature(
  connection: ICalmConnection,
  uuid: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'features',
    url: `/Features/${encodeURIComponent(uuid)}`,
    method: 'DELETE',
  });
}

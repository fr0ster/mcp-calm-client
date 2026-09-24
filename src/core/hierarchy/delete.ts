import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';

export async function deleteHierarchyNode(
  connection: ICalmConnection,
  uuid: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'hierarchy',
    url: `/HierarchyNodes/${encodeURIComponent(uuid)}`,
    method: 'DELETE',
  });
}

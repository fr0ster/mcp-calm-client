import type { ICalmConnection } from '@mcp-abap-adt/interfaces-calm';

export async function deleteTask(
  connection: ICalmConnection,
  id: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'tasks',
    url: `/tasks/${encodeURIComponent(id)}`,
    method: 'DELETE',
  });
}

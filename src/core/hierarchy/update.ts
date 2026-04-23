import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IHierarchyNode, IUpdateHierarchyNodeParams } from './types';

export async function updateHierarchyNode(
  connection: ICalmConnection,
  uuid: string,
  params: IUpdateHierarchyNodeParams,
): Promise<IHierarchyNode> {
  const response = await connection.makeRequest<IHierarchyNode>({
    service: 'hierarchy',
    url: `/HierarchyNodes/${encodeURIComponent(uuid)}`,
    method: 'PATCH',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

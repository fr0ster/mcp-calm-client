import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateHierarchyNodeParams, IHierarchyNode } from './types';

export async function createHierarchyNode(
  connection: ICalmConnection,
  params: ICreateHierarchyNodeParams,
): Promise<IHierarchyNode> {
  const response = await connection.makeRequest<IHierarchyNode>({
    service: 'hierarchy',
    url: '/HierarchyNodes',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

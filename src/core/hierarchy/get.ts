import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IHierarchyNode } from './types';

export async function getHierarchyNode(
  connection: ICalmConnection,
  uuid: string,
): Promise<IHierarchyNode> {
  const response = await connection.makeRequest<IHierarchyNode>({
    service: 'hierarchy',
    url: `/HierarchyNodes/${encodeURIComponent(uuid)}`,
    method: 'GET',
  });
  return response.data;
}

/**
 * Fetch a hierarchy node with expanded navigation properties
 * (e.g. `['toParentNode', 'toChildNodes']`).
 *
 * Returns `T` as a generic escape hatch: the Cloud ALM expand payload
 * shape depends on which relations were requested, so strict typing is
 * left to the caller — pass your own `T` for type safety.
 */
export async function getHierarchyNodeWithExpand<T = unknown>(
  connection: ICalmConnection,
  uuid: string,
  expand: string[],
): Promise<T> {
  const qs = expand.length === 0 ? '' : `?$expand=${expand.join(',')}`;
  const response = await connection.makeRequest<T>({
    service: 'hierarchy',
    url: `/HierarchyNodes/${encodeURIComponent(uuid)}${qs}`,
    method: 'GET',
  });
  return response.data;
}

import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { createHierarchyNode } from './create';
import { deleteHierarchyNode } from './delete';
import { getHierarchyNode, getHierarchyNodeWithExpand } from './get';
import { listHierarchyNodes } from './list';
import type {
  ICreateHierarchyNodeParams,
  IHierarchyNode,
  IUpdateHierarchyNodeParams,
} from './types';
import { updateHierarchyNode } from './update';

/**
 * Handler for the Cloud ALM Process Hierarchy OData service
 * (`/calm-processhierarchy/v1`).
 */
export class CalmHierarchy {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  list(query?: ODataQuery): Promise<IODataCollection<IHierarchyNode>> {
    return listHierarchyNodes(this.connection, query);
  }

  get(uuid: string): Promise<IHierarchyNode> {
    return getHierarchyNode(this.connection, uuid);
  }

  getWithExpand<T = unknown>(uuid: string, expand: string[]): Promise<T> {
    return getHierarchyNodeWithExpand<T>(this.connection, uuid, expand);
  }

  create(params: ICreateHierarchyNodeParams): Promise<IHierarchyNode> {
    return createHierarchyNode(this.connection, params);
  }

  update(
    uuid: string,
    params: IUpdateHierarchyNodeParams,
  ): Promise<IHierarchyNode> {
    return updateHierarchyNode(this.connection, uuid, params);
  }

  delete(uuid: string): Promise<void> {
    return deleteHierarchyNode(this.connection, uuid);
  }
}

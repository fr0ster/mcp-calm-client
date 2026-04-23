export interface IHierarchyNode {
  uuid?: string;
  displayId?: string;
  title?: string;
  description?: string;
  hierarchyLevel?: number;
  sequence?: number;
  parentTitles?: string;
  parentNodeUuid?: string;
  rootNodeUuid?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface ICreateHierarchyNodeParams {
  title: string;
  description?: string;
  parentNodeUuid?: string;
  sequence?: number;
}

export interface IUpdateHierarchyNodeParams {
  title?: string;
  description?: string;
  sequence?: number;
}

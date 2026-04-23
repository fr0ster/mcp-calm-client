/**
 * Public Feature entity (shape returned by Cloud ALM Features API).
 * All fields are optional because Cloud ALM may omit unset values.
 */
export interface IFeature {
  uuid?: string;
  displayId?: string;
  title?: string;
  description?: string;
  projectId?: string;
  statusCode?: string;
  /** Cloud ALM API returns a numeric priority on read but accepts a string on write (see ICreateFeatureParams.priorityCode). */
  priorityCode?: number;
  releaseId?: string;
  scopeId?: string;
  responsibleId?: string;
  modifiedAt?: string;
  createdAt?: string;
  type?: string;
  workstreamId?: string;
  tags?: string[];
}

export interface IExternalReference {
  id?: string;
  parentUuid?: string;
  name?: string;
  url?: string;
}

export interface IFeaturePriority {
  code: string;
  name: string;
}

export interface IFeatureStatus {
  code: string;
  name: string;
}

/**
 * Payload for creating a Feature. `title` and `projectId` are required;
 * all other fields may be omitted.
 */
export interface ICreateFeatureParams {
  title: string;
  projectId: string;
  description?: string;
  priorityCode?: string;
  statusCode?: string;
  releaseId?: string;
  scopeId?: string;
}

/**
 * Payload for updating a Feature. All fields are optional; only provided
 * fields are sent (axios JSON body omits undefined keys via `JSON.stringify`).
 */
export interface IUpdateFeatureParams {
  title?: string;
  description?: string;
  priorityCode?: string;
  statusCode?: string;
  releaseId?: string;
  scopeId?: string;
}

export interface ICreateExternalReferenceParams {
  id: string;
  parentUuid: string;
  name: string;
  url?: string;
}

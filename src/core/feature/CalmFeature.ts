import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { createFeature } from './create';
import { deleteFeature } from './delete';
import {
  createExternalReference,
  deleteExternalReference,
  listExternalReferences,
} from './externalReferences';
import {
  getFeature,
  getFeatureByDisplayId,
  getFeatureByDisplayIdWithExpand,
  getFeatureWithExpand,
} from './get';
import { listFeatures } from './list';
import { listFeaturePriorities, listFeatureStatuses } from './lookups';
import type {
  ICreateExternalReferenceParams,
  ICreateFeatureParams,
  IExternalReference,
  IFeature,
  IFeaturePriority,
  IFeatureStatus,
  IUpdateFeatureParams,
} from './types';
import { updateFeature } from './update';

/**
 * Handler for the Cloud ALM Features OData service (`/calm-features/v1`).
 *
 * All operations delegate to low-level functions in this module; the handler
 * is a thin bound wrapper to give consumers a discoverable API surface.
 */
export class CalmFeature {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  list(query?: ODataQuery): Promise<IODataCollection<IFeature>> {
    return listFeatures(this.connection, query);
  }

  get(uuid: string): Promise<IFeature> {
    return getFeature(this.connection, uuid);
  }

  getByDisplayId(displayId: string): Promise<IFeature> {
    return getFeatureByDisplayId(this.connection, displayId);
  }

  getWithExpand<T = unknown>(uuid: string, expand: string[]): Promise<T> {
    return getFeatureWithExpand<T>(this.connection, uuid, expand);
  }

  getByDisplayIdWithExpand<T = unknown>(
    displayId: string,
    expand: string[],
  ): Promise<T> {
    return getFeatureByDisplayIdWithExpand<T>(
      this.connection,
      displayId,
      expand,
    );
  }

  create(params: ICreateFeatureParams): Promise<IFeature> {
    return createFeature(this.connection, params);
  }

  update(uuid: string, params: IUpdateFeatureParams): Promise<IFeature> {
    return updateFeature(this.connection, uuid, params);
  }

  delete(uuid: string): Promise<void> {
    return deleteFeature(this.connection, uuid);
  }

  listExternalReferences(
    query?: ODataQuery,
  ): Promise<IODataCollection<IExternalReference>> {
    return listExternalReferences(this.connection, query);
  }

  createExternalReference(
    params: ICreateExternalReferenceParams,
  ): Promise<IExternalReference> {
    return createExternalReference(this.connection, params);
  }

  deleteExternalReference(id: string, parentUuid: string): Promise<void> {
    return deleteExternalReference(this.connection, id, parentUuid);
  }

  listPriorities(): Promise<IODataCollection<IFeaturePriority>> {
    return listFeaturePriorities(this.connection);
  }

  listStatuses(): Promise<IODataCollection<IFeatureStatus>> {
    return listFeatureStatuses(this.connection);
  }
}

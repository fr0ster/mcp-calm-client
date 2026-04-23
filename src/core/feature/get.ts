import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import { CalmApiError } from '../../errors/CalmApiError';
import { ODataQuery } from '../../odata/ODataQuery';
import { listFeatures } from './list';
import type { IFeature } from './types';

export async function getFeature(
  connection: ICalmConnection,
  uuid: string,
): Promise<IFeature> {
  const response = await connection.makeRequest<IFeature>({
    service: 'features',
    url: `/Features/${encodeURIComponent(uuid)}`,
    method: 'GET',
  });
  return response.data;
}

export async function getFeatureByDisplayId(
  connection: ICalmConnection,
  displayId: string,
): Promise<IFeature> {
  const escaped = displayId.replace(/'/g, "''");
  const collection = await listFeatures(
    connection,
    ODataQuery.new().filter(`displayId eq '${escaped}'`).top(1),
  );
  const first = collection.value?.[0];
  if (!first) {
    throw CalmApiError.fromNotFound('Feature (displayId)', displayId);
  }
  return first;
}

export async function getFeatureWithExpand<T = unknown>(
  connection: ICalmConnection,
  uuid: string,
  expand: string[],
): Promise<T> {
  const qs = expand.length === 0 ? '' : `?$expand=${expand.join(',')}`;
  const response = await connection.makeRequest<T>({
    service: 'features',
    url: `/Features/${encodeURIComponent(uuid)}${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function getFeatureByDisplayIdWithExpand<T = unknown>(
  connection: ICalmConnection,
  displayId: string,
  expand: string[],
): Promise<T> {
  const feature = await getFeatureByDisplayId(connection, displayId);
  if (!feature.uuid) {
    throw new CalmApiError({
      code: 'UNKNOWN',
      message: `Feature '${displayId}' has no uuid; cannot expand`,
      status: 500,
    });
  }
  return getFeatureWithExpand<T>(connection, feature.uuid, expand);
}

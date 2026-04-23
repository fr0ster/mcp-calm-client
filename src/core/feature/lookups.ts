import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { IFeaturePriority, IFeatureStatus } from './types';

export async function listFeaturePriorities(
  connection: ICalmConnection,
): Promise<IODataCollection<IFeaturePriority>> {
  const response = await connection.makeRequest<
    IODataCollection<IFeaturePriority>
  >({
    service: 'features',
    url: '/FeaturePriorities',
    method: 'GET',
  });
  return response.data;
}

export async function listFeatureStatuses(
  connection: ICalmConnection,
): Promise<IODataCollection<IFeatureStatus>> {
  const response = await connection.makeRequest<
    IODataCollection<IFeatureStatus>
  >({
    service: 'features',
    url: '/FeatureStatus',
    method: 'GET',
  });
  return response.data;
}

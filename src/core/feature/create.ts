import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateFeatureParams, IFeature } from './types';

export async function createFeature(
  connection: ICalmConnection,
  params: ICreateFeatureParams,
): Promise<IFeature> {
  const response = await connection.makeRequest<IFeature>({
    service: 'features',
    url: '/Features',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

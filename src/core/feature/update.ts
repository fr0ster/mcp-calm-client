import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IFeature, IUpdateFeatureParams } from './types';

export async function updateFeature(
  connection: ICalmConnection,
  uuid: string,
  params: IUpdateFeatureParams,
): Promise<IFeature> {
  const response = await connection.makeRequest<IFeature>({
    service: 'features',
    url: `/Features/${encodeURIComponent(uuid)}`,
    method: 'PATCH',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

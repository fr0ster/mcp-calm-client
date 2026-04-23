import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type {
  ICreateExternalReferenceParams,
  IExternalReference,
} from './types';

export async function listExternalReferences(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IExternalReference>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<
    IODataCollection<IExternalReference>
  >({
    service: 'features',
    url: `/ExternalReferences${qs}`,
    method: 'GET',
  });
  return response.data;
}

export async function createExternalReference(
  connection: ICalmConnection,
  params: ICreateExternalReferenceParams,
): Promise<IExternalReference> {
  const response = await connection.makeRequest<IExternalReference>({
    service: 'features',
    url: '/ExternalReferences',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

export async function deleteExternalReference(
  connection: ICalmConnection,
  id: string,
  parentUuid: string,
): Promise<void> {
  await connection.makeRequest({
    service: 'features',
    url: `/ExternalReferences/${encodeURIComponent(id)}/${encodeURIComponent(parentUuid)}`,
    method: 'DELETE',
  });
}

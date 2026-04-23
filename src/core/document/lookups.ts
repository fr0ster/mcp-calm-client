import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { IDocumentStatus, IDocumentType } from './types';

export async function listDocumentTypes(
  connection: ICalmConnection,
): Promise<IODataCollection<IDocumentType>> {
  const response = await connection.makeRequest<
    IODataCollection<IDocumentType>
  >({
    service: 'documents',
    url: '/DocumentTypes',
    method: 'GET',
  });
  return response.data;
}

export async function listDocumentStatuses(
  connection: ICalmConnection,
): Promise<IODataCollection<IDocumentStatus>> {
  const response = await connection.makeRequest<
    IODataCollection<IDocumentStatus>
  >({
    service: 'documents',
    url: '/DocumentStatus',
    method: 'GET',
  });
  return response.data;
}

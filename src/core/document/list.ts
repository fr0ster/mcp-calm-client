import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import type { IDocument } from './types';

export async function listDocuments(
  connection: ICalmConnection,
  query?: ODataQuery,
): Promise<IODataCollection<IDocument>> {
  const qs = query ? query.toQueryString() : '';
  const response = await connection.makeRequest<IODataCollection<IDocument>>({
    service: 'documents',
    url: `/Documents${qs}`,
    method: 'GET',
  });
  return response.data;
}

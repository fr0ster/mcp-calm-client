import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IDocument } from './types';

export async function getDocument(
  connection: ICalmConnection,
  uuid: string,
): Promise<IDocument> {
  const response = await connection.makeRequest<IDocument>({
    service: 'documents',
    url: `/Documents/${encodeURIComponent(uuid)}`,
    method: 'GET',
  });
  return response.data;
}

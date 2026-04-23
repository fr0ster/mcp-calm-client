import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IDocument, IUpdateDocumentParams } from './types';

export async function updateDocument(
  connection: ICalmConnection,
  uuid: string,
  params: IUpdateDocumentParams,
): Promise<IDocument> {
  const response = await connection.makeRequest<IDocument>({
    service: 'documents',
    url: `/Documents/${encodeURIComponent(uuid)}`,
    method: 'PATCH',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

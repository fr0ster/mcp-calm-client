import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ICreateDocumentParams, IDocument } from './types';

export async function createDocument(
  connection: ICalmConnection,
  params: ICreateDocumentParams,
): Promise<IDocument> {
  const response = await connection.makeRequest<IDocument>({
    service: 'documents',
    url: '/Documents',
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

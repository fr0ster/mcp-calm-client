import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { createDocument } from './create';
import { deleteDocument } from './delete';
import { getDocument } from './get';
import { listDocuments } from './list';
import { listDocumentStatuses, listDocumentTypes } from './lookups';
import type {
  ICreateDocumentParams,
  IDocument,
  IDocumentStatus,
  IDocumentType,
  IUpdateDocumentParams,
} from './types';
import { updateDocument } from './update';

/**
 * Handler for the Cloud ALM Documents OData service (`/calm-documents/v1`).
 */
export class CalmDocument {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  list(query?: ODataQuery): Promise<IODataCollection<IDocument>> {
    return listDocuments(this.connection, query);
  }

  get(uuid: string): Promise<IDocument> {
    return getDocument(this.connection, uuid);
  }

  create(params: ICreateDocumentParams): Promise<IDocument> {
    return createDocument(this.connection, params);
  }

  update(uuid: string, params: IUpdateDocumentParams): Promise<IDocument> {
    return updateDocument(this.connection, uuid, params);
  }

  delete(uuid: string): Promise<void> {
    return deleteDocument(this.connection, uuid);
  }

  listTypes(): Promise<IODataCollection<IDocumentType>> {
    return listDocumentTypes(this.connection);
  }

  listStatuses(): Promise<IODataCollection<IDocumentStatus>> {
    return listDocumentStatuses(this.connection);
  }
}

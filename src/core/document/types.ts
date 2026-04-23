export interface IDocument {
  uuid?: string;
  displayId?: string;
  title?: string;
  content?: string;
  /** Cloud ALM API returns a numeric status on read but accepts a string on write. */
  statusCode?: number;
  /** Cloud ALM API returns a numeric priority on read but accepts a string on write. */
  priorityCode?: number;
  /** Read-side field is `documentTypeCode`; write-side uses `typeCode` (see ICreateDocumentParams.typeCode). */
  documentTypeCode?: string;
  sourceCode?: string;
  projectId?: string;
  scopeId?: string;
  modifiedAt?: string;
  createdAt?: string;
  tags?: string[];
}

export interface IDocumentType {
  code: string;
  name: string;
}

export interface IDocumentStatus {
  code: number;
  name: string;
}

export interface ICreateDocumentParams {
  title: string;
  content?: string;
  projectId?: string;
  /** On write the field is `typeCode`; on read it comes back as `documentTypeCode`. */
  typeCode?: string;
  statusCode?: string;
  priorityCode?: string;
}

export interface IUpdateDocumentParams {
  title?: string;
  content?: string;
  statusCode?: string;
  priorityCode?: string;
  typeCode?: string;
}

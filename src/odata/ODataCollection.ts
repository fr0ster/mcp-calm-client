export interface IODataCollection<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

export interface IODataErrorItem {
  code?: string;
  message: string;
  target?: string;
}

export interface IODataErrorDetail {
  code: string;
  message: string;
  details?: IODataErrorItem[];
}

export interface IODataErrorResponse {
  error: IODataErrorDetail;
}

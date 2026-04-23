import type { IODataErrorDetail } from '../odata/ODataCollection';
import { CALM_API_ERROR_CODES, type CalmApiErrorCode } from './codes';

export interface ICalmApiErrorOptions {
  code: CalmApiErrorCode;
  message: string;
  status?: number;
  serviceCode?: string;
  body?: unknown;
  cause?: unknown;
}

export class CalmApiError extends Error {
  readonly code: CalmApiErrorCode;
  readonly status?: number;
  readonly serviceCode?: string;
  readonly body?: unknown;

  constructor(opts: ICalmApiErrorOptions) {
    super(opts.message);
    this.name = 'CalmApiError';
    this.code = opts.code;
    this.status = opts.status;
    this.serviceCode = opts.serviceCode;
    this.body = opts.body;
    if (opts.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
    Object.setPrototypeOf(this, CalmApiError.prototype);
  }

  static fromOData(
    status: number,
    detail: IODataErrorDetail,
    body?: unknown,
  ): CalmApiError {
    return new CalmApiError({
      code: CALM_API_ERROR_CODES.ODATA_ERROR,
      message: `OData error [${detail.code}]: ${detail.message}`,
      status,
      serviceCode: detail.code,
      body,
    });
  }

  static fromHttp(status: number, body: string): CalmApiError {
    return new CalmApiError({
      code: CALM_API_ERROR_CODES.HTTP_ERROR,
      message: `HTTP error ${status}: ${body.slice(0, 200)}`,
      status,
      body,
    });
  }

  /**
   * Client-side "not found" — used when a collection query returned no rows
   * for a key (e.g. `getByDisplayId`), and therefore no transport 404 was
   * actually emitted by the server. Distinct from `fromHttp(404)`.
   */
  static fromNotFound(entity: string, key: string): CalmApiError {
    return new CalmApiError({
      code: CALM_API_ERROR_CODES.NOT_FOUND,
      message: `${entity} with key '${key}' not found`,
      status: 404,
    });
  }

  static fromJsonParse(cause: unknown, snippet?: string): CalmApiError {
    const hint = snippet ? ` — body: ${snippet.slice(0, 200)}` : '';
    return new CalmApiError({
      code: CALM_API_ERROR_CODES.JSON_PARSE,
      message: `Failed to parse response${hint}`,
      cause,
    });
  }

  static fromNetwork(cause: unknown, message?: string): CalmApiError {
    return new CalmApiError({
      code: CALM_API_ERROR_CODES.NETWORK,
      message: message ?? 'Network request failed',
      cause,
    });
  }
}

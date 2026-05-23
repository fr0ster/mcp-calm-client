import { CalmApiError } from '../errors/CalmApiError';
import type { IODataErrorResponse } from '../odata/ODataCollection';

function hasODataErrorShape(data: unknown): data is IODataErrorResponse {
  if (typeof data !== 'object' || data === null) return false;
  const err = (data as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) return false;
  const d = err as { code?: unknown; message?: unknown };
  return typeof d.code === 'string' && typeof d.message === 'string';
}

/**
 * Build a `CalmApiError` from an already-extracted HTTP status and a
 * parsed response body. Transport-agnostic: works for fetch, axios, or
 * any client that can hand over (status, body).
 */
export function calmErrorFromBody(status: number, data: unknown): CalmApiError {
  if (hasODataErrorShape(data)) {
    return CalmApiError.fromOData(status, data.error, data);
  }
  const body = typeof data === 'string' ? data : JSON.stringify(data ?? '');
  return CalmApiError.fromHttp(status, body);
}

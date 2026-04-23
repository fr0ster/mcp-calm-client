import type { AxiosError } from 'axios';
import { CalmApiError } from '../errors/CalmApiError';
import type { IODataErrorResponse } from '../odata/ODataCollection';

function hasODataErrorShape(data: unknown): data is IODataErrorResponse {
  if (typeof data !== 'object' || data === null) return false;
  const err = (data as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) return false;
  const d = err as { code?: unknown; message?: unknown };
  return typeof d.code === 'string' && typeof d.message === 'string';
}

export function toCalmApiError(cause: unknown): CalmApiError {
  if (cause instanceof CalmApiError) return cause;

  const axiosErr = cause as AxiosError<unknown> | undefined;
  const response = axiosErr?.response;

  if (response) {
    const status = response.status;
    const data = response.data;

    if (hasODataErrorShape(data)) {
      return CalmApiError.fromOData(status, data.error, data);
    }

    const body = typeof data === 'string' ? data : JSON.stringify(data ?? '');
    return CalmApiError.fromHttp(status, body);
  }

  const message = cause instanceof Error ? cause.message : String(cause);
  return CalmApiError.fromNetwork(cause, message);
}

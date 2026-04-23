import type { ITokenRefresher } from '@mcp-abap-adt/interfaces';
import { AxiosError, type AxiosInstance } from 'axios';
import { CalmConnection } from '../../../connection/CalmConnection';
import { CalmApiError } from '../../../errors/CalmApiError';
import { CALM_API_ERROR_CODES } from '../../../errors/codes';

function makeAxiosMock(
  handler: (req: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  }) => unknown,
): AxiosInstance {
  const request = jest.fn(async (cfg: Record<string, unknown>) => {
    const result = handler(cfg as Parameters<typeof handler>[0]);
    if (result instanceof Error) throw result;
    return result;
  });
  return { request } as unknown as AxiosInstance;
}

function axiosResponse<T>(status: number, data: T) {
  return {
    status,
    statusText: 'OK',
    headers: {},
    data,
    config: {},
  };
}

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const err = new AxiosError('req failed');
  err.response = {
    status,
    statusText: 'ERR',
    headers: {},
    data,
    config: {} as never,
  };
  return err;
}

describe('CalmConnection', () => {
  describe('construction', () => {
    test('oauth2 mode requires tokenRefresher', () => {
      expect(
        () => new CalmConnection({ baseUrl: 'https://x', mode: 'oauth2' }),
      ).toThrow(/tokenRefresher/);
    });

    test('sandbox mode requires apiKey', () => {
      expect(
        () => new CalmConnection({ baseUrl: 'https://x', mode: 'sandbox' }),
      ).toThrow(/apiKey/);
    });

    test('mode auto-detected from tokenRefresher', () => {
      const refresher: ITokenRefresher = {
        getToken: async () => 'tok',
        refreshToken: async () => 'tok',
      };
      const c = new CalmConnection({
        baseUrl: 'https://x',
        tokenRefresher: refresher,
      });
      expect(c).toBeDefined();
    });

    test('mode auto-detected from apiKey', () => {
      const c = new CalmConnection({ baseUrl: 'https://x', apiKey: 'sk' });
      expect(c).toBeDefined();
    });
  });

  describe('URL composition', () => {
    test('oauth2 prepends /api prefix', async () => {
      const c = new CalmConnection({
        baseUrl: 'https://tenant.eu10.alm.cloud.sap/',
        tokenRefresher: {
          getToken: async () => 't',
          refreshToken: async () => 't',
        },
      });
      expect(await c.getServiceUrl('features')).toBe(
        'https://tenant.eu10.alm.cloud.sap/api/calm-features/v1',
      );
    });

    test('sandbox has empty prefix', async () => {
      const c = new CalmConnection({
        baseUrl: 'https://sandbox.api.sap.com/SAPCALM',
        apiKey: 'sk',
      });
      expect(await c.getServiceUrl('features')).toBe(
        'https://sandbox.api.sap.com/SAPCALM/calm-features/v1',
      );
    });

    test('analytics service keeps its OData v4 suffix', async () => {
      const c = new CalmConnection({
        baseUrl: 'https://t.alm.cloud.sap',
        tokenRefresher: {
          getToken: async () => 't',
          refreshToken: async () => 't',
        },
      });
      expect(await c.getServiceUrl('analytics')).toBe(
        'https://t.alm.cloud.sap/api/calm-analytics/v1/odata/v4/analytics',
      );
    });

    test('apiPrefix override wins', async () => {
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        apiPrefix: '/custom',
      });
      expect(await c.getServiceUrl('tasks')).toBe(
        'https://x/custom/calm-tasks/v1',
      );
    });

    test('serviceRoutes override', async () => {
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        serviceRoutes: { features: '/v2/features' },
      });
      expect(await c.getServiceUrl('features')).toBe('https://x/v2/features');
    });
  });

  describe('auth header injection', () => {
    test('oauth2 sends Bearer token from tokenRefresher.getToken', async () => {
      let capturedAuth: string | undefined;
      const axiosMock = makeAxiosMock((req) => {
        capturedAuth = req.headers?.Authorization;
        return axiosResponse(200, { ok: true });
      });
      const refresher: ITokenRefresher = {
        getToken: jest.fn(async () => 'jwt-123'),
        refreshToken: jest.fn(async () => 'jwt-new'),
      };
      const c = new CalmConnection({
        baseUrl: 'https://x',
        tokenRefresher: refresher,
        axiosInstance: axiosMock,
      });
      await c.makeRequest({ url: '/ping', method: 'GET' });
      expect(capturedAuth).toBe('Bearer jwt-123');
      expect(refresher.getToken).toHaveBeenCalledTimes(1);
    });

    test('sandbox sends APIKey header', async () => {
      let capturedKey: string | undefined;
      const axiosMock = makeAxiosMock((req) => {
        capturedKey = req.headers?.APIKey;
        return axiosResponse(200, {});
      });
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sandbox-key',
        axiosInstance: axiosMock,
      });
      await c.makeRequest({ url: '/ping', method: 'GET' });
      expect(capturedKey).toBe('sandbox-key');
    });
  });

  describe('401 retry', () => {
    test('oauth2: refreshes token and retries once on 401', async () => {
      let call = 0;
      const axiosMock = makeAxiosMock(() => {
        call += 1;
        if (call === 1)
          return axiosErrorWithResponse(401, { error: 'unauthorized' });
        return axiosResponse(200, { ok: true });
      });
      const refresher: ITokenRefresher = {
        getToken: jest.fn(async () => 'old'),
        refreshToken: jest.fn(async () => 'new'),
      };
      const c = new CalmConnection({
        baseUrl: 'https://x',
        tokenRefresher: refresher,
        axiosInstance: axiosMock,
      });
      const res = await c.makeRequest({ url: '/ping', method: 'GET' });
      expect(res.status).toBe(200);
      expect(refresher.refreshToken).toHaveBeenCalledTimes(1);
      expect(call).toBe(2);
    });

    test('sandbox: no retry on 401', async () => {
      let call = 0;
      const axiosMock = makeAxiosMock(() => {
        call += 1;
        return axiosErrorWithResponse(401, { error: 'bad key' });
      });
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      await expect(
        c.makeRequest({ url: '/ping', method: 'GET' }),
      ).rejects.toBeInstanceOf(CalmApiError);
      expect(call).toBe(1);
    });

    test('persistent 401: second failure surfaces as CalmApiError', async () => {
      const axiosMock = makeAxiosMock(() =>
        axiosErrorWithResponse(401, { error: 'still bad' }),
      );
      const refresher: ITokenRefresher = {
        getToken: async () => 'old',
        refreshToken: async () => 'new',
      };
      const c = new CalmConnection({
        baseUrl: 'https://x',
        tokenRefresher: refresher,
        axiosInstance: axiosMock,
      });
      await expect(
        c.makeRequest({ url: '/ping', method: 'GET' }),
      ).rejects.toBeInstanceOf(CalmApiError);
    });
  });

  describe('error translation', () => {
    test('OData error envelope → CalmApiError.fromOData', async () => {
      const axiosMock = makeAxiosMock(() =>
        axiosErrorWithResponse(400, {
          error: { code: 'INVALID_INPUT', message: 'Field required' },
        }),
      );
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      try {
        await c.makeRequest({ url: '/x', method: 'POST' });
        fail('expected to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(CalmApiError);
        const e = err as CalmApiError;
        expect(e.code).toBe(CALM_API_ERROR_CODES.ODATA_ERROR);
        expect(e.serviceCode).toBe('INVALID_INPUT');
        expect(e.status).toBe(400);
      }
    });

    test('plain HTTP error → CalmApiError.fromHttp', async () => {
      const axiosMock = makeAxiosMock(() =>
        axiosErrorWithResponse(500, 'server down'),
      );
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      await expect(
        c.makeRequest({ url: '/x', method: 'GET' }),
      ).rejects.toMatchObject({
        code: CALM_API_ERROR_CODES.HTTP_ERROR,
        status: 500,
      });
    });

    test('network error → CalmApiError.fromNetwork', async () => {
      const axiosMock = makeAxiosMock(() => new Error('ECONNREFUSED'));
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      await expect(
        c.makeRequest({ url: '/x', method: 'GET' }),
      ).rejects.toMatchObject({
        code: CALM_API_ERROR_CODES.NETWORK,
      });
    });
  });

  describe('request composition', () => {
    test('routes via service when specified', async () => {
      let capturedUrl = '';
      const axiosMock = makeAxiosMock((req) => {
        capturedUrl = req.url ?? '';
        return axiosResponse(200, {});
      });
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      await c.makeRequest({
        service: 'features',
        url: '/Features',
        method: 'GET',
      });
      expect(capturedUrl).toBe('https://x/calm-features/v1/Features');
    });

    test('direct url without service goes under apiPrefix', async () => {
      let capturedUrl = '';
      const axiosMock = makeAxiosMock((req) => {
        capturedUrl = req.url ?? '';
        return axiosResponse(200, {});
      });
      const c = new CalmConnection({
        baseUrl: 'https://x',
        tokenRefresher: {
          getToken: async () => 't',
          refreshToken: async () => 't',
        },
        axiosInstance: axiosMock,
      });
      await c.makeRequest({ url: '/direct/path', method: 'GET' });
      expect(capturedUrl).toBe('https://x/api/direct/path');
    });

    test('default Accept: application/json header applied', async () => {
      let capturedAccept: string | undefined;
      const axiosMock = makeAxiosMock((req) => {
        capturedAccept = req.headers?.Accept;
        return axiosResponse(200, {});
      });
      const c = new CalmConnection({
        baseUrl: 'https://x',
        apiKey: 'sk',
        axiosInstance: axiosMock,
      });
      await c.makeRequest({ url: '/x', method: 'GET' });
      expect(capturedAccept).toBe('application/json');
    });
  });
});

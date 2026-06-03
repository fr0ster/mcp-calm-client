import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmLog } from '../../../core/log/CalmLog';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-logs/v1',
    makeRequest: async <T, D>(opts: ICalmRequestOptions) => {
      calls.push(opts);
      const r = respond(opts);
      if (r instanceof Error) throw r;
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: r as T,
        config: {},
      } as ICalmResponse<T, D>;
    },
  };
  return { connection, calls };
}

describe('CalmLog', () => {
  test('get forwards provider and a plain serviceId query param', async () => {
    const { connection, calls } = mockConnection(() => ({ logs: [] }));
    const l = new CalmLog(connection);
    await l.get({ provider: 'sap-alm', serviceId: 'svc-1', limit: 100 });
    expect(calls[0]).toMatchObject({
      service: 'logs',
      method: 'GET',
      url: '/logs',
    });
    // serviceId MUST be a plain top-level param — the live Logs API
    // rejects the bracket form `logsFilters[serviceId]` with HTTP 428.
    expect(calls[0].params).toMatchObject({
      provider: 'sap-alm',
      serviceId: 'svc-1',
      limit: 100,
    });
    expect(calls[0].params).not.toHaveProperty('logsFilters[serviceId]');
  });

  test('get forwards all optional filters', async () => {
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({
      provider: 'p',
      format: 'otlp',
      version: 'v1',
      category: 'ABAP Runtime',
      period: '1h',
      from: '2026-01-01',
      to: '2026-04-01',
      limit: 50,
      offset: 0,
      observedTimestamp: true,
      onLimit: 'reject',
    });
    expect(calls[0].params).toMatchObject({
      provider: 'p',
      format: 'otlp',
      version: 'v1',
      category: 'ABAP Runtime',
      period: '1h',
      from: '2026-01-01',
      to: '2026-04-01',
      limit: 50,
      offset: 0,
      observedTimestamp: true,
      onLimit: 'reject',
    });
  });

  test('get defaults onLimit to truncate when limit is set and onLimit is not', async () => {
    // The live Logs API 403s on `limit` alone (count-cap) — it only pages
    // with onLimit=truncate. So get() injects truncate when paging is asked
    // for without an explicit strategy.
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({ provider: 'p', limit: 5 });
    expect(calls[0].params).toMatchObject({ limit: 5, onLimit: 'truncate' });
  });

  test('get defaults onLimit to truncate when offset is set and onLimit is not', async () => {
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({ provider: 'p', offset: 10 });
    expect(calls[0].params).toMatchObject({ offset: 10, onLimit: 'truncate' });
  });

  test('get does NOT inject onLimit when no paging is requested', async () => {
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({ provider: 'p', period: '10M' });
    expect(calls[0].params).not.toHaveProperty('onLimit');
  });

  test('get keeps an explicit onLimit over the truncate default', async () => {
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({ provider: 'p', limit: 5, onLimit: 'reject' });
    expect(calls[0].params).toMatchObject({ limit: 5, onLimit: 'reject' });
  });

  test('post forwards useCase/serviceId in query and records as body', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return {};
    });
    const l = new CalmLog(connection);
    await l.post({ useCase: 'deploy', serviceId: 'svc-1', tag: 'prod' }, [
      { ts: 1, msg: 'hello' },
    ]);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/logs');
    expect(calls[0].params).toMatchObject({
      useCase: 'deploy',
      serviceId: 'svc-1',
      tag: 'prod',
    });
    expect(body).toEqual([{ ts: 1, msg: 'hello' }]);
    expect(headers?.['Content-Type']).toBe('application/json');
  });

  test('get uses 60s timeout override', async () => {
    const { connection, calls } = mockConnection(() => ({}));
    const l = new CalmLog(connection);
    await l.get({ provider: 'p' });
    expect(calls[0].timeout).toBe(60_000);
  });
});

import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmAnalytics } from '../../../core/analytics/CalmAnalytics';
import { ANALYTICS_ENDPOINTS } from '../../../core/analytics/types';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-analytics/v1/odata/v4/analytics',
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

describe('CalmAnalytics', () => {
  test('getEndpoint routes to /<name>', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const a = new CalmAnalytics(connection);
    await a.getEndpoint('Tasks');
    expect(calls[0]).toMatchObject({
      service: 'analytics',
      method: 'GET',
      url: '/Tasks',
    });
  });

  test('getEndpoint with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const a = new CalmAnalytics(connection);
    await a.getEndpoint(
      'Requirements',
      ODataQuery.new().top(2).filter('open eq true'),
    );
    expect(calls[0].url).toMatch(/^\/Requirements\?\$filter=/);
    expect(calls[0].url).toContain('$top=2');
  });

  test('queryDataset combines provider filter with additional', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const a = new CalmAnalytics(connection);
    await a.queryDataset('Defects', {
      additionalFilter: 'severity eq 1',
      top: 10,
    });
    const url = calls[0].url;
    expect(url).toMatch(/^\/DataSet\?\$filter=/);
    expect(decodeURIComponent(url)).toContain(
      "provider eq 'Defects' and severity eq 1",
    );
    expect(url).toContain('$top=10');
  });

  test('queryDataset escapes single quotes in provider', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const a = new CalmAnalytics(connection);
    await a.queryDataset("O'Reilly", {});
    expect(decodeURIComponent(calls[0].url)).toContain(
      "provider eq 'O''Reilly'",
    );
  });

  test('listProviders returns static list covering every endpoint', () => {
    const { connection } = mockConnection(() => undefined);
    const a = new CalmAnalytics(connection);
    const result = a.listProviders();
    expect(result.providers).toHaveLength(ANALYTICS_ENDPOINTS.length);
    const names = result.providers.map((p) => p.name).sort();
    const expected = [...ANALYTICS_ENDPOINTS].sort();
    expect(names).toEqual(expected);
  });
});

import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmFeature } from '../../../core/feature/CalmFeature';
import { CalmApiError } from '../../../errors/CalmApiError';
import { ODataQuery } from '../../../odata/ODataQuery';

interface IRecordedRequest extends ICalmRequestOptions {}

function mockConnection(respond: (req: IRecordedRequest) => unknown): {
  connection: ICalmConnection;
  calls: IRecordedRequest[];
} {
  const calls: IRecordedRequest[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-features/v1',
    makeRequest: async <T, D>(opts: ICalmRequestOptions) => {
      calls.push(opts);
      const result = respond(opts);
      if (result instanceof Error) throw result;
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: result as T,
        config: {},
      } as ICalmResponse<T, D>;
    },
  };
  return { connection, calls };
}

describe('CalmFeature', () => {
  test('list issues GET /Features with no query', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const f = new CalmFeature(connection);
    await f.list();
    expect(calls[0]).toMatchObject({
      service: 'features',
      method: 'GET',
      url: '/Features',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const f = new CalmFeature(connection);
    await f.list(ODataQuery.new().filter("projectId eq 'P1'").top(10));
    expect(calls[0].url).toMatch(/^\/Features\?\$filter=/);
    expect(calls[0].url).toContain('$top=10');
  });

  test('get uses uuid with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'u/1' }));
    const f = new CalmFeature(connection);
    await f.get('u/1');
    expect(calls[0].url).toBe('/Features/u%2F1');
    expect(calls[0].method).toBe('GET');
  });

  test('getByDisplayId escapes single quotes in filter', async () => {
    let capturedUrl = '';
    const { connection } = mockConnection((req) => {
      capturedUrl = req.url;
      return { value: [{ uuid: 'abc', displayId: "o'malley" }] };
    });
    const f = new CalmFeature(connection);
    const res = await f.getByDisplayId("o'malley");
    expect(res.uuid).toBe('abc');
    expect(capturedUrl).toContain('displayId%20eq%20%27o%27%27malley%27');
  });

  test('getByDisplayId throws CalmApiError(404) when empty collection', async () => {
    const { connection } = mockConnection(() => ({ value: [] }));
    const f = new CalmFeature(connection);
    await expect(f.getByDisplayId('missing')).rejects.toBeInstanceOf(
      CalmApiError,
    );
    await expect(f.getByDisplayId('missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  test('getWithExpand appends $expand', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'x' }));
    const f = new CalmFeature(connection);
    await f.getWithExpand('x', ['externalReferences', 'status']);
    expect(calls[0].url).toBe('/Features/x?$expand=externalReferences,status');
  });

  test('getByDisplayIdWithExpand does two requests: filter then expand', async () => {
    let step = 0;
    const { connection, calls } = mockConnection(() => {
      step += 1;
      if (step === 1)
        return { value: [{ uuid: 'uuid-9', displayId: '6-123' }] };
      return { uuid: 'uuid-9', externalReferences: [] };
    });
    const f = new CalmFeature(connection);
    await f.getByDisplayIdWithExpand('6-123', ['externalReferences']);
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain(
      "displayId%20eq%20'6-123'".replace(/'/g, '%27'),
    );
    expect(calls[1].url).toBe('/Features/uuid-9?$expand=externalReferences');
  });

  test('create issues POST with JSON content-type and body', async () => {
    let capturedBody: unknown;
    let capturedHeaders: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      capturedBody = req.data;
      capturedHeaders = req.headers;
      return { uuid: 'new-uuid', title: 'T' };
    });
    const f = new CalmFeature(connection);
    const res = await f.create({ title: 'T', projectId: 'P' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/Features');
    expect(capturedBody).toEqual({ title: 'T', projectId: 'P' });
    expect(capturedHeaders?.['Content-Type']).toBe('application/json');
    expect(res.uuid).toBe('new-uuid');
  });

  test('update uses PATCH with uuid in URL', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'u' }));
    const f = new CalmFeature(connection);
    await f.update('u', { title: 'new' });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('/Features/u');
    expect(calls[0].data).toEqual({ title: 'new' });
  });

  test('delete uses DELETE', async () => {
    const { connection, calls } = mockConnection(() => undefined);
    const f = new CalmFeature(connection);
    await f.delete('u');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/Features/u');
  });

  test('external references: list/create/delete route to /ExternalReferences', async () => {
    const { connection, calls } = mockConnection((req) => {
      if (req.method === 'GET') return { value: [] };
      if (req.method === 'POST')
        return { id: 'r1', parentUuid: 'u', name: 'n' };
      return undefined;
    });
    const f = new CalmFeature(connection);
    await f.listExternalReferences();
    await f.createExternalReference({ id: 'r1', parentUuid: 'u', name: 'n' });
    await f.deleteExternalReference('r1', 'u');
    expect(calls[0].url).toBe('/ExternalReferences');
    expect(calls[0].method).toBe('GET');
    expect(calls[1].url).toBe('/ExternalReferences');
    expect(calls[1].method).toBe('POST');
    expect(calls[2].url).toBe('/ExternalReferences/r1/u');
    expect(calls[2].method).toBe('DELETE');
  });

  test('lookups list priorities and statuses', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const f = new CalmFeature(connection);
    await f.listPriorities();
    await f.listStatuses();
    expect(calls[0].url).toBe('/FeaturePriorities');
    expect(calls[1].url).toBe('/FeatureStatus');
  });
});

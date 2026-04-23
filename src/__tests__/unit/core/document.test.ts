import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmDocument } from '../../../core/document/CalmDocument';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-documents/v1',
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

describe('CalmDocument', () => {
  test('list issues GET /Documents', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const d = new CalmDocument(connection);
    await d.list();
    expect(calls[0]).toMatchObject({
      service: 'documents',
      method: 'GET',
      url: '/Documents',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const d = new CalmDocument(connection);
    await d.list(ODataQuery.new().filter("projectId eq 'P1'").top(5));
    expect(calls[0].url).toMatch(/^\/Documents\?\$filter=/);
    expect(calls[0].url).toContain('$top=5');
  });

  test('get uses uuid with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'a/b' }));
    const d = new CalmDocument(connection);
    await d.get('a/b');
    expect(calls[0].url).toBe('/Documents/a%2Fb');
  });

  test('create posts JSON body and returns entity', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return { uuid: 'u', title: 'T' };
    });
    const d = new CalmDocument(connection);
    const res = await d.create({ title: 'T', typeCode: 'SPEC' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/Documents');
    expect(body).toEqual({ title: 'T', typeCode: 'SPEC' });
    expect(headers?.['Content-Type']).toBe('application/json');
    expect(res.uuid).toBe('u');
  });

  test('update uses PATCH with uuid in URL', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'u' }));
    const d = new CalmDocument(connection);
    await d.update('u', { title: 'renamed' });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('/Documents/u');
    expect(calls[0].data).toEqual({ title: 'renamed' });
  });

  test('delete uses DELETE', async () => {
    const { connection, calls } = mockConnection(() => undefined);
    const d = new CalmDocument(connection);
    await d.delete('u');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/Documents/u');
  });

  test('lookups route to /DocumentTypes and /DocumentStatus', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const d = new CalmDocument(connection);
    await d.listTypes();
    await d.listStatuses();
    expect(calls[0].url).toBe('/DocumentTypes');
    expect(calls[1].url).toBe('/DocumentStatus');
  });
});

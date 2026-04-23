import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmHierarchy } from '../../../core/hierarchy/CalmHierarchy';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-processhierarchy/v1',
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

describe('CalmHierarchy', () => {
  test('list issues GET /HierarchyNodes', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const h = new CalmHierarchy(connection);
    await h.list();
    expect(calls[0]).toMatchObject({
      service: 'hierarchy',
      method: 'GET',
      url: '/HierarchyNodes',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const h = new CalmHierarchy(connection);
    await h.list(ODataQuery.new().top(3).orderby('sequence', 'asc'));
    expect(calls[0].url).toMatch(/^\/HierarchyNodes\?/);
    expect(calls[0].url).toContain('$top=3');
    expect(calls[0].url).toContain('$orderby=sequence asc');
  });

  test('get uses uuid with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'n/1' }));
    const h = new CalmHierarchy(connection);
    await h.get('n/1');
    expect(calls[0].url).toBe('/HierarchyNodes/n%2F1');
  });

  test('getWithExpand appends $expand for parent+children', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'n' }));
    const h = new CalmHierarchy(connection);
    await h.getWithExpand('n', ['toParentNode', 'toChildNodes']);
    expect(calls[0].url).toBe(
      '/HierarchyNodes/n?$expand=toParentNode,toChildNodes',
    );
  });

  test('getWithExpand omits $expand when expand is empty', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'n' }));
    const h = new CalmHierarchy(connection);
    await h.getWithExpand('n', []);
    expect(calls[0].url).toBe('/HierarchyNodes/n');
  });

  test('create posts JSON body', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return { uuid: 'n', title: 'T' };
    });
    const h = new CalmHierarchy(connection);
    await h.create({ title: 'T', parentNodeUuid: 'parent-1' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/HierarchyNodes');
    expect(body).toEqual({ title: 'T', parentNodeUuid: 'parent-1' });
    expect(headers?.['Content-Type']).toBe('application/json');
  });

  test('update uses PATCH with uuid in URL', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'n' }));
    const h = new CalmHierarchy(connection);
    await h.update('n', { title: 'renamed' });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('/HierarchyNodes/n');
    expect(calls[0].data).toEqual({ title: 'renamed' });
  });

  test('delete uses DELETE', async () => {
    const { connection, calls } = mockConnection(() => undefined);
    const h = new CalmHierarchy(connection);
    await h.delete('n');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/HierarchyNodes/n');
  });
});

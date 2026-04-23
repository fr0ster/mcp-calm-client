import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmTestCase } from '../../../core/testCase/CalmTestCase';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-testmanagement/v1',
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

describe('CalmTestCase', () => {
  test('list issues GET /ManualTestCases', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const c = new CalmTestCase(connection);
    await c.list();
    expect(calls[0]).toMatchObject({
      service: 'testManagement',
      method: 'GET',
      url: '/ManualTestCases',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const c = new CalmTestCase(connection);
    await c.list(ODataQuery.new().filter("projectId eq 'P1'").top(5));
    expect(calls[0].url).toMatch(/^\/ManualTestCases\?\$filter=/);
    expect(calls[0].url).toContain('$top=5');
  });

  test('get uses uuid with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'a/b' }));
    const c = new CalmTestCase(connection);
    await c.get('a/b');
    expect(calls[0].url).toBe('/ManualTestCases/a%2Fb');
  });

  test('create posts JSON body', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return { uuid: 'u', title: 'T' };
    });
    const c = new CalmTestCase(connection);
    await c.create({ title: 'T', projectId: 'P' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/ManualTestCases');
    expect(body).toEqual({ title: 'T', projectId: 'P' });
    expect(headers?.['Content-Type']).toBe('application/json');
  });

  test('update uses PATCH with uuid in URL', async () => {
    const { connection, calls } = mockConnection(() => ({ uuid: 'u' }));
    const c = new CalmTestCase(connection);
    await c.update('u', { statusCode: 'INPROG' });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('/ManualTestCases/u');
    expect(calls[0].data).toEqual({ statusCode: 'INPROG' });
  });

  test('delete uses DELETE', async () => {
    const { connection, calls } = mockConnection(() => undefined);
    const c = new CalmTestCase(connection);
    await c.delete('u');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/ManualTestCases/u');
  });

  test('activities list / create route to /Activities', async () => {
    const { connection, calls } = mockConnection((req) => {
      if (req.method === 'GET') return { value: [] };
      return { uuid: 'a' };
    });
    const c = new CalmTestCase(connection);
    await c.listActivities();
    await c.createActivity({ title: 'A', parent_ID: 'tc-1' });
    expect(calls[0].url).toBe('/Activities');
    expect(calls[0].method).toBe('GET');
    expect(calls[1].url).toBe('/Activities');
    expect(calls[1].method).toBe('POST');
    expect(calls[1].data).toEqual({ title: 'A', parent_ID: 'tc-1' });
  });

  test('actions list / create route to /Actions with parent_ID literal', async () => {
    const { connection, calls } = mockConnection((req) => {
      if (req.method === 'GET') return { value: [] };
      return { uuid: 'act' };
    });
    const c = new CalmTestCase(connection);
    await c.listActions();
    await c.createAction({
      title: 'step',
      parent_ID: 'activity-1',
      expectedResult: 'ok',
    });
    expect(calls[0].url).toBe('/Actions');
    expect(calls[1].url).toBe('/Actions');
    expect(calls[1].data).toEqual({
      title: 'step',
      parent_ID: 'activity-1',
      expectedResult: 'ok',
    });
  });
});

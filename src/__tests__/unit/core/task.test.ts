import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmTask } from '../../../core/task/CalmTask';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-tasks/v1',
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

describe('CalmTask', () => {
  test('list issues GET /tasks (no query)', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.list();
    expect(calls[0]).toMatchObject({
      service: 'tasks',
      method: 'GET',
      url: '/tasks',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.list(
      ODataQuery.new()
        .filter("projectId eq 'P1'")
        .top(20)
        .orderby('dueDate', 'asc'),
    );
    expect(calls[0].url).toMatch(/^\/tasks\?\$filter=/);
    expect(calls[0].url).toContain('$top=20');
    expect(calls[0].url).toContain('$orderby=dueDate asc');
    expect(calls[0].params).toBeUndefined();
  });

  test('get uses id with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 't/1' }));
    const t = new CalmTask(connection);
    await t.get('t/1');
    expect(calls[0].url).toBe('/tasks/t%2F1');
  });

  test('create POST with JSON body', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return { id: 'new' };
    });
    const t = new CalmTask(connection);
    await t.create({ projectId: 'P', title: 'T', type: 'USER_STORY' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/tasks');
    expect(body).toEqual({ projectId: 'P', title: 'T', type: 'USER_STORY' });
    expect(headers?.['Content-Type']).toBe('application/json');
  });

  test('update PATCH', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 't' }));
    const t = new CalmTask(connection);
    await t.update('t', { status: 'DONE' });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('/tasks/t');
    expect(calls[0].data).toEqual({ status: 'DONE' });
  });

  test('delete DELETE', async () => {
    const { connection, calls } = mockConnection(() => undefined);
    const t = new CalmTask(connection);
    await t.delete('t');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/tasks/t');
  });

  test('comments list+create routed to /tasks/{id}/comments', async () => {
    const { connection, calls } = mockConnection((req) => {
      if (req.method === 'GET') return { value: [] };
      return { id: 'c1', content: 'hi' };
    });
    const t = new CalmTask(connection);
    await t.listComments('t1');
    await t.createComment('t1', { content: 'hi' });
    expect(calls[0].url).toBe('/tasks/t1/comments');
    expect(calls[0].method).toBe('GET');
    expect(calls[1].url).toBe('/tasks/t1/comments');
    expect(calls[1].method).toBe('POST');
    expect(calls[1].data).toEqual({ content: 'hi' });
  });

  test('listComments with query appends to nested URL', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.listComments('t1', ODataQuery.new().top(5));
    expect(calls[0].url).toBe('/tasks/t1/comments?$top=5');
  });

  test('listReferences routed to /tasks/{id}/references', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.listReferences('t1');
    expect(calls[0].url).toBe('/tasks/t1/references');
  });

  test('workstreams / deliverables accept OData query for projectId filter', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.listWorkstreams(ODataQuery.new().filter("projectId eq 'P1'"));
    await t.listDeliverables(ODataQuery.new().filter("projectId eq 'P1'"));
    expect(calls[0].url).toMatch(/^\/workstreams\?\$filter=/);
    expect(calls[1].url).toMatch(/^\/deliverables\?\$filter=/);
    expect(calls[0].params).toBeUndefined();
    expect(calls[1].params).toBeUndefined();
  });

  test('workstreams / deliverables without query list all', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const t = new CalmTask(connection);
    await t.listWorkstreams();
    await t.listDeliverables();
    expect(calls[0].url).toBe('/workstreams');
    expect(calls[1].url).toBe('/deliverables');
  });
});

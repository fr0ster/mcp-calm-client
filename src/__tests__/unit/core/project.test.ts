import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmProject } from '../../../core/project/CalmProject';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-projects/v1',
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

describe('CalmProject', () => {
  test('list /projects with optional ODataQuery', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const p = new CalmProject(connection);
    await p.list();
    expect(calls[0]).toMatchObject({ service: 'projects', url: '/projects' });
    await p.list(ODataQuery.new().top(10));
    expect(calls[1].url).toBe('/projects?$top=10');
  });

  test('get project by id', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 'P1' }));
    const p = new CalmProject(connection);
    await p.get('P1');
    expect(calls[0].url).toBe('/projects/P1');
  });

  test('create POST with JSON body', async () => {
    let body: unknown;
    let headers: Record<string, string> | undefined;
    const { connection, calls } = mockConnection((req) => {
      body = req.data;
      headers = req.headers;
      return { id: 'new' };
    });
    const p = new CalmProject(connection);
    await p.create({ name: 'N', programId: 'PR1' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/projects');
    expect(body).toEqual({ name: 'N', programId: 'PR1' });
    expect(headers?.['Content-Type']).toBe('application/json');
  });

  test('nested timeboxes + team members', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const p = new CalmProject(connection);
    await p.listTimeboxes('P1');
    await p.listTeamMembers('P1', ODataQuery.new().top(5));
    expect(calls[0].url).toBe('/projects/P1/timeboxes');
    expect(calls[1].url).toBe('/projects/P1/teams?$top=5');
  });

  test('programs list/get', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 'PR' }));
    const p = new CalmProject(connection);
    await p.listPrograms();
    await p.getProgram('PR1');
    expect(calls[0].url).toBe('/programs');
    expect(calls[1].url).toBe('/programs/PR1');
  });
});

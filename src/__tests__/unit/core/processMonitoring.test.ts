import type {
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
} from '@mcp-abap-adt/interfaces';
import { CalmProcessMonitoring } from '../../../core/processMonitoring/CalmProcessMonitoring';
import { ODataQuery } from '../../../odata/ODataQuery';

function mockConnection(respond: (req: ICalmRequestOptions) => unknown): {
  connection: ICalmConnection;
  calls: ICalmRequestOptions[];
} {
  const calls: ICalmRequestOptions[] = [];
  const connection: ICalmConnection = {
    connect: async () => undefined,
    getBaseUrl: async () => 'https://x',
    getServiceUrl: async () => 'https://x/calm-processmonitoring/v1',
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

describe('CalmProcessMonitoring', () => {
  test('listBusinessProcesses routes to /businessProcesses', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const m = new CalmProcessMonitoring(connection);
    await m.listBusinessProcesses();
    expect(calls[0]).toMatchObject({
      service: 'processMonitoring',
      method: 'GET',
      url: '/businessProcesses',
    });
  });

  test('list with ODataQuery appends query string', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const m = new CalmProcessMonitoring(connection);
    await m.listSolutionProcesses(ODataQuery.new().top(1));
    expect(calls[0].url).toBe('/solutionProcesses?$top=1');
  });

  test('getBusinessProcess uses id with percent-encoding', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 'b/1' }));
    const m = new CalmProcessMonitoring(connection);
    await m.getBusinessProcess('b/1');
    expect(calls[0].url).toBe('/businessProcesses/b%2F1');
  });

  test('getSolutionProcess uses id', async () => {
    const { connection, calls } = mockConnection(() => ({ id: 's1' }));
    const m = new CalmProcessMonitoring(connection);
    await m.getSolutionProcess('s1');
    expect(calls[0].url).toBe('/solutionProcesses/s1');
  });

  test('remaining list endpoints preserve lowercase-first casing', async () => {
    const { connection, calls } = mockConnection(() => ({ value: [] }));
    const m = new CalmProcessMonitoring(connection);
    await m.listSolutionProcessFlows();
    await m.listSolutionValueFlowDiagrams();
    await m.listAssets();
    expect(calls.map((c) => c.url)).toEqual([
      '/solutionProcessFlows',
      '/solutionValueFlowDiagrams',
      '/assets',
    ]);
  });
});

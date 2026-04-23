import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ODataQuery } from '../../odata/ODataQuery';

/**
 * Handler for the Cloud ALM Process Monitoring OData service
 * (`/calm-processmonitoring/v1`).
 *
 * Read-only: only GET operations are supported. Endpoint paths use
 * lowercase-first casing (`/businessProcesses`, `/solutionProcesses`
 * etc.) — preserved verbatim from the Cloud ALM API. Responses are
 * generic `T` (default `unknown`); consumers pass their own shape for
 * type safety.
 */
export class CalmProcessMonitoring {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  private async list<T>(path: string, query?: ODataQuery): Promise<T> {
    const qs = query ? query.toQueryString() : '';
    const response = await this.connection.makeRequest<T>({
      service: 'processMonitoring',
      url: `${path}${qs}`,
      method: 'GET',
    });
    return response.data;
  }

  private async getById<T>(path: string, id: string): Promise<T> {
    const response = await this.connection.makeRequest<T>({
      service: 'processMonitoring',
      url: `${path}/${encodeURIComponent(id)}`,
      method: 'GET',
    });
    return response.data;
  }

  listBusinessProcesses<T = unknown>(query?: ODataQuery): Promise<T> {
    return this.list<T>('/businessProcesses', query);
  }

  getBusinessProcess<T = unknown>(id: string): Promise<T> {
    return this.getById<T>('/businessProcesses', id);
  }

  listSolutionProcesses<T = unknown>(query?: ODataQuery): Promise<T> {
    return this.list<T>('/solutionProcesses', query);
  }

  getSolutionProcess<T = unknown>(id: string): Promise<T> {
    return this.getById<T>('/solutionProcesses', id);
  }

  listSolutionProcessFlows<T = unknown>(query?: ODataQuery): Promise<T> {
    return this.list<T>('/solutionProcessFlows', query);
  }

  listSolutionValueFlowDiagrams<T = unknown>(query?: ODataQuery): Promise<T> {
    return this.list<T>('/solutionValueFlowDiagrams', query);
  }

  listAssets<T = unknown>(query?: ODataQuery): Promise<T> {
    return this.list<T>('/assets', query);
  }
}

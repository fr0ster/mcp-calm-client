import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import { getLogs } from './get';
import { postLogs } from './post';
import type { IGetLogsParams, IPostLogsParams, LogRecords } from './types';

/**
 * Handler for the Cloud ALM Logs service (`/calm-logs/v1`).
 *
 * Unlike the other Cloud ALM services, Logs uses a domain-specific REST
 * query-string language (not OData): `provider=…`, `logsFilters[serviceId]=…`,
 * date ranges, pagination. The typed `get`/`post` methods below translate
 * to that shape. Responses are generic `T` (default `LogRecords` /
 * `unknown`) — schema is caller-defined.
 */
export class CalmLog {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  get<T = LogRecords>(params: IGetLogsParams): Promise<T> {
    return getLogs<T>(this.connection, params);
  }

  post<T = LogRecords>(
    params: IPostLogsParams,
    records: LogRecords,
  ): Promise<T> {
    return postLogs<T>(this.connection, params, records);
  }
}

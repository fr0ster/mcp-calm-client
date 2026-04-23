import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { ODataQuery } from '../../odata/ODataQuery';
import { getAnalyticsEndpoint } from './get';
import { listAnalyticsProviders } from './providers';
import { queryAnalyticsDataset } from './queryDataset';
import type {
  AnalyticsEndpoint,
  IListProvidersResult,
  IQueryDatasetOptions,
} from './types';

/**
 * Handler for the Cloud ALM Analytics OData service
 * (`/calm-analytics/v1/odata/v4/analytics`).
 *
 * Read-only: only GET operations are supported. Collection shapes vary
 * per endpoint, so methods return generic `T` (default `unknown`);
 * callers may specify their own result type.
 */
export class CalmAnalytics {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  getEndpoint<T = unknown>(
    endpoint: AnalyticsEndpoint,
    query?: ODataQuery,
  ): Promise<T> {
    return getAnalyticsEndpoint<T>(this.connection, endpoint, query);
  }

  queryDataset<T = unknown>(
    provider: string,
    options?: IQueryDatasetOptions,
  ): Promise<T> {
    return queryAnalyticsDataset<T>(this.connection, provider, options);
  }

  listProviders(): IListProvidersResult {
    return listAnalyticsProviders();
  }
}

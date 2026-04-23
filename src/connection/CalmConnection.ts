import type {
  CalmService,
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
  ILogger,
  ITokenRefresher,
} from '@mcp-abap-adt/interfaces';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import { toCalmApiError } from './parseCalmError';
import {
  type CalmServiceRouteMap,
  DEFAULT_CALM_SERVICE_ROUTES,
} from './serviceRoutes';

export type CalmAuthMode = 'oauth2' | 'sandbox';

export interface ICalmConnectionOptions {
  baseUrl: string;
  tokenRefresher?: ITokenRefresher;
  apiKey?: string;
  mode?: CalmAuthMode;
  apiPrefix?: string;
  serviceRoutes?: Partial<CalmServiceRouteMap>;
  defaultTimeout?: number;
  defaultHeaders?: Record<string, string>;
  logger?: ILogger;
  axiosInstance?: AxiosInstance;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function trimLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

function joinUrl(base: string, path: string): string {
  if (!path) return trimTrailingSlash(base);
  return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`;
}

function isAuthError(err: unknown): err is AxiosError {
  if (!(err instanceof AxiosError)) return false;
  const status = err.response?.status;
  return status === 401 || status === 403;
}

export class CalmConnection implements ICalmConnection {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly mode: CalmAuthMode;
  private readonly tokenRefresher?: ITokenRefresher;
  private readonly apiKey?: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly serviceRoutes: CalmServiceRouteMap;
  private readonly axiosInstance: AxiosInstance;
  private readonly logger?: ILogger;

  constructor(options: ICalmConnectionOptions) {
    const mode =
      options.mode ?? (options.tokenRefresher ? 'oauth2' : 'sandbox');
    if (mode === 'oauth2' && !options.tokenRefresher) {
      throw new Error('CalmConnection: oauth2 mode requires tokenRefresher');
    }
    if (mode === 'sandbox' && !options.apiKey) {
      throw new Error('CalmConnection: sandbox mode requires apiKey');
    }

    this.baseUrl = trimTrailingSlash(options.baseUrl);
    this.mode = mode;
    this.tokenRefresher = options.tokenRefresher;
    this.apiKey = options.apiKey;
    this.apiPrefix =
      options.apiPrefix !== undefined
        ? options.apiPrefix
        : mode === 'oauth2'
          ? '/api'
          : '';
    this.defaultTimeout = options.defaultTimeout ?? 30_000;
    this.defaultHeaders = {
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
    this.serviceRoutes = {
      ...DEFAULT_CALM_SERVICE_ROUTES,
      ...options.serviceRoutes,
    };
    this.axiosInstance = options.axiosInstance ?? axios.create();
    this.logger = options.logger;
  }

  async connect(): Promise<void> {
    if (this.mode === 'oauth2' && this.tokenRefresher) {
      await this.tokenRefresher.getToken();
    }
  }

  async getBaseUrl(): Promise<string> {
    return this.baseUrl;
  }

  async getServiceUrl(service: CalmService): Promise<string> {
    return joinUrl(
      joinUrl(this.baseUrl, this.apiPrefix),
      this.serviceRoutes[service],
    );
  }

  async makeRequest<T = unknown, D = unknown>(
    options: ICalmRequestOptions,
  ): Promise<ICalmResponse<T, D>> {
    const targetBaseUrl = options.service
      ? await this.getServiceUrl(options.service)
      : joinUrl(this.baseUrl, this.apiPrefix);
    const url = joinUrl(targetBaseUrl, options.url);

    try {
      return await this.execute<T, D>(url, options);
    } catch (err) {
      if (this.mode === 'oauth2' && this.tokenRefresher && isAuthError(err)) {
        this.logger?.debug(
          `[CalmConnection] ${err.response?.status} from ${options.method} ${url} — refreshing token and retrying`,
        );
        await this.tokenRefresher.refreshToken();
        try {
          return await this.execute<T, D>(url, options);
        } catch (retryErr) {
          throw toCalmApiError(retryErr);
        }
      }
      throw toCalmApiError(err);
    }
  }

  private async buildAuthHeader(): Promise<Record<string, string>> {
    if (this.mode === 'sandbox') {
      return { APIKey: this.apiKey as string };
    }
    const token = await (this.tokenRefresher as ITokenRefresher).getToken();
    return { Authorization: `Bearer ${token}` };
  }

  private async execute<T, D>(
    url: string,
    options: ICalmRequestOptions,
  ): Promise<ICalmResponse<T, D>> {
    const authHeader = await this.buildAuthHeader();
    return this.axiosInstance.request<T, ICalmResponse<T, D>, D>({
      url,
      method: options.method,
      timeout: options.timeout ?? this.defaultTimeout,
      data: options.data as D,
      params: options.params,
      headers: {
        ...this.defaultHeaders,
        ...authHeader,
        ...options.headers,
      },
    });
  }
}

import type {
  CalmService,
  ICalmConnection,
  ICalmRequestOptions,
  ICalmResponse,
  ITokenRefresher,
} from '@mcp-abap-adt/interfaces';
import { calmErrorFromBody } from '../../connection/parseCalmError';
import { CalmApiError } from '../../errors/CalmApiError';
import { type ICalmTestEnv, readCalmTestEnv } from './test-env';

// ---------------------------------------------------------------------------
// Local service route map (mirrors the deleted serviceRoutes.ts)
// ---------------------------------------------------------------------------

const TEST_SERVICE_ROUTES: Record<CalmService, string> = {
  features: '/calm-features/v1',
  documents: '/calm-documents/v1',
  tasks: '/calm-tasks/v1',
  projects: '/calm-projects/v1',
  testManagement: '/calm-testmanagement/v1',
  hierarchy: '/calm-processhierarchy/v1',
  analytics: '/calm-analytics/v1/odata/v4/analytics',
  processMonitoring: '/calm-processmonitoring/v1',
  logs: '/calm-logs/v1',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function trimLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

function joinUrl(base: string, path?: string): string {
  if (!path) return trimTrailingSlash(base);
  return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`;
}

// ---------------------------------------------------------------------------
// TestTokenRefresher
// ---------------------------------------------------------------------------

/**
 * Minimal JWT refresher for integration tests — calls the XSUAA
 * `client_credentials` flow directly via `fetch`, caches the token
 * until the next `refreshToken()` call. Avoids a hard devDependency
 * on the full `@mcp-abap-adt/auth-broker` pipeline for bare-bones
 * integration runs.
 */
class TestTokenRefresher implements ITokenRefresher {
  private cached?: string;

  constructor(
    private readonly uaaUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async getToken(): Promise<string> {
    if (!this.cached) return this.refreshToken();
    return this.cached;
  }

  async refreshToken(): Promise<string> {
    const url = `${this.uaaUrl.replace(/\/$/, '')}/oauth/token`;
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `XSUAA token request failed: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`,
      );
    }
    const json = (await response.json()) as { access_token: string };
    if (!json.access_token) {
      throw new Error('XSUAA token response missing access_token');
    }
    this.cached = json.access_token;
    return this.cached;
  }
}

// ---------------------------------------------------------------------------
// TestCalmConnection
// ---------------------------------------------------------------------------

interface ITestCalmConnectionOptions {
  baseUrl: string;
  defaultTimeout?: number;
  tokenRefresher?: ITokenRefresher;
  apiKey?: string;
}

/**
 * Minimal fetch-based `ICalmConnection` for integration tests.
 * Lives only in `src/__tests__/` — not exported from the package.
 *
 * baseUrl is used VERBATIM (no `/api` prefix injection). For live
 * oauth2 tenants, CALM_BASE_URL must already include the `/api` segment.
 */
class TestCalmConnection implements ICalmConnection {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly tokenRefresher?: ITokenRefresher;
  private readonly apiKey?: string;
  private readonly mode: 'oauth2' | 'sandbox';

  constructor(options: ITestCalmConnectionOptions) {
    this.baseUrl = trimTrailingSlash(options.baseUrl);
    this.defaultTimeout = options.defaultTimeout ?? 30_000;
    this.tokenRefresher = options.tokenRefresher;
    this.apiKey = options.apiKey;
    this.mode = options.tokenRefresher ? 'oauth2' : 'sandbox';
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
    return joinUrl(this.baseUrl, TEST_SERVICE_ROUTES[service]);
  }

  async makeRequest<T = unknown, D = unknown>(
    options: ICalmRequestOptions,
  ): Promise<ICalmResponse<T, D>> {
    const serviceBase = options.service
      ? await this.getServiceUrl(options.service)
      : this.baseUrl;
    const urlWithPath = joinUrl(serviceBase, options.url);

    // Build query string from params
    let fullUrl = urlWithPath;
    if (options.params && typeof options.params === 'object') {
      const qs = new URLSearchParams(
        options.params as Record<string, string>,
      ).toString();
      if (qs) fullUrl = `${urlWithPath}?${qs}`;
    }

    // Build auth header
    const authHeader = await this.buildAuthHeader();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...authHeader,
      ...options.headers,
    };

    const init: RequestInit = {
      method: options.method,
      headers,
      signal: AbortSignal.timeout(options.timeout ?? this.defaultTimeout),
    };

    if (options.data !== undefined && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.data);
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, init);
    } catch (err) {
      throw CalmApiError.fromNetwork(
        err,
        `Network request failed: ${options.method} ${fullUrl}`,
      );
    }

    // Parse body
    const contentType = response.headers.get('content-type') ?? '';
    let data: unknown;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => '');
    }

    if (!response.ok) {
      throw calmErrorFromBody(response.status, data);
    }

    // Collect response headers
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      respHeaders[key] = value;
    });

    return {
      data: data as T,
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    } as ICalmResponse<T, D>;
  }

  private async buildAuthHeader(): Promise<Record<string, string>> {
    if (this.mode === 'sandbox') {
      return { APIKey: this.apiKey as string };
    }
    const token = await this.tokenRefresher!.getToken();
    return { Authorization: `Bearer ${token}` };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ITestHarness {
  connection: ICalmConnection;
  env: ICalmTestEnv;
}

/**
 * Build a `TestCalmConnection` from the current test environment. Returns
 * `null` when `CALM_MODE` is unset — callers then mark their suite as
 * skipped.
 */
export function buildTestConnection(): ITestHarness | null {
  const env = readCalmTestEnv();
  if (!env) return null;

  if (env.mode === 'oauth2') {
    const refresher = new TestTokenRefresher(
      env.uaaUrl as string,
      env.uaaClientId as string,
      env.uaaClientSecret as string,
    );
    return {
      env,
      connection: new TestCalmConnection({
        baseUrl: env.baseUrl,
        tokenRefresher: refresher,
        defaultTimeout: env.timeoutMs,
      }),
    };
  }

  return {
    env,
    connection: new TestCalmConnection({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey as string,
      defaultTimeout: env.timeoutMs,
    }),
  };
}

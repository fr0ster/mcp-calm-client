import type { ITokenRefresher } from '@mcp-abap-adt/interfaces';
import { CalmConnection } from '../../connection/CalmConnection';
import { type ICalmTestEnv, readCalmTestEnv } from './test-env';
import { createConnectionLogger } from './testLogger';

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

export interface ITestHarness {
  connection: CalmConnection;
  env: ICalmTestEnv;
}

/**
 * Build a `CalmConnection` from the current test environment. Returns
 * `null` when `CALM_MODE` is unset — callers then mark their suite as
 * skipped.
 */
export function buildTestConnection(): ITestHarness | null {
  const env = readCalmTestEnv();
  if (!env) return null;
  const logger = createConnectionLogger();

  if (env.mode === 'oauth2') {
    const refresher = new TestTokenRefresher(
      env.uaaUrl as string,
      env.uaaClientId as string,
      env.uaaClientSecret as string,
    );
    return {
      env,
      connection: new CalmConnection({
        baseUrl: env.baseUrl,
        tokenRefresher: refresher,
        defaultTimeout: env.timeoutMs,
        logger,
      }),
    };
  }

  return {
    env,
    connection: new CalmConnection({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey as string,
      defaultTimeout: env.timeoutMs,
      logger,
    }),
  };
}

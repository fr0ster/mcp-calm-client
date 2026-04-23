import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';

let loaded = false;

/**
 * Load the .env file at the repo root (if present). Idempotent.
 * Called from both `globalSetup` and each test file so invocation order
 * does not matter.
 */
export function loadTestEnv(): void {
  if (loaded) return;
  const path = resolve(__dirname, '../../../.env');
  if (existsSync(path)) {
    dotenvConfig({ path });
  }
  loaded = true;
}

export type CalmTestMode = 'oauth2' | 'sandbox';

export interface ICalmTestEnv {
  mode: CalmTestMode;
  baseUrl: string;
  /** OAuth2 only */
  uaaUrl?: string;
  uaaClientId?: string;
  uaaClientSecret?: string;
  /** Sandbox only */
  apiKey?: string;
  /** Gates & overrides */
  destructive: boolean;
  timeoutMs: number;
}

export interface ICalmTestFixtures {
  projectId?: string;
  featureUuid?: string;
  featureDisplayId?: string;
  documentUuid?: string;
  taskId?: string;
  testCaseUuid?: string;
  hierarchyNodeUuid?: string;
  analyticsProvider?: string;
  logProvider?: string;
  logServiceId?: string;
}

/**
 * Read and validate required env vars for the current mode. Returns
 * `null` when mode is unset — callers then skip integration tests.
 */
export function readCalmTestEnv(): ICalmTestEnv | null {
  loadTestEnv();
  const mode = process.env.CALM_MODE?.toLowerCase() as CalmTestMode | undefined;
  if (!mode) return null;

  const timeoutMs = process.env.CALM_TIMEOUT
    ? Number(process.env.CALM_TIMEOUT)
    : 30_000;
  const destructive = process.env.CALM_DESTRUCTIVE === '1';

  if (mode === 'oauth2') {
    const baseUrl = required('CALM_BASE_URL');
    return {
      mode,
      baseUrl,
      uaaUrl: required('CALM_UAA_URL'),
      uaaClientId: required('CALM_UAA_CLIENT_ID'),
      uaaClientSecret: required('CALM_UAA_CLIENT_SECRET'),
      destructive,
      timeoutMs,
    };
  }

  if (mode === 'sandbox') {
    const baseUrl =
      process.env.CALM_BASE_URL || 'https://sandbox.api.sap.com/SAPCALM';
    return {
      mode,
      baseUrl,
      apiKey: required('CALM_API_KEY'),
      destructive,
      timeoutMs,
    };
  }

  throw new Error(`CALM_MODE must be "oauth2" or "sandbox", got "${mode}"`);
}

export function readCalmTestFixtures(): ICalmTestFixtures {
  loadTestEnv();
  return {
    projectId: process.env.CALM_TEST_PROJECT_ID,
    featureUuid: process.env.CALM_TEST_FEATURE_UUID,
    featureDisplayId: process.env.CALM_TEST_FEATURE_DISPLAY_ID,
    documentUuid: process.env.CALM_TEST_DOCUMENT_UUID,
    taskId: process.env.CALM_TEST_TASK_ID,
    testCaseUuid: process.env.CALM_TEST_TEST_CASE_UUID,
    hierarchyNodeUuid: process.env.CALM_TEST_HIERARCHY_NODE_UUID,
    analyticsProvider: process.env.CALM_TEST_ANALYTICS_PROVIDER,
    logProvider: process.env.CALM_TEST_LOG_PROVIDER,
    logServiceId: process.env.CALM_TEST_LOG_SERVICE_ID,
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[calm integration] env var ${name} is required but missing. See .env.example.`,
    );
  }
  return value;
}

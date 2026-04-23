/**
 * Test logging helper — mirrors the pattern used in `@mcp-abap-adt/adt-clients`.
 *
 * Uses DefaultLogger from `@mcp-abap-adt/logger` (synchronous; safe for test
 * output). Scope-gated via environment variables:
 *
 *   CALM_LOG_LEVEL=error|warn|info|debug    log level (default: info)
 *   DEBUG_CALM_TESTS=true                   test execution logging
 *   DEBUG_CALM_LIBS=true                    client-code logging
 *   DEBUG_CALM_CONNECTORS=true              CalmConnection logging
 */

import type { ILogger } from '@mcp-abap-adt/interfaces';
// Subpath import avoids eager `new PinoLogger()` side effect in @mcp-abap-adt/logger
// which errors if `pino` is not installed.
import { DefaultLogger } from '@mcp-abap-adt/logger/dist/default-logger';

export type DebugScope = 'tests' | 'libs' | 'connectors';

export function isDebugEnabled(scope: DebugScope): boolean {
  switch (scope) {
    case 'tests':
      return process.env.DEBUG_CALM_TESTS === 'true';
    case 'libs':
      return process.env.DEBUG_CALM_LIBS === 'true';
    case 'connectors':
      return process.env.DEBUG_CALM_CONNECTORS === 'true';
  }
}

let cachedTestsLogger: ILogger | undefined;

/**
 * Returns a logger for test-side output. Always available — the logger
 * prints at the level configured by `CALM_LOG_LEVEL`, regardless of
 * scope flags. Use this for lifecycle messages (setup, preflight, etc).
 */
export function getTestLogger(): ILogger {
  if (!cachedTestsLogger) cachedTestsLogger = new DefaultLogger();
  return cachedTestsLogger;
}

/**
 * Returns a logger scoped to `connectors` if the flag is set; otherwise
 * undefined. Passed to `CalmConnection({ logger })` so it logs retries
 * and 401 refresh details only when requested.
 */
export function createConnectionLogger(): ILogger | undefined {
  return isDebugEnabled('connectors') ? new DefaultLogger() : undefined;
}

/**
 * Returns a logger for test execution. Gated on `DEBUG_CALM_TESTS`.
 */
export function createTestExecLogger(): ILogger | undefined {
  return isDebugEnabled('tests') ? new DefaultLogger() : undefined;
}

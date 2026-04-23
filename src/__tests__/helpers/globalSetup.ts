import { buildTestConnection } from './test-connection';
import { loadTestEnv } from './test-env';
import { getTestLogger } from './testLogger';

/**
 * Jest globalSetup — Cloud ALM connectivity preflight.
 *
 * If `CALM_MODE` is unset, integration tests self-skip; no preflight
 * needed. Otherwise we acquire a token / ping once so the whole suite
 * fails fast on misconfiguration.
 */
export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  const logger = getTestLogger();

  if (!process.env.CALM_MODE) {
    logger.info(
      '[calm globalSetup] CALM_MODE not set — integration tests will be skipped.',
    );
    return;
  }
  const built = buildTestConnection();
  if (!built) return;
  const { connection, env } = built;
  logger.info(
    `[calm globalSetup] mode=${env.mode} baseUrl=${env.baseUrl} — preflight connect …`,
  );
  try {
    await connection.connect();
    logger.info('[calm globalSetup] connect OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[calm globalSetup] preflight failed — aborting integration tests.\n  ${msg}`,
    );
  }
}

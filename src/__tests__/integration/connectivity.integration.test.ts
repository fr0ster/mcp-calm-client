import { CalmClient } from '../../clients/CalmClient';
import { buildTestConnection } from '../helpers/test-connection';

const built = buildTestConnection();

if (!built) {
  describe('integration: connectivity', () => {
    test.skip('CALM_MODE not set — configure .env to enable', () => {});
  });
} else {
  const { connection, env } = built;
  const calm = new CalmClient(connection);

  describe(`integration: connectivity [${env.mode}]`, () => {
    test('connect() completes without throwing', async () => {
      await connection.connect();
    });

    test('getServiceUrl(features) composes tenant baseUrl + prefix + route', async () => {
      const url = await connection.getServiceUrl('features');
      expect(url).toContain(env.baseUrl.replace(/\/$/, ''));
      expect(url).toContain('/calm-features/v1');
      if (env.mode === 'oauth2') {
        expect(url).toContain('/api/');
      }
    });

    test('analytics.listProviders() is a pure client-side call (no network)', () => {
      const result = calm.getAnalytics().listProviders();
      expect(result.providers.length).toBeGreaterThan(0);
    });
  });
}

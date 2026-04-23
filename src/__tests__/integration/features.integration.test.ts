import { CalmClient } from '../../clients/CalmClient';
import { ODataQuery } from '../../odata/ODataQuery';
import { buildTestConnection } from '../helpers/test-connection';
import { readCalmTestFixtures } from '../helpers/test-env';

const built = buildTestConnection();

if (!built) {
  describe('integration: features', () => {
    test.skip('CALM_MODE not set — configure .env to enable', () => {});
  });
} else {
  const { connection } = built;
  const fixtures = readCalmTestFixtures();
  const calm = new CalmClient(connection);

  describe('integration: features', () => {
    test('list top 1 — shape is an OData collection', async () => {
      const result = await calm.getFeatures().list(ODataQuery.new().top(1));
      expect(result).toHaveProperty('value');
      expect(Array.isArray(result.value)).toBe(true);
    });

    test('listStatuses — returns known status codes', async () => {
      const result = await calm.getFeatures().listStatuses();
      expect(result).toHaveProperty('value');
      expect(Array.isArray(result.value)).toBe(true);
    });

    test('listPriorities — returns known priority codes', async () => {
      const result = await calm.getFeatures().listPriorities();
      expect(result).toHaveProperty('value');
    });

    const itHasFixture = fixtures.featureUuid ? test : test.skip;
    itHasFixture(
      'get(CALM_TEST_FEATURE_UUID) — fixture round-trips',
      async () => {
        const feature = await calm
          .getFeatures()
          .get(fixtures.featureUuid as string);
        expect(feature.uuid).toBe(fixtures.featureUuid);
      },
    );

    const itHasDisplayId = fixtures.featureDisplayId ? test : test.skip;
    itHasDisplayId(
      'getByDisplayId(CALM_TEST_FEATURE_DISPLAY_ID) — returns matching feature',
      async () => {
        const feature = await calm
          .getFeatures()
          .getByDisplayId(fixtures.featureDisplayId as string);
        expect(feature.displayId).toBe(fixtures.featureDisplayId);
      },
    );

    const itExpand = fixtures.featureUuid ? test : test.skip;
    itExpand(
      'getWithExpand([externalReferences]) — parses expanded payload',
      async () => {
        const feature = await calm
          .getFeatures()
          .getWithExpand<Record<string, unknown>>(
            fixtures.featureUuid as string,
            ['externalReferences'],
          );
        expect(feature).toHaveProperty('uuid');
      },
    );
  });
}

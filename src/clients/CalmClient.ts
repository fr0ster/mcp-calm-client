import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import { CalmAnalytics } from '../core/analytics/CalmAnalytics';
import { CalmDocument } from '../core/document/CalmDocument';
import { CalmFeature } from '../core/feature/CalmFeature';
import { CalmHierarchy } from '../core/hierarchy/CalmHierarchy';
import { CalmProcessMonitoring } from '../core/processMonitoring/CalmProcessMonitoring';
import { CalmTestCase } from '../core/testCase/CalmTestCase';

/**
 * Top-level factory for Cloud ALM resource clients.
 *
 * Accepts any `ICalmConnection` implementation. Each `get<Resource>()`
 * call returns a **fresh, stateless** handler bound to the shared
 * connection — handlers hold no mutable state, so caching is unnecessary
 * and callers may safely discard returned instances.
 */
export class CalmClient {
  protected readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  getConnection(): ICalmConnection {
    return this.connection;
  }

  getFeatures(): CalmFeature {
    return new CalmFeature(this.connection);
  }

  getDocuments(): CalmDocument {
    return new CalmDocument(this.connection);
  }

  getTestCases(): CalmTestCase {
    return new CalmTestCase(this.connection);
  }

  getHierarchy(): CalmHierarchy {
    return new CalmHierarchy(this.connection);
  }

  getAnalytics(): CalmAnalytics {
    return new CalmAnalytics(this.connection);
  }

  getProcessMonitoring(): CalmProcessMonitoring {
    return new CalmProcessMonitoring(this.connection);
  }
}

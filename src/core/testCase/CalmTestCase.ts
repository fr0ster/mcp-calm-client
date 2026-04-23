import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { createTestAction, listTestActions } from './actions';
import { createTestActivity, listTestActivities } from './activities';
import { createTestCase } from './create';
import { deleteTestCase } from './delete';
import { getTestCase } from './get';
import { listTestCases } from './list';
import type {
  ICreateTestActionParams,
  ICreateTestActivityParams,
  ICreateTestCaseParams,
  ITestAction,
  ITestActivity,
  ITestCase,
  IUpdateTestCaseParams,
} from './types';
import { updateTestCase } from './update';

/**
 * Handler for the Cloud ALM Test Management OData service
 * (`/calm-testmanagement/v1`).
 *
 * Exposes CRUD for manual test cases plus list/create for the nested
 * Activities and Actions collections (Cloud ALM places activities and
 * actions at top-level OData entity sets, linked to their parent by the
 * `parent_ID` field).
 */
export class CalmTestCase {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  list(query?: ODataQuery): Promise<IODataCollection<ITestCase>> {
    return listTestCases(this.connection, query);
  }

  get(uuid: string): Promise<ITestCase> {
    return getTestCase(this.connection, uuid);
  }

  create(params: ICreateTestCaseParams): Promise<ITestCase> {
    return createTestCase(this.connection, params);
  }

  update(uuid: string, params: IUpdateTestCaseParams): Promise<ITestCase> {
    return updateTestCase(this.connection, uuid, params);
  }

  delete(uuid: string): Promise<void> {
    return deleteTestCase(this.connection, uuid);
  }

  listActivities(query?: ODataQuery): Promise<IODataCollection<ITestActivity>> {
    return listTestActivities(this.connection, query);
  }

  createActivity(params: ICreateTestActivityParams): Promise<ITestActivity> {
    return createTestActivity(this.connection, params);
  }

  listActions(query?: ODataQuery): Promise<IODataCollection<ITestAction>> {
    return listTestActions(this.connection, query);
  }

  createAction(params: ICreateTestActionParams): Promise<ITestAction> {
    return createTestAction(this.connection, params);
  }
}

import type { ICalmConnection } from '@mcp-abap-adt/interfaces';
import type { IODataCollection } from '../../odata/ODataCollection';
import type { ODataQuery } from '../../odata/ODataQuery';
import { createTaskComment, listTaskComments } from './comments';
import { createTask } from './create';
import { deleteTask } from './delete';
import { getTask } from './get';
import { listDeliverables, listTasks, listWorkstreams } from './list';
import { listTaskReferences } from './references';
import type {
  ICreateTaskCommentParams,
  ICreateTaskParams,
  IDeliverable,
  ITask,
  ITaskComment,
  ITaskReference,
  IUpdateTaskParams,
  IWorkstream,
} from './types';
import { updateTask } from './update';

/**
 * Handler for the Cloud ALM Tasks OData service (`/calm-tasks/v1`).
 *
 * Uses OData v4 semantics consistent with the other Cloud ALM services.
 * Pass an `ODataQuery` to filter/sort/paginate; e.g. to fetch tasks for
 * a specific project, use `ODataQuery.new().filter("projectId eq 'P1'")`.
 */
export class CalmTask {
  private readonly connection: ICalmConnection;

  constructor(connection: ICalmConnection) {
    this.connection = connection;
  }

  list(query?: ODataQuery): Promise<IODataCollection<ITask>> {
    return listTasks(this.connection, query);
  }

  get(id: string): Promise<ITask> {
    return getTask(this.connection, id);
  }

  create(params: ICreateTaskParams): Promise<ITask> {
    return createTask(this.connection, params);
  }

  update(id: string, params: IUpdateTaskParams): Promise<ITask> {
    return updateTask(this.connection, id, params);
  }

  delete(id: string): Promise<void> {
    return deleteTask(this.connection, id);
  }

  listComments(
    taskId: string,
    query?: ODataQuery,
  ): Promise<IODataCollection<ITaskComment>> {
    return listTaskComments(this.connection, taskId, query);
  }

  createComment(
    taskId: string,
    params: ICreateTaskCommentParams,
  ): Promise<ITaskComment> {
    return createTaskComment(this.connection, taskId, params);
  }

  listReferences(
    taskId: string,
    query?: ODataQuery,
  ): Promise<IODataCollection<ITaskReference>> {
    return listTaskReferences(this.connection, taskId, query);
  }

  listWorkstreams(query?: ODataQuery): Promise<IODataCollection<IWorkstream>> {
    return listWorkstreams(this.connection, query);
  }

  listDeliverables(
    query?: ODataQuery,
  ): Promise<IODataCollection<IDeliverable>> {
    return listDeliverables(this.connection, query);
  }
}

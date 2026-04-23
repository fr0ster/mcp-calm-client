export interface ITask {
  id?: string;
  projectId?: string;
  title?: string;
  description?: string;
  /** Wire field is literally `type` (camelCase rename in Rust). */
  type?: string;
  status?: string;
  subStatus?: string;
  externalId?: string;
  dueDate?: string;
  priorityId?: number;
  assigneeId?: string;
  assigneeName?: string;
  timeboxName?: string;
  timeboxStartDate?: string;
  timeboxEndDate?: string;
  lastChangedDate?: string;
}

export interface ITaskComment {
  id?: string;
  taskId?: string;
  content?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface ITaskReference {
  id?: string;
  taskId?: string;
  externalId?: string;
  externalSystem?: string;
  url?: string;
}

export interface IWorkstream {
  id?: string;
  projectId?: string;
  name?: string;
  description?: string;
}

export interface IDeliverable {
  id?: string;
  projectId?: string;
  name?: string;
  description?: string;
}

export interface ICreateTaskParams {
  projectId: string;
  title: string;
  type: string;
  description?: string;
  priorityId?: number;
  assigneeId?: string;
  dueDate?: string;
}

export interface IUpdateTaskParams {
  title?: string;
  description?: string;
  status?: string;
  priorityId?: number;
  assigneeId?: string;
  dueDate?: string;
}

export interface ICreateTaskCommentParams {
  content: string;
}

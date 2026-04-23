// ─── Contracts (from @mcp-abap-adt/interfaces) ──────────────────────────────
export {
  CALM_SERVICES,
  type CalmService,
  type ICalmConnection,
  type ICalmRequestOptions,
  type ICalmResponse,
} from '@mcp-abap-adt/interfaces';

// ─── Factory & concrete connection ──────────────────────────────────────────
export { CalmClient } from './clients/CalmClient';
export {
  type CalmAuthMode,
  CalmConnection,
  type ICalmConnectionOptions,
} from './connection/CalmConnection';
export {
  type CalmServiceRouteMap,
  DEFAULT_CALM_SERVICE_ROUTES,
} from './connection/serviceRoutes';
export type {
  IAnalyticsProviderInfo,
  IListProvidersResult,
  IQueryDatasetOptions,
} from './core/analytics';
export {
  ANALYTICS_ENDPOINTS,
  type AnalyticsEndpoint,
  CalmAnalytics,
} from './core/analytics';
export type {
  ICreateDocumentParams,
  IDocument,
  IDocumentStatus,
  IDocumentType,
  IUpdateDocumentParams,
} from './core/document';
export { CalmDocument } from './core/document';
// ─── Entity types (per resource) ────────────────────────────────────────────
export type {
  ICreateExternalReferenceParams,
  ICreateFeatureParams,
  IExternalReference,
  IFeature,
  IFeaturePriority,
  IFeatureStatus,
  IUpdateFeatureParams,
} from './core/feature';
// ─── Resource handlers (one per Cloud ALM service) ──────────────────────────
export { CalmFeature } from './core/feature';
export type {
  ICreateHierarchyNodeParams,
  IHierarchyNode,
  IUpdateHierarchyNodeParams,
} from './core/hierarchy';
export { CalmHierarchy } from './core/hierarchy';
export type {
  IGetLogsParams,
  IPostLogsParams,
  LogRecords,
} from './core/log';
export { CalmLog } from './core/log';
export { CalmProcessMonitoring } from './core/processMonitoring';
export type {
  ICreateProjectParams,
  IProgram,
  IProject,
  ITeamMember,
  ITimebox,
} from './core/project';
export { CalmProject } from './core/project';
export type {
  ICreateTaskCommentParams,
  ICreateTaskParams,
  IDeliverable,
  ITask,
  ITaskComment,
  ITaskReference,
  IUpdateTaskParams,
  IWorkstream,
} from './core/task';
export { CalmTask } from './core/task';
export type {
  ICreateTestActionParams,
  ICreateTestActivityParams,
  ICreateTestCaseParams,
  ITestAction,
  ITestActivity,
  ITestCase,
  IUpdateTestCaseParams,
} from './core/testCase';
export { CalmTestCase } from './core/testCase';
// ─── Errors ─────────────────────────────────────────────────────────────────
export {
  CALM_API_ERROR_CODES,
  CalmApiError,
  type CalmApiErrorCode,
} from './errors';
// ─── OData query builder & response shapes ──────────────────────────────────
export {
  type IODataCollection,
  type IODataErrorDetail,
  type IODataErrorItem,
  type IODataErrorResponse,
  type IOrderByEntry,
  ODataQuery,
  type SortOrder,
} from './odata';

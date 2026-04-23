export interface ITestCase {
  uuid?: string;
  title?: string;
  description?: string;
  statusCode?: string;
  projectId?: string;
  modifiedAt?: string;
  createdAt?: string;
}

/**
 * Test activity (a step within a test case that groups related actions).
 *
 * Note: the wire field is `parent_ID` (not camelCase), matching the Cloud ALM API.
 */
export interface ITestActivity {
  uuid?: string;
  title?: string;
  description?: string;
  sequence?: number;
  parent_ID?: string;
  modifiedAt?: string;
}

/**
 * Test action (an individual step within an activity).
 *
 * Note: the wire field is `parent_ID` (not camelCase), matching the Cloud ALM API.
 */
export interface ITestAction {
  uuid?: string;
  title?: string;
  description?: string;
  expectedResult?: string;
  sequence?: number;
  isEvidenceRequired?: boolean;
  parent_ID?: string;
  modifiedAt?: string;
}

export interface ICreateTestCaseParams {
  title: string;
  description?: string;
  projectId?: string;
}

export interface IUpdateTestCaseParams {
  title?: string;
  description?: string;
  statusCode?: string;
}

export interface ICreateTestActivityParams {
  title: string;
  parent_ID: string;
  description?: string;
  sequence?: number;
}

export interface ICreateTestActionParams {
  title: string;
  parent_ID: string;
  description?: string;
  expectedResult?: string;
  sequence?: number;
  isEvidenceRequired?: boolean;
}

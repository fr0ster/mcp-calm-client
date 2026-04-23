export interface IProject {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  /** Wire field is literally `type` (camelCase rename in Rust). */
  type?: string;
  programId?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface IProgram {
  id?: string;
  name?: string;
  description?: string;
}

export interface ITimebox {
  id?: string;
  name?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ITeamMember {
  id?: string;
  userId?: string;
  userName?: string;
  email?: string;
  role?: string;
  projectId?: string;
}

export interface ICreateProjectParams {
  name: string;
  description?: string;
  programId?: string;
}

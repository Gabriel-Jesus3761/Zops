export interface ClickUpConfig {
  apiToken?: string
  listId1?: string
  listId2?: string
  useEnvVars?: boolean
}

export interface SyncUserSummary {
  totalTasksProcessed: number
  existingUsersInDb: number
  newUsersCreated: number
  errors: number
  skippedUsers: number
}

export interface NewUser {
  id: string
  name: string
  email: string
  taskId: string
  createdAt: string
}

export interface SkippedUser {
  email: string
  name: string
  reason: string
}

export interface SyncError {
  taskId?: string
  error: string
  details?: string
}

export interface SyncUsersResponse {
  summary: SyncUserSummary
  newUsers: NewUser[]
  skippedUsers: SkippedUser[]
  errors: SyncError[]
}

export interface EnrichUsersSummary {
  totalTasks: number
  totalUsers: number
  updatedUsers: number
  errors: number
}

export interface EnrichUsersResponse {
  success: boolean
  data: {
    summary: EnrichUsersSummary
  }
  errors: SyncError[]
}

export interface ProgressUpdate {
  status: 'starting' | 'fetching' | 'complete' | 'error'
  message: string
  progress?: number
}

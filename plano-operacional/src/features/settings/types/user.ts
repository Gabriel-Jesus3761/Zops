export interface User {
  id: string
  name: string
  email: string
  filial?: string
  permission?: string
  createdAt?: string
  updatedAt?: string
  taskId?: string
  isActive?: boolean
}

export interface UsersListResponse {
  users: User[]
  total: number
}

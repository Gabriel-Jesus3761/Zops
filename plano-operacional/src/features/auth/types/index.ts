export type Permission =
  | 'admin'
  | 'planner'
  | 'config'
  | 'ECC'
  | 'GET'
  | 'controle'
  | 'tecnico'
  | 'user'

export interface User {
  id: string
  name: string
  email: string
  permission: Permission
  permissionEvento?: string
}

export interface AuthToken {
  token: string
  expirationDate: number
}

export interface LoginCredentials {
  email: string
  password: string
  os?: string
}

export interface LoginResponse {
  userId: string
  user: string
  token: string
  permission: Permission
}

export interface AuthState {
  user: User | null
  token: AuthToken | null
  isAuthenticated: boolean
  isLoading: boolean
  pipeId: string | null
}

export interface EquipeMember {
  nome: string
  funcao: string
}

export interface EventoData {
  taskId?: string
  EVENTO?: string
  ENDERECO?: string
  equipeEscalada?: EquipeMember[]
  organizacao?: string
}

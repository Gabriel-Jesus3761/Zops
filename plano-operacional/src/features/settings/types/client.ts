export interface Client {
  id: string
  name: string
  document: string // CNPJ ou CPF
  email?: string
  phone?: string
  city?: string
  state?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ClientsListResponse {
  clients: Client[]
  total: number
}

export interface ClientStats {
  total: number
  active: number
  states: number
}

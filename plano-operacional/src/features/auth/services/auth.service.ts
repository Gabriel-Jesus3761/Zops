import { api } from '@/services/api'
import type {
  LoginCredentials,
  LoginResponse,
  EventoData,
  Permission,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL

const ADMIN_PERMISSIONS: Permission[] = [
  'admin',
  'planner',
  'config',
  'GET',
  'controle',
  'tecnico',
]

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/employeeLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (response.status === 401) {
      throw new Error('Credenciais inválidas')
    }

    if (response.status === 404) {
      throw new Error('Usuário não encontrado')
    }

    if (!response.ok) {
      throw new Error('Erro no servidor')
    }

    return response.json()
  },

  getEvento: async (pipeId: string): Promise<EventoData> => {
    const response = await fetch(`${API_BASE}/getDocAlternative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Origin-Page': 'auth.service.ts',
      },
      body: JSON.stringify({
        url: 'pipe',
        docId: `pipeId_${pipeId}`,
      }),
    })

    if (!response.ok) {
      throw new Error('Falha ao buscar informações do evento')
    }

    return response.json()
  },

  verifyUserInEvento: async (
    userName: string,
    pipeId: string
  ): Promise<{ isEscalado: boolean; permissionEvento: string }> => {
    const evento = await authService.getEvento(pipeId)

    if (!evento.equipeEscalada) {
      return { isEscalado: false, permissionEvento: '' }
    }

    const member = evento.equipeEscalada.find(
      (e) => e.nome.trim().toLowerCase() === userName.trim().toLowerCase()
    )

    return {
      isEscalado: !!member,
      permissionEvento: member?.funcao || '',
    }
  },

  isAdminPermission: (permission: Permission): boolean => {
    return ADMIN_PERMISSIONS.includes(permission)
  },

  saveToken: async (token: string): Promise<void> => {
    await fetch(`${API_BASE}/saveToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },
}

export { api }

import type { User, UsersListResponse } from '../types/user'

const CLOUD_FUNCTIONS_BASE = 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

export const usersService = {
  async getUsers(): Promise<UsersListResponse> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/getAtivos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Origin-Page': 'ManageUsers.tsx',
        },
        body: JSON.stringify({
          url: 'users',
          // Sem where para buscar todos os usuários
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const result = await response.json()

      // Suporta tanto formato docs quanto array direto
      let allUsers: User[] = []
      if (result.docs && Array.isArray(result.docs)) {
        allUsers = result.docs.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            name: data.username || data.name || '',
            email: data.email || '',
            filial: data.filial || '',
            permission: data.permission || '',
            ...data,
          }
        })
      } else if (Array.isArray(result)) {
        allUsers = result.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            name: data.username || data.name || '',
            email: data.email || '',
            filial: data.filial || '',
            permission: data.permission || '',
            ...data,
          }
        })
      }

      // Ordenar por nome
      allUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

      return {
        users: allUsers,
        total: allUsers.length,
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Erro ao buscar usuários. Verifique as permissões do Firestore.')
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDocMerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'users',
          docId: userId,
          data: {
            ...data,
            updatedAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error('Erro ao atualizar usuário')
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/deleteDoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'users',
          docId: userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Erro ao excluir usuário')
    }
  },
}

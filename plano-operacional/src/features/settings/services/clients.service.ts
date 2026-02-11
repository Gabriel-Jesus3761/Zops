import type { Client, ClientsListResponse, ClientStats } from '../types/client'

const CLOUD_FUNCTIONS_BASE = 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

export const clientsService = {
  async getClients(): Promise<ClientsListResponse> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/getAtivos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Origin-Page': 'ManageClients.tsx',
        },
        body: JSON.stringify({
          url: 'clientes',
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar clientes')
      }

      const result = await response.json()

      let allClients: Client[] = []
      if (result.docs && Array.isArray(result.docs)) {
        allClients = result.docs.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            name: data.name || data.razaoSocial || data.nomeFantasia || '',
            document: data.document || data.cnpj || data.cpf || '',
            email: data.email || '',
            phone: data.phone || data.telefone || '',
            city: data.city || data.cidade || '',
            state: data.state || data.estado || data.uf || '',
            isActive: data.isActive ?? data.ativo ?? true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          }
        })
      } else if (Array.isArray(result)) {
        allClients = result.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            name: data.name || data.razaoSocial || data.nomeFantasia || '',
            document: data.document || data.cnpj || data.cpf || '',
            email: data.email || '',
            phone: data.phone || data.telefone || '',
            city: data.city || data.cidade || '',
            state: data.state || data.estado || data.uf || '',
            isActive: data.isActive ?? data.ativo ?? true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          }
        })
      }

      // Ordenar por nome
      allClients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

      return {
        clients: allClients,
        total: allClients.length,
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Erro ao buscar clientes. Verifique as permissões do Firestore.')
    }
  },

  getStats(clients: Client[]): ClientStats {
    const active = clients.filter(c => c.isActive).length
    const uniqueStates = new Set(clients.map(c => c.state).filter(Boolean))

    return {
      total: clients.length,
      active,
      states: uniqueStates.size,
    }
  },

  async createClient(data: Omit<Client, 'id'>): Promise<string> {
    try {
      // Gera um ID único para o documento
      const docId = crypto.randomUUID()

      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionURL: 'clientes',
          docId,
          formData: {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar cliente')
      }

      return docId
    } catch (error) {
      console.error('Error creating client:', error)
      throw new Error('Erro ao criar cliente')
    }
  },

  async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDocMerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'clientes',
          docId: clientId,
          data: {
            ...data,
            updatedAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar cliente')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      throw new Error('Erro ao atualizar cliente')
    }
  },

  async deleteClient(clientId: string): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/deleteDoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'clientes',
          docId: clientId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir cliente')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      throw new Error('Erro ao excluir cliente')
    }
  },
}

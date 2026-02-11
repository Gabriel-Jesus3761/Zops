import type {
  LocalEvento,
  LocalEventoFormData,
} from '../types/local-evento'

const CLOUD_FUNCTIONS_BASE = 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

interface MCOVinculada {
  id: string
  codigo: string | null
  nome_evento: string
  status: string | null
  faturamento_estimado: string
}

export const locaisEventosService = {
  async getLocais(): Promise<LocalEvento[]> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/getAtivos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Origin-Page': 'LocaisEventos.tsx',
        },
        body: JSON.stringify({
          url: 'locais_eventos',
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar locais')
      }

      const result = await response.json()

      let allLocais: LocalEvento[] = []
      if (result.docs && Array.isArray(result.docs)) {
        allLocais = result.docs.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            nome: data.nome || '',
            apelido: data.apelido || null,
            tipo: data.tipo || 'outro',
            logradouro: data.logradouro || null,
            numero: data.numero || null,
            complemento: data.complemento || null,
            bairro: data.bairro || null,
            cidade: data.cidade || '',
            uf: data.uf || '',
            cep: data.cep || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            capacidade_maxima: data.capacidade_maxima || null,
            capacidade_sentado: data.capacidade_sentado || null,
            capacidade_em_pe: data.capacidade_em_pe || null,
            tem_cobertura: data.tem_cobertura || false,
            tem_ar_condicionado: data.tem_ar_condicionado || false,
            tem_estacionamento: data.tem_estacionamento || false,
            vagas_estacionamento: data.vagas_estacionamento || null,
            tem_acessibilidade: data.tem_acessibilidade || false,
            contato_nome: data.contato_nome || null,
            contato_telefone: data.contato_telefone || null,
            contato_email: data.contato_email || null,
            observacoes: data.observacoes || null,
            ativo: data.ativo ?? true,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
            updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
            created_by: data.created_by || null,
            updated_by: data.updated_by || null,
          }
        })
      } else if (Array.isArray(result)) {
        allLocais = result.map((doc: any) => {
          const data = doc.data || doc
          return {
            id: doc.id,
            nome: data.nome || '',
            apelido: data.apelido || null,
            tipo: data.tipo || 'outro',
            logradouro: data.logradouro || null,
            numero: data.numero || null,
            complemento: data.complemento || null,
            bairro: data.bairro || null,
            cidade: data.cidade || '',
            uf: data.uf || '',
            cep: data.cep || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            capacidade_maxima: data.capacidade_maxima || null,
            capacidade_sentado: data.capacidade_sentado || null,
            capacidade_em_pe: data.capacidade_em_pe || null,
            tem_cobertura: data.tem_cobertura || false,
            tem_ar_condicionado: data.tem_ar_condicionado || false,
            tem_estacionamento: data.tem_estacionamento || false,
            vagas_estacionamento: data.vagas_estacionamento || null,
            tem_acessibilidade: data.tem_acessibilidade || false,
            contato_nome: data.contato_nome || null,
            contato_telefone: data.contato_telefone || null,
            contato_email: data.contato_email || null,
            observacoes: data.observacoes || null,
            ativo: data.ativo ?? true,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
            updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
            created_by: data.created_by || null,
            updated_by: data.updated_by || null,
          }
        })
      }

      // Ordenar por nome
      allLocais.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))

      return allLocais
    } catch (error) {
      console.error('Error fetching locais:', error)
      throw new Error('Erro ao buscar locais. Verifique as permissões.')
    }
  },

  async createLocal(data: LocalEventoFormData): Promise<string> {
    try {
      const docId = crypto.randomUUID()

      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionURL: 'locais_eventos',
          docId,
          formData: {
            ...data,
            cep: data.cep?.replace(/\D/g, '') || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar local')
      }

      return docId
    } catch (error) {
      console.error('Error creating local:', error)
      throw new Error('Erro ao criar local')
    }
  },

  async updateLocal(localId: string, data: Partial<LocalEventoFormData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        cep: data.cep?.replace(/\D/g, '') || undefined,
        updated_at: new Date().toISOString(),
      }

      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDocMerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'locais_eventos',
          docId: localId,
          data: updateData,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar local')
      }
    } catch (error) {
      console.error('Error updating local:', error)
      throw new Error('Erro ao atualizar local')
    }
  },

  async deleteLocal(localId: string): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/deleteDoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'locais_eventos',
          docId: localId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir local')
      }
    } catch (error) {
      console.error('Error deleting local:', error)
      throw new Error('Erro ao excluir local')
    }
  },

  async toggleActive(localId: string, ativo: boolean): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDocMerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'locais_eventos',
          docId: localId,
          data: {
            ativo,
            updated_at: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do local')
      }
    } catch (error) {
      console.error('Error toggling active:', error)
      throw new Error('Erro ao alterar status do local')
    }
  },

  async importLocais(dados: LocalEventoFormData[]): Promise<number> {
    try {
      const promises = dados.map(data => this.createLocal(data))
      await Promise.all(promises)
      return dados.length
    } catch (error) {
      console.error('Error importing locais:', error)
      throw new Error('Erro ao importar locais')
    }
  },

  async verificarMCOsVinculadas(_localId: string): Promise<MCOVinculada[]> {
    try {
      // TODO: Implementar busca de MCOs vinculadas quando necessário
      // Por enquanto retorna array vazio
      return []
    } catch (error) {
      console.error('Error verifying MCOs:', error)
      return []
    }
  },
}

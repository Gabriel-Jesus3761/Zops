// TODO: Descomentar quando implementar integração com Firestore
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
// import { db } from '@/config/firebase'
import type { MCO } from '../types/mco.types'

// Mock data para desenvolvimento
const mockMCOs: MCO[] = [
  {
    id: '1',
    codigo: 'MCO-0001',
    nome_evento: 'Festival de Música São Paulo 2024',
    cidade: 'São Paulo',
    uf: 'SP',
    data_inicial: '2024-03-15',
    data_final: '2024-03-17',
    status: 'aprovado',
    faturamento_estimado: '500000',
    publico_estimado: '50000',
    custo_operacional_efetivo: 125000,
    cot: 25,
    cliente_id: '1',
    cliente_nome: 'Empresa ABC',
    responsavel_nome: 'João Silva',
    updated_at: new Date().toISOString(),
    porte: 'Grande',
    tipo_atendimento: 'atendimento_matriz',
    num_sessoes: 3
  },
  {
    id: '2',
    codigo: 'MCO-0002',
    nome_evento: 'Congresso de Tecnologia Rio',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    data_inicial: '2024-04-20',
    data_final: '2024-04-22',
    status: 'pendente',
    faturamento_estimado: '300000',
    publico_estimado: '30000',
    custo_operacional_efetivo: 75000,
    cot: 25,
    cliente_id: '2',
    cliente_nome: 'Tech Corp',
    responsavel_nome: 'Maria Santos',
    updated_at: new Date().toISOString(),
    porte: 'Médio',
    tipo_atendimento: 'filial',
    num_sessoes: 2
  },
  {
    id: '3',
    codigo: 'MCO-0003',
    nome_evento: 'Feira de Negócios BH',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    data_inicial: '2024-05-10',
    data_final: '2024-05-12',
    status: 'aprovado',
    faturamento_estimado: '200000',
    publico_estimado: '20000',
    custo_operacional_efetivo: 50000,
    cot: 25,
    cliente_id: '3',
    cliente_nome: 'BH Eventos',
    responsavel_nome: 'Pedro Costa',
    updated_at: new Date().toISOString(),
    porte: 'Médio',
    tipo_atendimento: 'filial_interior',
    num_sessoes: 2
  }
]

export const mcoService = {
  // Listar todas as MCOs
  async listarMCOs(): Promise<MCO[]> {
    try {
      // TODO: Substituir por query real do Firestore quando a coleção estiver criada
      // const q = query(collection(db, 'mcos'), orderBy('updated_at', 'desc'))
      // const querySnapshot = await getDocs(q)
      // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MCO))

      // Por enquanto, retorna dados mock
      return mockMCOs
    } catch (error) {
      console.error('Erro ao listar MCOs:', error)
      throw error
    }
  },

  // Buscar MCO por ID
  async buscarMCO(id: string): Promise<MCO | null> {
    try {
      // TODO: Implementar busca no Firestore
      const mco = mockMCOs.find(m => m.id === id)
      return mco || null
    } catch (error) {
      console.error('Erro ao buscar MCO:', error)
      throw error
    }
  },

  // Criar nova MCO
  async criarMCO(mco: Omit<MCO, 'id' | 'updated_at'>): Promise<MCO> {
    try {
      // TODO: Implementar criação no Firestore
      // const docRef = await addDoc(collection(db, 'mcos'), {
      //   ...mco,
      //   updated_at: new Date().toISOString()
      // })
      // return { id: docRef.id, ...mco, updated_at: new Date().toISOString() }

      const novaMCO: MCO = {
        ...mco,
        id: String(mockMCOs.length + 1),
        updated_at: new Date().toISOString()
      }
      mockMCOs.push(novaMCO)
      return novaMCO
    } catch (error) {
      console.error('Erro ao criar MCO:', error)
      throw error
    }
  },

  // Atualizar MCO
  async atualizarMCO(id: string, dados: Partial<MCO>): Promise<void> {
    try {
      // TODO: Implementar atualização no Firestore
      // const mcoRef = doc(db, 'mcos', id)
      // await updateDoc(mcoRef, {
      //   ...dados,
      //   updated_at: new Date().toISOString()
      // })

      const index = mockMCOs.findIndex(m => m.id === id)
      if (index !== -1) {
        mockMCOs[index] = {
          ...mockMCOs[index],
          ...dados,
          updated_at: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar MCO:', error)
      throw error
    }
  },

  // Deletar MCO
  async deletarMCO(id: string): Promise<void> {
    try {
      // TODO: Implementar deleção no Firestore
      // const mcoRef = doc(db, 'mcos', id)
      // await deleteDoc(mcoRef)

      const index = mockMCOs.findIndex(m => m.id === id)
      if (index !== -1) {
        mockMCOs.splice(index, 1)
      }
    } catch (error) {
      console.error('Erro ao deletar MCO:', error)
      throw error
    }
  },

  // Aprovar MCO
  async aprovarMCO(id: string): Promise<void> {
    try {
      await this.atualizarMCO(id, { status: 'aprovado' })
    } catch (error) {
      console.error('Erro ao aprovar MCO:', error)
      throw error
    }
  },

  // Rejeitar MCO
  async rejeitarMCO(id: string): Promise<void> {
    try {
      await this.atualizarMCO(id, { status: 'rejeitado' })
    } catch (error) {
      console.error('Erro ao rejeitar MCO:', error)
      throw error
    }
  }
}

export type PDVStatus = 'Pendente' | 'Em Preparação' | 'Entregue' | 'Devolvido' | 'Cancelado'

export type EquipmentType = 'TERMINAL' | 'INSUMO'

export interface Equipment {
  TIPO: EquipmentType
  MODELO: string
  QUANTIDADE: number
  ID?: string
}

export interface SerialInfo {
  serialMaquina: string
  deviceZ: string
  serialN: string
  operador: string
  modelo?: string
}

export interface PDV {
  key: string
  'Ponto de Venda': string
  Status: PDVStatus
  desativado?: boolean
  setor?: string
  categoria?: string
  responsavel?: string
  dataEntrega?: string
  dataDevolucao?: string
  observacoes?: string

  // Equipamentos
  SERIAIS_FISICOS: string[]
  TERMINAIS?: Equipment[]
  equipamentos: Equipment[]

  // Contadores
  totalTerminais: number
  carregadores: number
  capas: number
  cartoes: number
  powerbanks: number
  tomadas: number

  // Metadata
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  updatedBy?: string
}

export interface EstoqueItem {
  key: string
  modelo: string
  quantidade: number
  tipo: EquipmentType
  disponivel?: number
  alocado?: number
  reservado?: number
}

export interface DashboardMetrics {
  totalPDVs: number
  pdvsAtivos: number
  pdvsInativos: number
  pdvsPendentes: number
  pdvsEntregues: number
  pdvsDevolvidos: number

  totalTerminais: number
  terminaisAlocados: number
  terminaisDisponiveis: number

  totalInsumos: number
  insumosAlocados: number
  insumosDisponiveis: number

  taxaOcupacao: number
  alertasBaixoEstoque: number
}

export interface PlanoFilters {
  searchText: string
  status: PDVStatus[]
  setor: string[]
  categoria: string[]
  dataInicio?: Date
  dataFim?: Date
}

export interface TransferenciaRequest {
  itemId: string
  origem: string // 'estoque' ou PDV key
  destino: string // PDV key
  quantidade: number
  seriais?: string[]
  responsavel: string
  observacoes?: string
}

export interface Activity {
  id: string
  tipo: 'criacao' | 'edicao' | 'transferencia' | 'entrega' | 'devolucao' | 'status'
  pdvId?: string
  pdvNome?: string
  descricao: string
  usuario: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// CCO - Centro de Controle Operacional (Estoques Auxiliares)
export interface CCO {
  id: string
  nome: string
  localizacao?: string
  responsavel?: string
  descricao?: string
  ativo: boolean
  equipamentos: EstoqueItem[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface CreateCCORequest {
  nome: string
  localizacao?: string
  responsavel?: string
  descricao?: string
}

// Comodato - Empréstimos para Técnicos
export type ComodatoStatus = 'Emprestado' | 'Devolvido' | 'Atrasado'

export interface Comodato {
  id: string
  tecnico: {
    nome: string
    cpf: string
    contato?: string
    setor?: string
  }
  item: {
    tipo: EquipmentType
    modelo: string
    serial?: string
    quantidade: number
  }
  status: ComodatoStatus
  dataEmprestimo: Date
  dataPrevistaRetorno: Date
  dataRetorno?: Date
  observacoes?: string
  assinaturaTecnico?: string
  assinaturaResponsavel?: string
  responsavelEntrega: string
  responsavelRecebimento?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateComodatoRequest {
  tecnicoNome: string
  tecnicoCpf: string
  tecnicoContato?: string
  tecnicoSetor?: string
  itemTipo: EquipmentType
  itemModelo: string
  itemSerial?: string
  itemQuantidade: number
  dataPrevistaRetorno: Date
  observacoes?: string
  assinaturaTecnico?: string
}

export interface DevolucaoComodatoRequest {
  comodatoId: string
  dataRetorno: Date
  observacoes?: string
  assinaturaResponsavel?: string
}

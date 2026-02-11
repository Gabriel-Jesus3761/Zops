import type { LocalDetailed } from '../services/geocoding.service'

export interface MCO {
  id: string
  codigo: string
  nome_evento: string
  cidade: string
  uf: string
  data_inicial: string
  data_final: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  faturamento_estimado: string
  publico_estimado?: string
  custo_operacional_efetivo: number
  cot: number
  cliente_id: string | null
  cliente_nome?: string
  responsavel_nome?: string
  updated_at: string
  porte?: string
  tipo_atendimento?: 'atendimento_matriz' | 'filial' | 'filial_interior'
  num_sessoes?: number
  // Dados operacionais
  modalidade_id?: string
  time_tecnico?: boolean
  logistica?: boolean
  cliente_fornece_alimentacao?: boolean
  cliente_fornece_hospedagem?: boolean
  // Breakdown de custos
  breakdown_custos?: any
}

// Tipos para o Wizard de criação de MCO
export interface Sessao {
  dataHoraInicio: Date | null
  dataHoraFim: Date | null
  jornadaId?: string
  jornadaNome?: string
}

export interface MCOEventoData {
  cliente: string
  clienteNome?: string
  nomeEvento: string
  datasEvento: Date[]
  sessoes: Sessao[]
  faturamentoEstimado: string
  publicoEstimado: string
  localEvento: string
  localEventoNome?: string
  uf: string
  cidade: string
  /** Dados enriquecidos do local (Nominatim + Overpass) — salvos em Locais de Projetos ao criar MCO */
  localEventoDetalhes?: LocalDetailed
}

export interface MCOOperacionalData {
  timeTecnico: boolean
  logistica: boolean
  clienteForneceAlimentacaoGoLive: boolean
  clienteForneceHospedagemAlpha: boolean
  modalidadeId: string
}

export type WizardStep = 'evento' | 'operacional' | 'resumo'

export interface CreationProgress {
  currentStep: number
  progress: number
  status: 'processing' | 'success' | 'error'
  errorMessage?: string
  mcoId?: string
}

export interface MCOFilters {
  searchTerm: string
  statusFilter: 'todos' | 'pendente' | 'aprovado' | 'rejeitado'
}

export interface MCOStats {
  total: number
  custoMedio: number
  pendentesAprovacao: number
  tiposAtendimento: {
    matriz: number
    filial: number
    filialInterior: number
  }
}

export type SortField = 'codigo' | 'nome_evento' | 'cliente_nome' | 'cidade' | 'porte' | 'data_inicial' | 'custo_operacional_efetivo' | 'cot' | 'status'
export type SortDirection = 'asc' | 'desc' | null

// Asset types and interfaces for Gestao de Inventario

export interface Asset {
  id: string
  firestoreId: string
  dataId?: string

  // Identification
  tipo: string
  modelo: string
  adquirencia: string
  serialMaquina: string
  serialN?: string
  deviceZ?: string

  // Status
  situacao: 'Good' | 'Bad'
  categoria: string
  subCategoria: string
  categoria_parque?: string
  subcategoria_parque?: string

  // Allocation
  alocacao: string
  detalhamento?: string

  // Audit
  ultimaModificacao?: string | Date
  ultimaModificacaoPor?: string

  // History
  historico?: AssetHistoryEntry[]
}

export interface AssetHistoryEntry {
  data: string | Date
  dataFormatada?: string
  tipo: string
  detalhes: string
  usuario: string
  usuarioNome?: string
}

export interface AssetFilters {
  q: string
  where: Record<string, string[]>
  range?: {
    field: string
    start: Date
    end: Date
  }
  incompleteOnly: boolean
  osOnly: boolean
  osId?: string
  transitOnly: boolean
  transitFrom?: string
  transitTo?: string
}

export interface FilterOptions {
  tipo: string[]
  modelo: string[]
  adquirencia: string[]
  alocacao: string[]
  categoria_parque: string[]
  subcategoria_parque: string[]
  situacao: string[]
  detalhamento: string[]
}

export interface TablePreferences {
  density: 'compact' | 'middle' | 'large'
  visibleColumns: string[]
  pageSize: number
}

export interface SavedView {
  id: string
  name: string
  tab: string
  filters: AssetFilters
  tablePrefs: TablePreferences
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BulkUpdatePayload {
  field: keyof Asset
  value: string
  assets: Asset[]
}

export interface SerialSearchResult {
  filial: string
  inputCount: number
  filialCount: number
  missingSerials: string[]
  extrasInFilial: Asset[]
  emOutraFilial: Asset[]
  alocadosEmOS: Asset[]
  duplicadosEntrada: string[]
  matchedCount: number
}

export interface ExportProgress {
  current: number
  total: number
  percentage: number
  phase: 'fetching' | 'processing' | 'generating' | 'complete'
  batchCount: number
  currentBatch: number
}

export interface MissingDataStats {
  semSerialN: number
  semDeviceZ: number
  semAmbos: number
  total: number
}

export type TabKey =
  | 'all'
  | 'good'
  | 'bad'
  | 'indisponivel'
  | 'perdas'
  | 'transito'
  | 'dashboard'

export const TABS_CONFIG: Record<TabKey, { label: string; icon: string; filter?: Partial<AssetFilters['where']> }> = {
  all: { label: 'Parque Total', icon: 'Package' },
  good: { label: 'Ativos Good', icon: 'CheckCircle', filter: { situacao: ['Good'] } },
  bad: { label: 'Ativos Bad', icon: 'XCircle', filter: { situacao: ['Bad'] } },
  indisponivel: { label: 'Indisponíveis', icon: 'Ban', filter: { detalhamento: ['Possível perda'] } },
  perdas: { label: 'Perdas', icon: 'AlertTriangle', filter: { detalhamento: ['Perda protocolada', 'Perda não protocolada'] } },
  transito: { label: 'Em Trânsito', icon: 'ArrowLeftRight' },
  dashboard: { label: 'Dashboard', icon: 'BarChart3' },
}

export const DENSITY_OPTIONS = {
  COMPACT: 'compact',
  MIDDLE: 'middle',
  LARGE: 'large',
} as const

export const MOTIVOS_INATIVIDADE = [
  'Em manutenção',
  'Obsoleto',
  'Tamper',
  'Não Liga',
  'Leitor de cartão danificado',
  'Perda protocolada',
  'Perda não protocolada',
  'Possível perda',
  'Baixa na adquirente',
  'Problema de conexão',
  'Queda de EC',
  'Tela quebrada',
  'Tampa da caixa da bobina quebrada',
  'Devolvido para adquirente',
  'Problema não mapeado',
] as const

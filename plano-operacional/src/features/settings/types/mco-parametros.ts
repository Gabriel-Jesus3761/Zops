// =============================================================================
// TIPOS DOS PARAMETROS MCO
// Baseado no sistema mcozig v1.5.2
// =============================================================================

// -----------------------------------------------------------------------------
// CLUSTERS
// Categorias de tamanho do evento baseado em faturamento por sessão
// -----------------------------------------------------------------------------
export type ClusterTamanho = 'PP' | 'P' | 'M' | 'G' | 'MEGA'

export interface Cluster {
  id: string
  tamanho: ClusterTamanho
  nome: string // Ex: "Pequeno Porte", "Médio", "Grande", "Mega"
  faturamento_piso: number // Valor mínimo para esta faixa
  faturamento_teto: number // Valor máximo para esta faixa
  ite: number // Índice Técnico por Evento (terminais por técnico)
  dias_setup: number // Dias de setup padrão
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ClusterFormData {
  tamanho: ClusterTamanho
  nome: string
  faturamento_piso: number
  faturamento_teto: number
  ite: number
  dias_setup: number
}

// -----------------------------------------------------------------------------
// FILIAIS ZIG
// Pontos de atendimento com raio de atuação
// -----------------------------------------------------------------------------
export interface FilialZig {
  id: string
  nome: string
  cidade: string
  uf: string
  regiao?: string
  latitude: number
  longitude: number
  endereco?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  raio_atuacao_km: number // Distância máxima que atende localmente
  cluster_limite: ClusterTamanho // Tamanho máximo de evento que pode atender
  is_matriz: boolean // Se é a matriz (SP)
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FilialZigFormData {
  nome: string
  cidade: string
  uf: string
  regiao?: string
  latitude: number
  longitude: number
  endereco?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  raio_atuacao_km: number
  cluster_limite: ClusterTamanho
  is_matriz: boolean
}

// -----------------------------------------------------------------------------
// CARGOS
// Funções da equipe operacional
// -----------------------------------------------------------------------------
export type CargoTime = 'tecnico' | 'comercial' | 'suporte' | 'lideranca'

export interface Cargo {
  id: string
  nome: string // Ex: "Técnico de Campo", "Líder Técnico"
  sigla: string // Ex: "TCA", "LTT"
  time: CargoTime
  descricao?: string
  valor_diaria: number // Valor da diária do cargo
  ordem: number // Ordem de exibição
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CargoFormData {
  nome: string
  sigla: string
  time: CargoTime
  descricao?: string
  valor_diaria: number
  ordem: number
}

// -----------------------------------------------------------------------------
// CARGO POR CLUSTER
// Quantidade base de cada cargo por cluster
// -----------------------------------------------------------------------------
export interface CargoCluster {
  id: string
  cluster_id: string
  cargo_id: string
  quantidade: number // Quantidade base para este cluster
  created_at: string
  updated_at: string
  // Relacionamentos (para exibição)
  cluster?: Cluster
  cargo?: Cargo
}

export interface CargoClusterFormData {
  cluster_id: string
  cargo_id: string
  quantidade: number
}

// -----------------------------------------------------------------------------
// MODALIDADES OPERACIONAIS
// Tipos de operação com TPV diferente
// -----------------------------------------------------------------------------
export interface Modalidade {
  id: string
  nome: string // Ex: "Self-Service", "Atendimento Assistido", "Híbrido", "Cashless"
  descricao?: string
  tpv_por_terminal: number // Taxa por Volume - valor transacionado por terminal
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ModalidadeFormData {
  nome: string
  descricao?: string
  tpv_por_terminal: number
}

// -----------------------------------------------------------------------------
// JORNADAS
// Horários de trabalho
// -----------------------------------------------------------------------------
export interface Jornada {
  id: string
  nome: string // Ex: "Diurna", "Noturna", "Madrugada"
  hora_inicio: string // HH:mm
  hora_fim: string // HH:mm
  duracao_horas: number // Duração em horas
  adicional_noturno: boolean
  ordem: number // Ordem de exibição
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface JornadaFormData {
  nome: string
  hora_inicio: string
  hora_fim: string
}

// -----------------------------------------------------------------------------
// PARÂMETROS DE TRANSPORTE
// Configurações de modal de transporte e custos
// -----------------------------------------------------------------------------
export type ModalTransporte = 'carro' | 'onibus' | 'aereo'

export interface ParametrosTransporte {
  id: string
  modal: ModalTransporte
  distancia_minima_km: number // Distância mínima para usar este modal
  distancia_maxima_km: number // Distância máxima para usar este modal
  custo_por_km: number // Custo por km
  custo_fixo: number // Custo fixo adicional
  pessoas_minimas?: number // Mínimo de pessoas para considerar (ex: aéreo > 8)
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ParametrosTransporteFormData {
  modal: ModalTransporte
  distancia_minima_km: number
  distancia_maxima_km: number
  custo_por_km: number
  custo_fixo: number
  pessoas_minimas?: number
}

// -----------------------------------------------------------------------------
// PARÂMETROS DE FRETE
// Matriz de custos de frete por filial e cluster
// -----------------------------------------------------------------------------
export interface ParametrosFrete {
  id: string
  filial_id: string
  cluster_id: string
  valor_base: number // Valor base do frete
  raio_maximo_km: number // Raio máximo incluído no valor base
  valor_km_adicional: number // Valor por km excedente
  ativo: boolean
  created_at: string
  updated_at: string
  // Relacionamentos
  filial?: FilialZig
  cluster?: Cluster
}

export interface ParametrosFreteFormData {
  filial_id: string
  cluster_id: string
  valor_base: number
  raio_maximo_km: number
  valor_km_adicional: number
}

// -----------------------------------------------------------------------------
// PARÂMETROS DE ALIMENTAÇÃO
// Valor de alimentação por categoria (fase) + jornada (opcional)
// Fases com valor único: Viagem, Setup, Day Off (jornada_id = null)
// Go Live: valor por jornada (jornada_id preenchido)
// -----------------------------------------------------------------------------
export interface AlimentacaoValor {
  id: string
  categoria_id: string // FK → CategoriaRemuneracao
  jornada_id: string | null // FK → Jornada (null para fases com valor único)
  valor: number
  created_at: string
  updated_at: string
}

export interface AlimentacaoValorFormData {
  categoria_id: string
  jornada_id: string | null
  valor: number
}

// -----------------------------------------------------------------------------
// HOSPEDAGEM BASE DE CUSTO
// Valores de diária por cidade/UF/região
// -----------------------------------------------------------------------------
export interface HospedagemBaseCusto {
  id: string
  regiao: string // Norte, Nordeste, Centro-Oeste, Sudeste, Sul
  uf: string     // Sigla do estado (SP, RJ, etc.)
  cidade: string
  valor_diaria: number
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// HOSPEDAGEM ELEGIBILIDADE
// Quais cargos têm direito à hospedagem por cluster
// -----------------------------------------------------------------------------
export interface HospedagemElegibilidade {
  id: string
  cargo_id: string
  cluster_id: string
  elegivel: boolean
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// PARÂMETROS DE HOSPEDAGEM
// Valores de diárias de hotel
// -----------------------------------------------------------------------------
export interface ParametrosHospedagem {
  id: string
  nome: string // Ex: "Padrão", "Executivo"
  valor_diaria: number
  cidade?: string // Se específico para cidade
  uf?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ParametrosHospedagemFormData {
  nome: string
  valor_diaria: number
  cidade?: string
  uf?: string
}

// -----------------------------------------------------------------------------
// PARÂMETROS GERAIS MCO
// Configurações globais do sistema
// -----------------------------------------------------------------------------
export interface ParametrosGeraisMCO {
  id: string
  // Mão de obra
  max_tecnicos_por_lider: number // Quantos TCAs por LTT
  // Transporte local
  valor_transporte_local_diario: number
  // Day Off
  valor_day_off_diario: number
  // Viagem
  distancia_evento_local_km: number // Abaixo disso considera evento local
  // Outros
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ParametrosGeraisMCOFormData {
  max_tecnicos_por_lider: number
  valor_transporte_local_diario: number
  valor_day_off_diario: number
  distancia_evento_local_km: number
}

// -----------------------------------------------------------------------------
// TIPO DE ATENDIMENTO
// Resultado da classificação do evento
// -----------------------------------------------------------------------------
export type TipoAtendimento = 'atendimento_matriz' | 'filial' | 'filial_interior'

export interface TipoAtendimentoConfig {
  tipo: TipoAtendimento
  nome: string
  descricao: string
  incluir_viagem: boolean
  incluir_setup: boolean
  incluir_hospedagem: boolean
  incluir_transporte: boolean
  incluir_frete: boolean
  origem_transporte?: 'matriz' | 'filial'
}

export const TIPOS_ATENDIMENTO_CONFIG: Record<TipoAtendimento, TipoAtendimentoConfig> = {
  atendimento_matriz: {
    tipo: 'atendimento_matriz',
    nome: 'Atendimento Matriz',
    descricao: 'Equipe sai de São Paulo',
    incluir_viagem: true,
    incluir_setup: true,
    incluir_hospedagem: true,
    incluir_transporte: true,
    incluir_frete: true,
    origem_transporte: 'matriz',
  },
  filial: {
    tipo: 'filial',
    nome: 'Filial',
    descricao: 'Equipe local, sem viagem',
    incluir_viagem: false,
    incluir_setup: false,
    incluir_hospedagem: false,
    incluir_transporte: false,
    incluir_frete: true,
  },
  filial_interior: {
    tipo: 'filial_interior',
    nome: 'Filial Interior',
    descricao: 'Equipe viaja da filial',
    incluir_viagem: false, // Condicional
    incluir_setup: false,
    incluir_hospedagem: false, // Condicional
    incluir_transporte: false, // Condicional
    incluir_frete: true,
  },
}

// -----------------------------------------------------------------------------
// STATS E HELPERS
// -----------------------------------------------------------------------------
export interface MCOParametrosStats {
  clusters: number
  filiais: number
  cargos: number
  modalidades: number
  jornadas: number
}

// Labels para exibição (default - pode ser sobrescrito pelo banco)
export const CLUSTER_LABELS_DEFAULT: Record<string, string> = {
  PP: 'Pequeno Porte (PP)',
  P: 'Pequeno (P)',
  M: 'Médio (M)',
  G: 'Grande (G)',
  MEGA: 'Mega',
}

// Alias para compatibilidade
export const CLUSTER_LABELS = CLUSTER_LABELS_DEFAULT

// -----------------------------------------------------------------------------
// CONFIGURAÇÃO DE TAMANHOS DE CLUSTER
// Opções dinâmicas para o dropdown de tamanho
// -----------------------------------------------------------------------------
export interface ClusterTamanhoConfig {
  id: string
  sigla: string // Ex: "PP", "P", "M", "G", "MEGA"
  nome: string // Ex: "Pequeno Porte", "Pequeno", etc.
  ordem: number // Ordem de exibição
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ClusterTamanhoConfigFormData {
  sigla: string
  nome: string
  ordem: number
}

export const CARGO_TIME_LABELS: Record<CargoTime, string> = {
  tecnico: 'Técnico',
  comercial: 'Comercial',
  suporte: 'Suporte',
  lideranca: 'Liderança',
}

// -----------------------------------------------------------------------------
// CONFIGURAÇÃO DE TIMES DE CARGO
// Opções dinâmicas para o dropdown de time
// -----------------------------------------------------------------------------
export interface CargoTimeConfig {
  id: string
  sigla: string // Ex: "tecnico", "comercial", "suporte", "lideranca"
  nome: string // Ex: "Técnico", "Comercial", etc.
  ordem: number // Ordem de exibição
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CargoTimeConfigFormData {
  sigla: string
  nome: string
  ordem: number
}

export const MODAL_TRANSPORTE_LABELS: Record<ModalTransporte, string> = {
  carro: 'Carro',
  onibus: 'Ônibus',
  aereo: 'Aéreo',
}

// -----------------------------------------------------------------------------
// PARÂMETROS DE CÁLCULO DE CARGOS
// Configuração da proporção entre técnicos e líderes
// -----------------------------------------------------------------------------
export interface CargoCalculoParametros {
  id: string
  maximo_tecnicos_por_lider: number // Proporção de técnicos por líder
  cargo_tecnico_id: string | null // ID do cargo que representa o técnico
  cargo_lider_id: string | null // ID do cargo que representa o líder
  created_at: string
  updated_at: string
}

export interface CargoCalculoParametrosFormData {
  maximo_tecnicos_por_lider: number
  cargo_tecnico_id: string | null
  cargo_lider_id: string | null
}

// -----------------------------------------------------------------------------
// TIMES POR ETAPA
// Configuração de participação de times em cada etapa do evento
// -----------------------------------------------------------------------------
export interface EtapaTimeConfig {
  id: string
  etapa_id: string // ID da etapa (configurável)
  time_id: string // ID do time (configurável)
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EtapaTimeConfigFormData {
  etapa_id: string
  time_id: string
  ativo: boolean
}

// -----------------------------------------------------------------------------
// CATEGORIAS DE REMUNERAÇÃO
// Categorias para cálculo de diárias (Viagem, Setup, Day Off, Go Live)
// -----------------------------------------------------------------------------
export type TipoCalculoCategoria = string // Agora aceita qualquer string (tipos personalizados)

// Configuração de tipos de cálculo (gerenciável pelo usuário)
export interface TipoCalculoConfig {
  id: string
  valor: string // Ex: "viagem", "setup", "custom_type"
  label: string // Nome exibido
  icon: string // Nome do ícone (Plane, Wrench, Zap, Coffee, etc)
  cor_fundo: string // Ex: "bg-blue-100"
  cor_texto: string // Ex: "text-blue-700"
  cor_borda: string // Ex: "border-blue-200"
  is_sistema: boolean // true para os 4 tipos padrão (não podem ser excluídos)
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface TipoCalculoConfigFormData {
  valor: string
  label: string
  icon: string
  cor_fundo: string
  cor_texto: string
  cor_borda: string
  ordem: number
}

export interface CategoriaRemuneracao {
  id: string
  nome: string
  tipo_calculo: TipoCalculoCategoria
  descricao?: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CategoriaRemuneracaoFormData {
  nome: string
  tipo_calculo: TipoCalculoCategoria
  descricao?: string
  ordem: number
}

// -----------------------------------------------------------------------------
// DIÁRIAS - CARGO x CATEGORIA
// Valores de diárias por cargo para categorias fixas (Viagem, Setup, Day Off)
// -----------------------------------------------------------------------------
export interface CargoCategoriaValor {
  id: string
  cargo_id: string
  categoria_id: string
  valor: number
  created_at: string
  updated_at: string
}

export interface CargoCategoriaValorFormData {
  cargo_id: string
  categoria_id: string
  valor: number
}

// -----------------------------------------------------------------------------
// DIÁRIAS GO LIVE - CARGO x JORNADA x CATEGORIA
// Valores de diárias Go Live por cargo e jornada
// -----------------------------------------------------------------------------
export interface CargoJornadaCategoria {
  id: string
  cargo_id: string
  jornada_id: string
  categoria_id: string // Deve ser categoria com tipo_calculo === 'go_live'
  valor: number
  created_at: string
  updated_at: string
}

export interface CargoJornadaCategoriaFormData {
  cargo_id: string
  jornada_id: string
  categoria_id: string
  valor: number
}

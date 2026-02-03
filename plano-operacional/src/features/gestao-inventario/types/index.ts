// Asset types
export * from './asset.types'

// System configuration types
export interface ConfiguracaoSistema {
  id: string
  nome: string
  descricao: string
  valor: string | number | boolean
  tipo: 'texto' | 'numero' | 'booleano' | 'selecao'
  opcoes?: string[]
  categoria: CategoriaConfiguracao
  atualizadoEm: Date
  atualizadoPor: string
}

export type CategoriaConfiguracao =
  | 'geral'
  | 'notificacoes'
  | 'integracao'
  | 'estoque'
  | 'relatorios'

export interface ConfiguracaoEstoque {
  alertaEstoqueMinimo: boolean
  quantidadeMinimaAlerta: number
  periodoReposicao: number // dias
  metodoCalculoMedia: 'simples' | 'ponderada' | 'exponencial'
  considerarPedidosPendentes: boolean
}

export interface ConfiguracaoNotificacao {
  emailAlertaEstoque: boolean
  emailRelatoriosDiarios: boolean
  emailsNotificacao: string[]
  webhookUrl?: string
  frequenciaRelatorios: 'diario' | 'semanal' | 'mensal'
}

export interface ConfiguracaoIntegracao {
  apiKey?: string
  webhookSecret?: string
  sincronizacaoAutomatica: boolean
  intervaloSincronizacao: number // minutos
  ultimaSincronizacao?: Date
}

export interface ConfiguracaoRelatorio {
  formatoPadrao: 'pdf' | 'excel' | 'csv'
  incluirGraficos: boolean
  periodoHistorico: number // meses
  agruparPor: 'categoria' | 'fornecedor' | 'localizacao'
}

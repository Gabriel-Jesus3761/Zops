import type { MCOEventoData, MCOOperacionalData } from '../types/mco.types'
import {
  clustersService,
  cargosService,
  cargoClusterService,
  parametrosGeraisService,
} from '@/features/settings/services/mco-parametros.service'
import type { Cluster, Cargo, CargoCluster, ParametrosGeraisMCO } from '@/features/settings/types/mco-parametros'

export interface CustoBreakdown {
  mao_de_obra: {
    [cargoSigla: string]: number
    total: number
  }
  logistica: {
    frete: number
    equipamentos: number
    total: number
  }
  alimentacao: {
    go_live: number
    time_alpha: number
    total: number
  }
  hospedagem: {
    time_alpha: number
    total: number
  }
  transporte_local: {
    total: number
  }
  total_geral: number
  cot_percentual: number
}

export interface MCOCalculationResult {
  custo_operacional_efetivo: number
  cot: number
  breakdown: CustoBreakdown
  cluster_identificado?: string
}

class MCOCalculatorService {
  // Cache para evitar múltiplas requisições
  private cache: {
    clusters?: Cluster[]
    cargos?: Cargo[]
    cargoClusters?: CargoCluster[]
    parametrosGerais?: ParametrosGeraisMCO | null
    lastFetch?: number
  } = {}

  private async fetchParametros() {
    const now = Date.now()
    // Cache válido por 5 minutos
    if (this.cache.lastFetch && now - this.cache.lastFetch < 5 * 60 * 1000) {
      return
    }

    try {
      const [clusters, cargos, cargoClusters, parametrosGerais] = await Promise.all([
        clustersService.getClusters(),
        cargosService.getCargos(),
        cargoClusterService.getCargosClusters(),
        parametrosGeraisService.getParametros(),
      ])

      this.cache = {
        clusters: clusters.filter((c) => c.ativo),
        cargos: cargos.filter((c) => c.ativo),
        cargoClusters,
        parametrosGerais,
        lastFetch: now,
      }
    } catch (error) {
      console.error('Erro ao buscar parâmetros MCO:', error)
      throw new Error('Não foi possível buscar parâmetros do Firebase')
    }
  }

  private identificarCluster(faturamento: number): Cluster | null {
    if (!this.cache.clusters) return null

    // Ordena clusters por faturamento_piso (crescente)
    const clustersSorted = [...this.cache.clusters].sort(
      (a, b) => a.faturamento_piso - b.faturamento_piso
    )

    // Encontra o cluster cujo faturamento está dentro da faixa
    for (const cluster of clustersSorted) {
      if (faturamento >= cluster.faturamento_piso && faturamento <= cluster.faturamento_teto) {
        return cluster
      }
    }

    // Se não encontrou, retorna o maior cluster (MEGA)
    return clustersSorted[clustersSorted.length - 1] || null
  }

  private getDimensionamento(clusterId: string): Record<string, { cargo: Cargo; quantidade: number }> {
    if (!this.cache.cargoClusters || !this.cache.cargos) return {}

    const dimensionamento: Record<string, { cargo: Cargo; quantidade: number }> = {}

    this.cache.cargoClusters.forEach((cc) => {
      if (cc.cluster_id === clusterId && cc.quantidade > 0) {
        const cargo = this.cache.cargos!.find((c) => c.id === cc.cargo_id)
        if (cargo) {
          dimensionamento[cargo.sigla] = {
            cargo,
            quantidade: cc.quantidade,
          }
        }
      }
    })

    return dimensionamento
  }

  private calcularMaoDeObra(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    cluster: Cluster
  ): CustoBreakdown['mao_de_obra'] {
    if (!operacionalData.timeTecnico) {
      return { total: 0 }
    }

    const numDias = eventoData.datasEvento.length
    const dimensionamento = this.getDimensionamento(cluster.id)
    const custos: Record<string, number> = {}
    let total = 0

    // Calcular custo por cargo
    Object.entries(dimensionamento).forEach(([sigla, { cargo, quantidade }]) => {
      const custo = quantidade * cargo.valor_diaria * numDias
      custos[sigla] = custo
      total += custo
    })

    return {
      ...custos,
      total,
    }
  }

  private calcularLogistica(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    cluster: Cluster
  ): CustoBreakdown['logistica'] {
    if (!operacionalData.logistica) {
      return { frete: 0, equipamentos: 0, total: 0 }
    }

    // Estimativa simples de distância (depois pode integrar com Google Maps via geocoding)
    const kmEstimado = 500 // Placeholder - depois integrar com geocoding service
    const custoFretePorKm = 3.5 // Placeholder - depois buscar de parametros_frete

    const custoFrete = kmEstimado * custoFretePorKm

    // Equipamento base por cluster
    const custoEquipamentos = 5000 // Placeholder - depois buscar de parametros

    return {
      frete: custoFrete,
      equipamentos: custoEquipamentos,
      total: custoFrete + custoEquipamentos,
    }
  }

  private calcularAlimentacao(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    cluster: Cluster
  ): CustoBreakdown['alimentacao'] {
    if (!operacionalData.timeTecnico) {
      return { go_live: 0, time_alpha: 0, total: 0 }
    }

    const numDias = eventoData.datasEvento.length
    const dimensionamento = this.getDimensionamento(cluster.id)

    // Calcular total de pessoas na equipe
    let totalEquipe = 0
    let totalAlpha = 0

    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (cargo.time === 'tecnico') {
        totalEquipe += quantidade // Go Live
      } else if (cargo.time === 'lideranca') {
        totalAlpha += quantidade // Alpha
      }
    })

    // Custo de refeição por pessoa/dia (3 refeições)
    const custoRefeicaoGoLive = 35 // Placeholder - depois buscar de parametros_alimentacao
    const custoRefeicaoAlpha = 50 // Placeholder

    const custoGoLive = operacionalData.clienteForneceAlimentacaoGoLive
      ? 0
      : totalEquipe * 3 * custoRefeicaoGoLive * numDias

    const custoAlpha = operacionalData.clienteForneceAlimentacaoGoLive
      ? 0
      : totalAlpha * 3 * custoRefeicaoAlpha * numDias

    return {
      go_live: custoGoLive,
      time_alpha: custoAlpha,
      total: custoGoLive + custoAlpha,
    }
  }

  private calcularHospedagem(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    cluster: Cluster
  ): CustoBreakdown['hospedagem'] {
    if (!operacionalData.timeTecnico || operacionalData.clienteForneceHospedagemAlpha) {
      return { time_alpha: 0, total: 0 }
    }

    const numDias = eventoData.datasEvento.length
    const dimensionamento = this.getDimensionamento(cluster.id)

    // Apenas time Alpha tem hospedagem (liderança)
    let totalAlpha = 0
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (cargo.time === 'lideranca') {
        totalAlpha += quantidade
      }
    })

    const custoDiariaHotel = 200 // Placeholder - depois buscar de parametros_hospedagem
    const custoAlpha = totalAlpha * custoDiariaHotel * numDias

    return {
      time_alpha: custoAlpha,
      total: custoAlpha,
    }
  }

  private calcularTransporteLocal(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    cluster: Cluster
  ): CustoBreakdown['transporte_local'] {
    if (!operacionalData.timeTecnico) {
      return { total: 0 }
    }

    const parametros = this.cache.parametrosGerais
    if (!parametros) {
      return { total: 0 }
    }

    const numDias = eventoData.datasEvento.length
    const dimensionamento = this.getDimensionamento(cluster.id)

    // Apenas time Go Live precisa de transporte local
    let totalGoLive = 0
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (cargo.time === 'tecnico') {
        totalGoLive += quantidade
      }
    })

    const custoTotal = totalGoLive * parametros.valor_transporte_local_diario * numDias

    return {
      total: custoTotal,
    }
  }

  async calcular(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData
  ): Promise<MCOCalculationResult> {
    // Buscar parâmetros do Firebase (usa cache se disponível)
    await this.fetchParametros()

    // Parsear faturamento
    const faturamentoStr = eventoData.faturamentoEstimado
      ?.replace(/[^\d.,]/g, '')
      ?.replace(/\./g, '')
      ?.replace(',', '.')
      || '0'
    const faturamento = parseFloat(faturamentoStr)

    // Identificar cluster baseado no faturamento
    const cluster = this.identificarCluster(faturamento)

    if (!cluster) {
      throw new Error('Não foi possível identificar o cluster. Configure os clusters primeiro.')
    }

    // Calcular custos
    const mao_de_obra = this.calcularMaoDeObra(eventoData, operacionalData, cluster)
    const logistica = this.calcularLogistica(eventoData, operacionalData, cluster)
    const alimentacao = this.calcularAlimentacao(eventoData, operacionalData, cluster)
    const hospedagem = this.calcularHospedagem(eventoData, operacionalData, cluster)
    const transporte_local = this.calcularTransporteLocal(eventoData, operacionalData, cluster)

    const total_geral =
      mao_de_obra.total +
      logistica.total +
      alimentacao.total +
      hospedagem.total +
      transporte_local.total

    // Calcular COT (Custo Operacional Total) como % do faturamento
    const cot_percentual = faturamento > 0 ? (total_geral / faturamento) * 100 : 0

    const breakdown: CustoBreakdown = {
      mao_de_obra,
      logistica,
      alimentacao,
      hospedagem,
      transporte_local,
      total_geral,
      cot_percentual,
    }

    return {
      custo_operacional_efetivo: total_geral,
      cot: cot_percentual,
      breakdown,
      cluster_identificado: `${cluster.tamanho} - ${cluster.nome}`,
    }
  }

  // Método para limpar cache (útil para testes ou após updates)
  clearCache() {
    this.cache = {}
  }
}

export const mcoCalculatorService = new MCOCalculatorService()

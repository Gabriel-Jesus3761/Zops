import type { MCOEventoData, MCOOperacionalData, Sessao } from '../types/mco.types'
import {
  clustersService,
  cargosService,
  cargoClusterService,
  parametrosGeraisService,
  parametrosTransporteService,
  parametrosFreteService,
  alimentacaoValoresService,
  categoriasRemuneracaoService,
  hospedagemBaseCustoService,
  filiaisService,
  modalidadesService,
  cargoCategoriaValorService,
  cargoJornadaCategoriaService,
  etapaTimesService,
  cargoTimesService,
} from '@/features/settings/services/mco-parametros.service'
import type {
  Cluster,
  Cargo,
  CargoCluster,
  ParametrosGeraisMCO,
  ParametrosTransporte,
  ParametrosFrete,
  AlimentacaoValor,
  CategoriaRemuneracao,
  HospedagemBaseCusto,
  FilialZig,
  Modalidade,
  CargoCategoriaValor,
  CargoJornadaCategoria,
  EtapaTimeConfig,
  CargoTimeConfig,
  TipoAtendimento,
  TipoAtendimentoConfig,
} from '@/features/settings/types/mco-parametros'
import { TIPOS_ATENDIMENTO_CONFIG } from '@/features/settings/types/mco-parametros'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Haversine: distância em km entre dois pontos geográficos.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Distância rodoviária via OSRM (Open Source Routing Machine — gratuito, sem chave).
 * Retorna a distância de estrada em km entre dois pontos.
 * Fallback silencioso para Haversine se a API não responder.
 */
async function osrmDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): Promise<number> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    if (data.routes?.[0]?.distance) return data.routes[0].distance / 1000
  } catch {
    // silently fall back
  }
  return haversineKm(lat1, lon1, lat2, lon2)
}

/**
 * Distâncias aproximadas (rodoviárias) da capital de SP às capitais de cada UF.
 * Usado como fallback quando não há coordenadas do evento.
 */
const UF_DIST_FROM_SP: Record<string, number> = {
  SP: 50,
  RJ: 430,  MG: 580,  ES: 900,
  PR: 400,  SC: 700,  RS: 1100,
  MS: 1000, MT: 1500, GO: 900,  DF: 1000,
  BA: 1900, SE: 2100, AL: 2400, PE: 2600, PB: 2800,
  RN: 3000, CE: 3200, PI: 3400, MA: 3600,
  PA: 2700, AM: 3900, AC: 4300, RO: 3300, RR: 4500, AP: 3700, TO: 2200,
}

/** Ordem numérica dos clusters para comparação de porte. */
const CLUSTER_ORDER: Record<string, number> = { PP: 0, P: 1, M: 2, G: 3, MEGA: 4 }

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface CustoBreakdown {
  mao_de_obra: {
    [cargoSigla: string]: number
    total: number
  }
  alimentacao: {
    go_live: number
    viagem?: number
    setup?: number
    total: number
  }
  hospedagem: {
    total: number
  }
  /**
   * Motor de Viagem — deslocamento origem → evento (ida + volta).
   * Fórmula: distância × custo/km (modal) × nº pessoas no time de viagem × 2
   */
  viagem: {
    total: number
    modal: string
    distancia_km: number
  }
  transporte_local: {
    total: number
  }
  /**
   * Motor de Frete — transporte de equipamentos.
   * Fórmula: valor_base + max(0, distância - raio_máximo) × valor_km_adicional
   */
  frete: {
    valor_base: number
    km_adicional: number
    total: number
  }
  total_geral: number
  cot_percentual: number
  /** Dados intermediários do cálculo — para auditoria e diagnóstico. */
  _debug?: {
    // Identificação
    cluster_tamanho: string
    cluster_nome: string
    tipo_atendimento: string
    filial_origem_nome: string | null
    distancia_km: number
    // Condições
    sessao_requer_pernoite: boolean
    incluir_viagem: boolean
    incluir_setup: boolean
    incluir_hospedagem: boolean
    incluir_transporte: boolean
    incluir_frete: boolean
    cliente_fornece_alimentacao: boolean
    // Dias calculados
    dias_viagem: number
    dias_setup: number
    num_sessoes: number
    dias_hospedagem: number
    // Times por etapa (siglas dos CargoTimeConfig)
    viagem_time_siglas: string[]
    setup_time_siglas: string[]
    go_live_time_siglas: string[]
    // Dimensionamento
    tpv_usado: number
    terminais_calculados: number
    total_equipe: number
    total_alpha: number
    dimensionamento: Record<string, { time: string; quantidade: number }>
    // MdO detalhado por cargo
    mdo_detalhes: Record<string, {
      quantidade: number
      participa_viagem: boolean
      participa_setup: boolean
      rate_viagem: number; custo_viagem: number
      rate_setup: number; custo_setup: number
      rate_go_live: number; custo_go_live: number
      total: number
    }>
    // Motores individuais
    alimentacao_valor_dia: number
    alimentacao_total_equipe: number
    viagem_custo_por_km: number
    transporte_valor_diario: number
    transporte_dias: number
    hospedagem_valor_diaria: number
    hospedagem_total_alpha?: number
    hospedagem_dias: number
  }
}

export interface MCOCalculationResult {
  custo_operacional_efetivo: number
  cot: number
  breakdown: CustoBreakdown
  cluster_identificado?: string
  /** Código do cluster (PP, P, M, G, MEGA) — salvo como `porte` no MCO. */
  cluster_tamanho?: string
  tipo_atendimento?: TipoAtendimento
}

// ─── Cache interno ─────────────────────────────────────────────────────────────

interface CalculatorCache {
  clusters?: Cluster[]
  cargos?: Cargo[]
  cargoClusters?: CargoCluster[]
  parametrosGerais?: ParametrosGeraisMCO | null
  parametrosTransporte?: ParametrosTransporte[]
  parametrosFrete?: ParametrosFrete[]
  alimentacaoValores?: AlimentacaoValor[]
  categorias?: CategoriaRemuneracao[]
  hospedagemBase?: HospedagemBaseCusto[]
  filiais?: FilialZig[]
  modalidades?: Modalidade[]
  cargoCategoriaValores?: CargoCategoriaValor[]
  cargoJornadaCategorias?: CargoJornadaCategoria[]
  etapaTimes?: EtapaTimeConfig[]
  cargoTimes?: CargoTimeConfig[]
  lastFetch?: number
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

class MCOCalculatorService {
  private cache: CalculatorCache = {}

  private async fetchParametros() {
    const now = Date.now()
    // Cache válido por 30 segundos (para reagir rápido a mudanças em Configurações)
    if (this.cache.lastFetch && now - this.cache.lastFetch < 30 * 1000) return

    try {
      const [
        clusters,
        cargos,
        cargoClusters,
        parametrosGerais,
        parametrosTransporte,
        parametrosFrete,
        alimentacaoValores,
        categorias,
        hospedagemBase,
        filiais,
        modalidades,
        cargoCategoriaValores,
        cargoJornadaCategorias,
        etapaTimes,
        cargoTimes,
      ] = await Promise.all([
        clustersService.getClusters(),
        cargosService.getCargos(),
        cargoClusterService.getCargosClusters(),
        parametrosGeraisService.getParametros(),
        parametrosTransporteService.getParametros(),
        parametrosFreteService.getParametros(),
        alimentacaoValoresService.getValores(),
        categoriasRemuneracaoService.getCategorias(),
        hospedagemBaseCustoService.getAll(),
        filiaisService.getFiliais(),
        modalidadesService.getModalidades(),
        cargoCategoriaValorService.getValores(),
        cargoJornadaCategoriaService.getValores(),
        etapaTimesService.getConfiguracoes(),
        cargoTimesService.getTimes(),
      ])

      this.cache = {
        clusters: clusters.filter((c) => c.ativo),
        cargos: cargos.filter((c) => c.ativo),
        cargoClusters,
        parametrosGerais,
        parametrosTransporte: parametrosTransporte.filter((p) => p.ativo),
        parametrosFrete: parametrosFrete.filter((p) => p.ativo),
        alimentacaoValores,
        categorias: categorias.filter((c) => c.ativo),
        hospedagemBase,
        filiais: filiais.filter((f) => f.ativo),
        modalidades: modalidades.filter((m) => m.ativo),
        cargoCategoriaValores,
        cargoJornadaCategorias,
        etapaTimes,
        cargoTimes: cargoTimes.filter((t) => t.ativo),
        lastFetch: now,
      }
    } catch (error) {
      console.error('Erro ao buscar parâmetros MCO:', error)
      throw new Error('Não foi possível buscar parâmetros do Firebase')
    }
  }

  // ── Helper: Times por Etapa ────────────────────────────────────────────────

  /**
   * Retorna o Set de siglas de CargoTime que participam de uma determinada etapa.
   * Usa a configuração "Times por Etapa" do Firebase:
   *   CategoriaRemuneracao (etapa_id) × CargoTimeConfig (time_id) → ativo
   *
   * Exemplo: getTimeSiglasParaEtapa('viagem') → Set{'time_alpha'}
   */
  private getTimeSiglasParaEtapa(tipoCalculo: string): Set<string> {
    const categorias = this.cache.categorias || []
    const etapaTimes = this.cache.etapaTimes || []
    const cargoTimes = this.cache.cargoTimes || []

    // 1. Encontrar a categoria com esse tipo_calculo
    const cat = categorias.find((c) => c.tipo_calculo === tipoCalculo)
    if (!cat) return new Set()

    // 2. Encontrar quais time_ids estão ativos nessa etapa
    const timeIds = etapaTimes
      .filter((e) => e.etapa_id === cat.id && e.ativo)
      .map((e) => e.time_id)

    // 3. Buscar as siglas correspondentes
    const siglas = cargoTimes
      .filter((t) => timeIds.includes(t.id))
      .map((t) => t.sigla)

    return new Set(siglas)
  }

  // ── 1. Cluster ────────────────────────────────────────────────────────────

  /**
   * Identifica o cluster pelo faturamento POR SESSÃO.
   * Doc seção 5: Faturamento/Sessão = Faturamento Total ÷ Número de Sessões
   */
  private identificarCluster(faturamento: number, numSessoes: number): Cluster | null {
    if (!this.cache.clusters) return null

    const faturamentoPorSessao = numSessoes > 0 ? faturamento / numSessoes : faturamento
    const sorted = [...this.cache.clusters].sort((a, b) => a.faturamento_piso - b.faturamento_piso)

    for (const cluster of sorted) {
      if (
        faturamentoPorSessao >= cluster.faturamento_piso &&
        faturamentoPorSessao <= cluster.faturamento_teto
      ) {
        return cluster
      }
    }

    // Acima do teto máximo → MEGA
    return sorted[sorted.length - 1] || null
  }

  // ── 2. Dimensionamento ─────────────────────────────────────────────────────

  private getDimensionamento(
    cluster: Cluster,
    faturamento: number,
    numSessoes: number,
    modalidadeId: string
  ): Record<string, { cargo: Cargo; quantidade: number }> {
    if (!this.cache.cargoClusters || !this.cache.cargos) return {}

    const modalidade = this.cache.modalidades?.find((m) => m.id === modalidadeId)
    if (!modalidade) {
      console.warn(`[MCO Calc] ⚠️ Modalidade "${modalidadeId}" não encontrada — verifique a configuração.`)
    }
    // Sem modalidade configurada: usa o menor TPV disponível como fallback conservador
    const tpvFallback = this.cache.modalidades?.length
      ? Math.min(...this.cache.modalidades.map((m) => m.tpv_por_terminal).filter((v) => v > 0))
      : 10000
    const tpv = modalidade?.tpv_por_terminal || tpvFallback
    const maxPorLider = this.cache.parametrosGerais?.max_tecnicos_por_lider || 4

    const faturamentoPorSessao = faturamento / (numSessoes > 0 ? numSessoes : 1)
    const terminais = Math.round(faturamentoPorSessao / tpv)

    let qtdeLTT = 0
    let qtdeTCA = 0

    if (terminais < cluster.ite) {
      // Evento pequeno: 1 LTT opera sozinho
      qtdeLTT = 1
      qtdeTCA = 0
    } else {
      qtdeTCA = Math.round(terminais / cluster.ite)
      qtdeLTT = Math.round(qtdeTCA / maxPorLider)
      if (qtdeTCA > 0 && qtdeLTT === 0) qtdeLTT = 1
    }

    const result: Record<string, { cargo: Cargo; quantidade: number }> = {}

    // Cargos fixos do cluster (excluindo LTT e TCA — serão calculados dinamicamente)
    this.cache.cargoClusters.forEach((cc) => {
      if (cc.cluster_id !== cluster.id || cc.quantidade <= 0) return
      const cargo = this.cache.cargos!.find((c) => c.id === cc.cargo_id)
      if (!cargo) return
      const sigla = cargo.sigla?.toUpperCase()
      if (sigla === 'LTT' || sigla === 'TCA') return
      result[cargo.sigla] = { cargo, quantidade: cc.quantidade }
    })

    // Cargos calculados dinamicamente
    const cargoLTT = this.cache.cargos.find((c) => c.sigla?.toUpperCase() === 'LTT')
    const cargoTCA = this.cache.cargos.find((c) => c.sigla?.toUpperCase() === 'TCA')

    if (qtdeLTT > 0 && cargoLTT) {
      result['LTT'] = { cargo: cargoLTT, quantidade: qtdeLTT }
    }
    if (qtdeTCA > 0 && cargoTCA) {
      result['TCA'] = { cargo: cargoTCA, quantidade: qtdeTCA }
    }

    return result
  }

  // ── 3. Tipo de Atendimento ────────────────────────────────────────────────

  /**
   * Algoritmo de 5 passos — doc seção 4:
   * 1. Sem filial encontrada → ATENDIMENTO_MATRIZ
   * 2. Filial mais próxima é SP (is_matriz) → ATENDIMENTO_MATRIZ
   * 3. Cluster evento > cluster limite da filial → ATENDIMENTO_MATRIZ
   * 4. Evento dentro do raio de atuação → FILIAL
   * 5. Evento fora do raio → FILIAL_INTERIOR
   */
  private calcularTipoAtendimento(
    eventoData: MCOEventoData,
    cluster: Cluster
  ): { tipo: TipoAtendimento; filialOrigem: FilialZig | null; distanciaKm: number } {
    const filiais = this.cache.filiais
    if (!filiais || filiais.length === 0) {
      return {
        tipo: 'atendimento_matriz',
        filialOrigem: null,
        distanciaKm: UF_DIST_FROM_SP[eventoData.uf] ?? 500,
      }
    }

    const eventLat = eventoData.localEventoDetalhes?.latitude
    const eventLon = eventoData.localEventoDetalhes?.longitude

    // Encontra a filial ativa mais próxima
    let melhorFilial: FilialZig | null = null
    let melhorDist = Infinity

    for (const filial of filiais) {
      let dist: number
      if (eventLat && eventLon && filial.latitude && filial.longitude) {
        dist = haversineKm(filial.latitude, filial.longitude, eventLat, eventLon)
      } else {
        // Fallback: mesmo UF ≈ curta distância
        dist = filial.uf === eventoData.uf ? 50 : 9999
      }
      if (dist < melhorDist) {
        melhorDist = dist
        melhorFilial = filial
      }
    }

    // Passo 1
    if (!melhorFilial) {
      return {
        tipo: 'atendimento_matriz',
        filialOrigem: null,
        distanciaKm: UF_DIST_FROM_SP[eventoData.uf] ?? 500,
      }
    }

    // Passo 2: filial mais próxima é a matriz (SP)?
    if (melhorFilial.is_matriz) {
      return { tipo: 'atendimento_matriz', filialOrigem: melhorFilial, distanciaKm: melhorDist }
    }

    // Passo 3: cluster do evento > cluster limite da filial?
    const clusterOrd = CLUSTER_ORDER[cluster.tamanho] ?? 0
    const limiteOrd = CLUSTER_ORDER[melhorFilial.cluster_limite] ?? 0
    if (clusterOrd > limiteOrd) {
      const matriz = filiais.find((f) => f.is_matriz)
      const distMatriz =
        eventLat && eventLon && matriz?.latitude && matriz?.longitude
          ? haversineKm(matriz.latitude, matriz.longitude, eventLat, eventLon)
          : UF_DIST_FROM_SP[eventoData.uf] ?? 500
      return {
        tipo: 'atendimento_matriz',
        filialOrigem: matriz ?? melhorFilial,
        distanciaKm: distMatriz,
      }
    }

    // Passo 4: dentro do raio de atuação?
    if (melhorDist <= melhorFilial.raio_atuacao_km) {
      return { tipo: 'filial', filialOrigem: melhorFilial, distanciaKm: melhorDist }
    }

    // Passo 5: fora do raio
    return { tipo: 'filial_interior', filialOrigem: melhorFilial, distanciaKm: melhorDist }
  }

  // ── 4. Mão de Obra ─────────────────────────────────────────────────────────
  //
  // Aplica custos por etapa conforme "Times por Etapa":
  //   - Viagem Ida+Volta: apenas cargos cujo time está em viagemTimeSiglas
  //   - Setup: apenas cargos cujo time está em setupTimeSiglas
  //   - Go Live: todos os cargos (ou apenas os em goLiveTimeSiglas se configurado)
  //   - Fallback de rate: cargo.valor_diaria para qualquer tipo sem rate configurado
  // ─────────────────────────────────────────────────────────────────────────

  private calcularMaoDeObra(
    operacionalData: MCOOperacionalData,
    dimensionamento: Record<string, { cargo: Cargo; quantidade: number }>,
    diasViagem: number,
    diasSetup: number,
    sessoes: Sessao[],
    viagemTimeSiglas: Set<string>,
    setupTimeSiglas: Set<string>
  ): { resultado: CustoBreakdown['mao_de_obra']; detalhes: NonNullable<CustoBreakdown['_debug']>['mdo_detalhes'] } {
    if (!operacionalData.timeTecnico) return { resultado: { total: 0 }, detalhes: {} }

    const numSessoes = sessoes.length

    const categorias = this.cache.categorias || []
    const catViagem = categorias.find((c) => c.tipo_calculo === 'viagem')
    const catSetup = categorias.find((c) => c.tipo_calculo === 'setup')
    const catGoLive = categorias.find((c) => c.tipo_calculo === 'go_live')

    const cargoCatValores = this.cache.cargoCategoriaValores || []
    const cargoJornadaCat = this.cache.cargoJornadaCategorias || []

    const custos: Record<string, number> = {}
    const detalhes: NonNullable<CustoBreakdown['_debug']>['mdo_detalhes'] = {}
    let total = 0

    Object.entries(dimensionamento).forEach(([sigla, { cargo, quantidade }]) => {
      let custoCargo = 0
      let rateViagem = cargo.valor_diaria
      let rateSetup = cargo.valor_diaria

      // Verificar participação nas etapas conforme "Times por Etapa"
      const participaViagem = viagemTimeSiglas.size === 0 || viagemTimeSiglas.has(cargo.time)
      const participaSetup = setupTimeSiglas.size === 0 || setupTimeSiglas.has(cargo.time)

      // Dias de Viagem Ida + Volta — somente se o time participa da etapa de viagem
      if (diasViagem > 0 && participaViagem) {
        if (catViagem) {
          const val = cargoCatValores.find(
            (v) => v.cargo_id === cargo.id && v.categoria_id === catViagem.id
          )
          if (val) rateViagem = val.valor
        }
        custoCargo += quantidade * rateViagem * diasViagem
      }

      // Dias de Setup — somente se o time participa da etapa de setup
      if (diasSetup > 0 && participaSetup) {
        if (catSetup) {
          const val = cargoCatValores.find(
            (v) => v.cargo_id === cargo.id && v.categoria_id === catSetup.id
          )
          if (val) rateSetup = val.valor
        }
        custoCargo += quantidade * rateSetup * diasSetup
      }

      // Go Live — calculado por sessão, usando a jornada de cada uma
      let custoGoLive = 0
      let rateGoLiveDebug = cargo.valor_diaria

      if (numSessoes > 0 && catGoLive) {
        sessoes.forEach((sessao) => {
          let rate = cargo.valor_diaria

          // Tentar rate específico da jornada da sessão
          if (sessao.jornadaId) {
            const val = cargoJornadaCat.find(
              (v) =>
                v.cargo_id === cargo.id &&
                v.jornada_id === sessao.jornadaId &&
                v.categoria_id === catGoLive.id
            )
            if (val) rate = val.valor
          }

          // Fallback: qualquer rate go_live do cargo
          if (rate === cargo.valor_diaria) {
            const val = cargoJornadaCat.find(
              (v) => v.cargo_id === cargo.id && v.categoria_id === catGoLive.id
            )
            if (val) rate = val.valor
          }

          custoGoLive += quantidade * rate
          rateGoLiveDebug = rate
        })
      } else if (numSessoes > 0) {
        // catGoLive não configurado: fallback pela diária do cargo
        custoGoLive = quantidade * cargo.valor_diaria * numSessoes
        rateGoLiveDebug = cargo.valor_diaria
      }

      custoCargo += custoGoLive

      custos[sigla] = custoCargo
      total += custoCargo

      detalhes[sigla] = {
        quantidade,
        participa_viagem: participaViagem,
        participa_setup: participaSetup,
        rate_viagem: rateViagem,
        custo_viagem: participaViagem ? quantidade * rateViagem * diasViagem : 0,
        rate_setup: rateSetup,
        custo_setup: participaSetup ? quantidade * rateSetup * diasSetup : 0,
        rate_go_live: rateGoLiveDebug,
        custo_go_live: custoGoLive,
        total: custoCargo,
      }
    })

    return { resultado: { ...custos, total }, detalhes }
  }

  // ── 5. Viagem ─────────────────────────────────────────────────────────────

  /**
   * Motor de Viagem — doc seção 6.4
   * Fórmula: distância × custo_km (modal) × nº pessoas que viajam × 2 (ida + volta)
   * Modal: carro ≤ 100km · ônibus 100-500km · aéreo > 500km (conforme parâmetros)
   *
   * "Pessoas que viajam" = cargos cujo time está em viagemTimeSiglas.
   */
  private calcularViagem(
    distanciaKm: number,
    totalPessoas: number,
    inclui: boolean
  ): CustoBreakdown['viagem'] {
    if (!inclui || totalPessoas === 0 || distanciaKm === 0) {
      return { total: 0, modal: '', distancia_km: distanciaKm }
    }

    const parametros = this.cache.parametrosTransporte
    if (!parametros || parametros.length === 0) {
      return { total: 0, modal: '', distancia_km: distanciaKm }
    }

    // Ordena por distância mínima e seleciona o modal cujo intervalo contém distanciaKm
    const sorted = [...parametros].sort((a, b) => a.distancia_minima_km - b.distancia_minima_km)
    let selectedModal = sorted[sorted.length - 1]! // padrão: aéreo

    for (const modal of sorted) {
      if (distanciaKm >= modal.distancia_minima_km && distanciaKm <= modal.distancia_maxima_km) {
        selectedModal = modal
        break
      }
    }

    const total = distanciaKm * selectedModal.custo_por_km * totalPessoas * 2

    return { total, modal: selectedModal.modal, distancia_km: distanciaKm, _custo_por_km: selectedModal.custo_por_km } as CustoBreakdown['viagem'] & { _custo_por_km: number }
  }

  // ── 6. Frete ──────────────────────────────────────────────────────────────

  /**
   * Motor de Frete — doc seção 6.6
   * Fórmula: valor_base (matriz filial × cluster) + km_excedente × valor_km_adicional
   * km_excedente = max(0, ceil(distância) - raio_máximo)
   */
  private calcularFrete(
    filialId: string | null,
    clusterId: string,
    distanciaKm: number,
    inclui: boolean
  ): CustoBreakdown['frete'] {
    if (!inclui) return { valor_base: 0, km_adicional: 0, total: 0 }

    const parametros = this.cache.parametrosFrete
    if (!parametros || parametros.length === 0) return { valor_base: 0, km_adicional: 0, total: 0 }

    const record = parametros.find(
      (p) => p.filial_id === filialId && p.cluster_id === clusterId
    )
    if (!record) return { valor_base: 0, km_adicional: 0, total: 0 }

    // Math.ceil para arredondar a distância (alinha com mcozig)
    const distanciaArredondada = Math.ceil(distanciaKm)
    const kmExcedente = Math.max(0, distanciaArredondada - record.raio_maximo_km)
    const valorAdicional = kmExcedente * record.valor_km_adicional
    const total = record.valor_base + valorAdicional

    return { valor_base: record.valor_base, km_adicional: valorAdicional, total }
  }

  // ── 7. Alimentação ────────────────────────────────────────────────────────

  /**
   * Motor de Alimentação — alinhado com mcozig.
   *
   * Calcula alimentação para TODAS as etapas:
   *   - Viagem:  totalAlpha × diasViagem × valorAlimViagem  (sempre, sem desconto)
   *   - Setup:   totalAlpha × diasSetup  × valorAlimSetup   (sempre, sem desconto)
   *   - Go Live: totalEquipe × numSessoes × valorAlimGoLive (desconto se cliente fornece)
   *
   * O desconto `clienteForneceAlimentacaoGoLive` afeta APENAS o go_live.
   */
  private calcularAlimentacao(
    operacionalData: MCOOperacionalData,
    dimensionamento: Record<string, { cargo: Cargo; quantidade: number }>,
    diasViagem: number,
    diasSetup: number,
    sessoes: Sessao[],
    incluirViagem?: boolean,
    incluirSetup?: boolean,
    viagemTimeSiglas?: Set<string>
  ): { resultado: CustoBreakdown['alimentacao']; valorDia: number; totalEquipe: number } {
    // Calcular totais de equipe
    let totalEquipe = 0
    let totalAlpha = 0
    const siglas = viagemTimeSiglas ?? new Set<string>()
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      totalEquipe += quantidade
      if (siglas.size === 0 || siglas.has(cargo.time)) {
        totalAlpha += quantidade
      }
    })

    const categorias = this.cache.categorias
    const alimentacaoValores = this.cache.alimentacaoValores
    if (!categorias || !alimentacaoValores) {
      return { resultado: { go_live: 0, viagem: 0, setup: 0, total: 0 }, valorDia: 0, totalEquipe }
    }

    const catViagem = categorias.find((c) => c.tipo_calculo === 'viagem')
    const catSetup = categorias.find((c) => c.tipo_calculo === 'setup')
    const catGoLive = categorias.find((c) => c.tipo_calculo === 'go_live')

    // VIAGEM: alimentação dos dias de deslocamento (sempre, sem desconto)
    let custoAlimViagem = 0
    if (incluirViagem && diasViagem > 0 && catViagem && totalAlpha > 0) {
      const val = alimentacaoValores.find(
        (v) => v.categoria_id === catViagem.id && !v.jornada_id
      )
      const valorViagem = val?.valor ?? 0
      custoAlimViagem = totalAlpha * diasViagem * valorViagem
    }

    // SETUP: alimentação dos dias de montagem (sempre, sem desconto)
    let custoAlimSetup = 0
    if (incluirSetup && diasSetup > 0 && catSetup && totalAlpha > 0) {
      const val = alimentacaoValores.find(
        (v) => v.categoria_id === catSetup.id && !v.jornada_id
      )
      const valorSetup = val?.valor ?? 0
      custoAlimSetup = totalAlpha * diasSetup * valorSetup
    }

    // GO LIVE: calculado por sessão, usando a jornada de cada uma
    let custoAlimGoLive = 0
    let valorDia = 0
    if (!operacionalData.clienteForneceAlimentacaoGoLive && catGoLive) {
      sessoes.forEach((sessao) => {
        let valorSessao = 0

        if (sessao.jornadaId) {
          const val = alimentacaoValores.find(
            (v) => v.categoria_id === catGoLive.id && v.jornada_id === sessao.jornadaId
          )
          valorSessao = val?.valor ?? 0
        }

        if (!valorSessao) {
          // Fallback: primeiro valor go_live disponível (sem jornada específica)
          const val = alimentacaoValores.find((v) => v.categoria_id === catGoLive.id)
          valorSessao = val?.valor ?? 0
        }

        custoAlimGoLive += totalEquipe * valorSessao
        valorDia = valorSessao
      })
    }

    const total = custoAlimViagem + custoAlimSetup + custoAlimGoLive

    return {
      resultado: { go_live: custoAlimGoLive, viagem: custoAlimViagem, setup: custoAlimSetup, total },
      valorDia,
      totalEquipe,
    }
  }

  // ── 8. Hospedagem ─────────────────────────────────────────────────────────

  /**
   * Motor de Hospedagem — doc seção 6.3
   * Aplica-se ao time de Viagem quando há viagem/pernoite.
   * Valor da diária buscado por cidade/UF em Hospedagem → Base de Custo.
   * Dias de hospedagem = diasViagem/2 + diasSetup + numSessoes (toda a estadia).
   */
  private calcularHospedagem(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData,
    dimensionamento: Record<string, { cargo: Cargo; quantidade: number }>,
    inclui: boolean,
    diasHospedagem: number,
    viagemTimeSiglas: Set<string>
  ): CustoBreakdown['hospedagem'] {
    if (!inclui || operacionalData.clienteForneceHospedagemAlpha) {
      return { total: 0 }
    }

    // Contar apenas os cargos que viajam (time participante da etapa de viagem)
    let totalAlpha = 0
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (viagemTimeSiglas.size === 0 || viagemTimeSiglas.has(cargo.time)) {
        totalAlpha += quantidade
      }
    })

    if (totalAlpha === 0) return { total: 0 }

    // Valor de diária pela cidade/UF do evento
    let valorDiaria = 200 // fallback
    const hospedagemBase = this.cache.hospedagemBase
    if (hospedagemBase) {
      const found =
        hospedagemBase.find(
          (h) =>
            h.cidade.toLowerCase() === eventoData.cidade.toLowerCase() && h.uf === eventoData.uf
        ) || hospedagemBase.find((h) => h.uf === eventoData.uf)
      if (found) valorDiaria = found.valor_diaria
    }

    return {
      total: totalAlpha * valorDiaria * diasHospedagem,
      _valor_diaria: valorDiaria,
      _total_alpha: totalAlpha,
    } as CustoBreakdown['hospedagem'] & { _valor_diaria: number; _total_alpha: number }
  }

  // ── 9. Transporte Local ───────────────────────────────────────────────────

  /**
   * Motor de Transporte Local — doc seção 6.5
   * Fórmula: valor_diário × nº pessoas que viajam × (diasSetup + numSessoes)
   * Aplica-se aos cargos cujo time participa da etapa de viagem (saem da base).
   */
  private calcularTransporteLocal(
    operacionalData: MCOOperacionalData,
    dimensionamento: Record<string, { cargo: Cargo; quantidade: number }>,
    inclui: boolean,
    diasSetup: number,
    numSessoes: number,
    viagemTimeSiglas: Set<string>
  ): CustoBreakdown['transporte_local'] {
    if (!inclui || !operacionalData.timeTecnico) return { total: 0 }

    const parametros = this.cache.parametrosGerais
    if (!parametros) return { total: 0 }

    const diasTransporte = diasSetup + numSessoes

    // Time que viaja recebe transporte local
    let totalAlpha = 0
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (viagemTimeSiglas.size === 0 || viagemTimeSiglas.has(cargo.time)) {
        totalAlpha += quantidade
      }
    })

    return {
      total: totalAlpha * parametros.valor_transporte_local_diario * diasTransporte,
      _valor_diario: parametros.valor_transporte_local_diario,
      _total_alpha: totalAlpha,
      _dias: diasTransporte,
    } as CustoBreakdown['transporte_local'] & { _valor_diario: number; _total_alpha: number; _dias: number }
  }

  // ── Método principal ──────────────────────────────────────────────────────

  async calcular(
    eventoData: MCOEventoData,
    operacionalData: MCOOperacionalData
  ): Promise<MCOCalculationResult> {
    await this.fetchParametros()

    // Parse faturamento
    const faturamentoStr =
      eventoData.faturamentoEstimado
        ?.replace(/[^\d.,]/g, '')
        ?.replace(/\./g, '')
        ?.replace(',', '.') || '0'
    const faturamento = parseFloat(faturamentoStr)

    // Nº de sessões Go Live válidas
    const sessoesValidas = eventoData.sessoes?.filter((s) => s.dataHoraInicio !== null) ?? []
    const numSessoes = sessoesValidas.length || 1

    // 1. Identificar cluster pelo faturamento por sessão
    const cluster = this.identificarCluster(faturamento, numSessoes)
    if (!cluster) {
      throw new Error('Não foi possível identificar o cluster. Configure os clusters primeiro.')
    }

    // 2. Determinar tipo de atendimento e filial de origem
    const { tipo, filialOrigem, distanciaKm: distanciaHaversine } = this.calcularTipoAtendimento(eventoData, cluster)
    const tipoConfig: TipoAtendimentoConfig = TIPOS_ATENDIMENTO_CONFIG[tipo]

    // 2a. Substituir haversine pela distância rodoviária real (OSRM) quando há coordenadas.
    //     OSRM usa os mesmos dados OSM do Nominatim — gratuito, sem chave.
    const eventLat = eventoData.localEventoDetalhes?.latitude
    const eventLon = eventoData.localEventoDetalhes?.longitude
    const filialLat = filialOrigem?.latitude
    const filialLon = filialOrigem?.longitude
    const distanciaKm =
      eventLat && eventLon && filialLat && filialLon
        ? await osrmDistanceKm(filialLat, filialLon, eventLat, eventLon)
        : distanciaHaversine

    // 3. Detectar se alguma sessão requer pernoite (cruza meia-noite)
    const sessaoRequerPernoite = sessoesValidas.some((s) => {
      if (!s.dataHoraInicio || !s.dataHoraFim) return false
      return (
        s.dataHoraFim.getFullYear() !== s.dataHoraInicio.getFullYear() ||
        s.dataHoraFim.getMonth() !== s.dataHoraInicio.getMonth() ||
        s.dataHoraFim.getDate() !== s.dataHoraInicio.getDate()
      )
    })

    // 4. Determinar se viagem/hospedagem/setup se aplicam
    const incluirViagem =
      tipoConfig.incluir_viagem && (numSessoes > 1 || sessaoRequerPernoite) &&
      operacionalData.timeTecnico
    const incluirHospedagem =
      tipoConfig.incluir_hospedagem && (numSessoes > 1 || sessaoRequerPernoite)
    const incluirSetup = tipoConfig.incluir_setup

    // 5. Calcular dias por tipo
    const diasViagem = incluirViagem ? 2 : 0 // 1 Ida + 1 Volta
    const diasSetup = incluirSetup ? (cluster.dias_setup ?? 0) : 0

    // 6. Dias de hospedagem = apenas os dias de setup.
    // O go live que cruza a meia-noite (sessaoRequerPernoite) não adiciona dia extra:
    // a equipe já está hospedada durante o período de setup e permanece até o fim do evento.
    // Só adiciona dias extras quando há MÚLTIPLAS sessões separadas (Day Off entre elas).
    const diasHospedagem = diasSetup + (numSessoes > 1 ? numSessoes : 0)

    // 7. Dimensionamento dinâmico (TPV → terminais → TCA/LTT)
    const dimensionamento = this.getDimensionamento(
      cluster,
      faturamento,
      numSessoes,
      operacionalData.modalidadeId
    )

    // 8. Carregar times por etapa (fonte de verdade para participação)
    const viagemTimeSiglas = this.getTimeSiglasParaEtapa('viagem')
    const setupTimeSiglas = this.getTimeSiglasParaEtapa('setup')
    const goLiveTimeSiglas = this.getTimeSiglasParaEtapa('go_live')

    // 9. Total de pessoas que viajam (para motor de viagem)
    let totalAlpha = 0
    Object.values(dimensionamento).forEach(({ cargo, quantidade }) => {
      if (viagemTimeSiglas.size === 0 || viagemTimeSiglas.has(cargo.time)) {
        totalAlpha += quantidade
      }
    })

    // 10. Calcular cada motor

    const { resultado: mao_de_obra, detalhes: mdo_detalhes } = this.calcularMaoDeObra(
      operacionalData,
      dimensionamento,
      diasViagem,
      diasSetup,
      sessoesValidas,
      viagemTimeSiglas,
      setupTimeSiglas
    )

    // Viagem: apenas cargos cujo time está em viagemTimeSiglas
    const viagem = this.calcularViagem(distanciaKm, totalAlpha, incluirViagem) as CustoBreakdown['viagem'] & { _custo_por_km?: number }

    const frete = this.calcularFrete(
      filialOrigem?.id ?? null,
      cluster.id,
      distanciaKm,
      tipoConfig.incluir_frete && operacionalData.logistica
    )

    const { resultado: alimentacao, valorDia: alimentacaoValorDia, totalEquipe: alimentacaoTotalEquipe } = this.calcularAlimentacao(
      operacionalData,
      dimensionamento,
      diasViagem,
      diasSetup,
      sessoesValidas,
      incluirViagem,
      incluirSetup,
      viagemTimeSiglas
    )

    const hospedagem = this.calcularHospedagem(
      eventoData,
      operacionalData,
      dimensionamento,
      incluirHospedagem,
      diasHospedagem,
      viagemTimeSiglas
    ) as CustoBreakdown['hospedagem'] & { _valor_diaria?: number; _total_alpha?: number }

    const transporte_local = this.calcularTransporteLocal(
      operacionalData,
      dimensionamento,
      tipoConfig.incluir_transporte,
      diasSetup,
      numSessoes,
      viagemTimeSiglas
    ) as CustoBreakdown['transporte_local'] & { _valor_diario?: number; _total_alpha?: number; _dias?: number }

    // 11. Totais
    const total_geral =
      mao_de_obra.total +
      viagem.total +
      frete.total +
      alimentacao.total +
      hospedagem.total +
      transporte_local.total

    const cot_percentual = faturamento > 0 ? (total_geral / faturamento) * 100 : 0

    // 12. Debug intermediário
    // Usa o mesmo fallback de TPV que getDimensionamento() para consistência
    const modalidade = this.cache.modalidades?.find((m) => m.id === operacionalData.modalidadeId)
    const tpvFallbackDebug = this.cache.modalidades?.length
      ? Math.min(...this.cache.modalidades.map((m) => m.tpv_por_terminal).filter((v) => v > 0))
      : 0
    const tpvUsado = modalidade?.tpv_por_terminal || tpvFallbackDebug
    const terminaisCalc = tpvUsado > 0 ? Math.round(faturamento / (numSessoes || 1) / tpvUsado) : 0
    let totalEquipeDebug = 0
    const dimDebug: Record<string, { time: string; quantidade: number }> = {}
    Object.entries(dimensionamento).forEach(([sigla, { cargo, quantidade }]) => {
      totalEquipeDebug += quantidade
      dimDebug[sigla] = { time: cargo.time ?? '', quantidade }
    })

    const breakdown: CustoBreakdown = {
      mao_de_obra,
      alimentacao,
      hospedagem,
      viagem,
      transporte_local,
      frete,
      total_geral,
      cot_percentual,
      _debug: {
        cluster_tamanho: cluster.tamanho,
        cluster_nome: cluster.nome,
        tipo_atendimento: tipo,
        filial_origem_nome: filialOrigem?.nome ?? null,
        distancia_km: distanciaKm,
        sessao_requer_pernoite: sessaoRequerPernoite,
        incluir_viagem: incluirViagem,
        incluir_setup: incluirSetup,
        incluir_hospedagem: incluirHospedagem,
        incluir_transporte: tipoConfig.incluir_transporte,
        incluir_frete: tipoConfig.incluir_frete,
        cliente_fornece_alimentacao: operacionalData.clienteForneceAlimentacaoGoLive ?? false,
        dias_viagem: diasViagem,
        dias_setup: diasSetup,
        num_sessoes: numSessoes,
        dias_hospedagem: diasHospedagem,
        viagem_time_siglas: [...viagemTimeSiglas],
        setup_time_siglas: [...setupTimeSiglas],
        go_live_time_siglas: [...goLiveTimeSiglas],
        tpv_usado: tpvUsado,
        terminais_calculados: terminaisCalc,
        total_equipe: totalEquipeDebug,
        total_alpha: totalAlpha,
        dimensionamento: dimDebug,
        mdo_detalhes,
        alimentacao_valor_dia: alimentacaoValorDia,
        alimentacao_total_equipe: alimentacaoTotalEquipe,
        viagem_custo_por_km: viagem._custo_por_km ?? 0,
        transporte_valor_diario: transporte_local._valor_diario ?? 0,
        transporte_dias: transporte_local._dias ?? 0,
        hospedagem_valor_diaria: hospedagem._valor_diaria ?? 0,
        hospedagem_total_alpha: hospedagem._total_alpha ?? 0,
        hospedagem_dias: diasHospedagem,
      },
    }

    return {
      custo_operacional_efetivo: total_geral,
      cot: cot_percentual,
      breakdown,
      cluster_identificado: `${cluster.tamanho} - ${cluster.nome}`,
      cluster_tamanho: cluster.tamanho,
      tipo_atendimento: tipo,
    }
  }

  /** Limpa o cache — útil após alterar parâmetros em Configurações. */
  clearCache() {
    this.cache = {}
  }
}

export const mcoCalculatorService = new MCOCalculatorService()

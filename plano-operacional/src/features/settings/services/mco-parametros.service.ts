// =============================================================================
// SERVICO DE PARAMETROS MCO
// Gerencia Clusters, Filiais, Cargos, Modalidades, Jornadas e outros parametros
// =============================================================================

import type {
  Cluster,
  ClusterFormData,
  ClusterTamanhoConfig,
  ClusterTamanhoConfigFormData,
  FilialZig,
  FilialZigFormData,
  Cargo,
  CargoFormData,
  CargoCluster,
  CargoClusterFormData,
  CargoTimeConfig,
  CargoTimeConfigFormData,
  Modalidade,
  ModalidadeFormData,
  Jornada,
  JornadaFormData,
  ParametrosTransporte,
  ParametrosTransporteFormData,
  ParametrosFrete,
  ParametrosFreteFormData,
  AlimentacaoValor,
  AlimentacaoValorFormData,
  ParametrosHospedagem,
  ParametrosHospedagemFormData,
  HospedagemBaseCusto,
  HospedagemElegibilidade,
  ParametrosGeraisMCO,
  ParametrosGeraisMCOFormData,
  MCOParametrosStats,
  CargoCalculoParametros,
  CargoCalculoParametrosFormData,
  CategoriaRemuneracao,
  CategoriaRemuneracaoFormData,
  CargoCategoriaValor,
  CargoCategoriaValorFormData,
  CargoJornadaCategoria,
  CargoJornadaCategoriaFormData,
  TipoCalculoConfig,
  TipoCalculoConfigFormData,
  EtapaTimeConfig,
  EtapaTimeConfigFormData,
} from '../types/mco-parametros'

const CLOUD_FUNCTIONS_BASE = 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchCollection<T>(collectionUrl: string, mapFn: (doc: any) => T): Promise<T[]> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/getAtivos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Origin-Page': 'MCOParametros',
    },
    body: JSON.stringify({ url: collectionUrl }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar ${collectionUrl}`)
  }

  const result = await response.json()
  let docs: any[] = []

  if (result.docs && Array.isArray(result.docs)) {
    docs = result.docs
  } else if (Array.isArray(result)) {
    docs = result
  }

  return docs.map(mapFn)
}

async function createDocument(collectionUrl: string, data: any): Promise<string> {
  const docId = crypto.randomUUID()

  const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDoc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collectionURL: collectionUrl,
      docId,
      formData: {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao criar documento em ${collectionUrl}`)
  }

  return docId
}

async function updateDocument(collectionUrl: string, docId: string, data: any): Promise<void> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/setDocMerge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: collectionUrl,
      docId,
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao atualizar documento em ${collectionUrl}`)
  }
}

async function deleteDocument(collectionUrl: string, docId: string): Promise<void> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/deleteDoc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: collectionUrl,
      docId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao excluir documento em ${collectionUrl}`)
  }
}

// =============================================================================
// CLUSTERS SERVICE
// =============================================================================

export const clustersService = {
  async getClusters(): Promise<Cluster[]> {
    return fetchCollection<Cluster>('mco_clusters', (doc) => ({
      id: doc.id,
      tamanho: doc.data?.tamanho || doc.tamanho || 'M',
      nome: doc.data?.nome || doc.nome || '',
      faturamento_piso: doc.data?.faturamento_piso || doc.faturamento_piso || 0,
      faturamento_teto: doc.data?.faturamento_teto || doc.faturamento_teto || 0,
      ite: doc.data?.ite || doc.ite || 70,
      dias_setup: doc.data?.dias_setup || doc.dias_setup || 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createCluster(data: ClusterFormData): Promise<string> {
    return createDocument('mco_clusters', { ...data, ativo: true })
  },

  async updateCluster(id: string, data: Partial<ClusterFormData>): Promise<void> {
    return updateDocument('mco_clusters', id, data)
  },

  async deleteCluster(id: string): Promise<void> {
    return deleteDocument('mco_clusters', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_clusters', id, { ativo })
  },
}

// =============================================================================
// CLUSTER TAMANHOS CONFIG SERVICE
// Opções dinâmicas para o dropdown de tamanho
// =============================================================================

export const clusterTamanhosService = {
  async getTamanhos(): Promise<ClusterTamanhoConfig[]> {
    return fetchCollection<ClusterTamanhoConfig>('mco_cluster_tamanhos', (doc) => ({
      id: doc.id,
      sigla: doc.data?.sigla || doc.sigla || '',
      nome: doc.data?.nome || doc.nome || '',
      ordem: doc.data?.ordem ?? doc.ordem ?? 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createTamanho(data: ClusterTamanhoConfigFormData): Promise<string> {
    return createDocument('mco_cluster_tamanhos', { ...data, ativo: true })
  },

  async updateTamanho(id: string, data: Partial<ClusterTamanhoConfigFormData>): Promise<void> {
    return updateDocument('mco_cluster_tamanhos', id, data)
  },

  async deleteTamanho(id: string): Promise<void> {
    return deleteDocument('mco_cluster_tamanhos', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_cluster_tamanhos', id, { ativo })
  },

  async reorderTamanhos(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_cluster_tamanhos', item.id, { ordem: item.ordem }))
    )
  },

  // Seed dos tamanhos padrão
  async seedTamanhos(): Promise<void> {
    const tamanhos: ClusterTamanhoConfigFormData[] = [
      { sigla: 'PP', nome: 'Pequeno Porte (PP)', ordem: 1 },
      { sigla: 'P', nome: 'Pequeno (P)', ordem: 2 },
      { sigla: 'M', nome: 'Médio (M)', ordem: 3 },
      { sigla: 'G', nome: 'Grande (G)', ordem: 4 },
      { sigla: 'MEGA', nome: 'Mega', ordem: 5 },
    ]

    for (const tamanho of tamanhos) {
      await this.createTamanho(tamanho)
    }
  },
}

// =============================================================================
// FILIAIS SERVICE
// =============================================================================

export const filiaisService = {
  async getFiliais(): Promise<FilialZig[]> {
    return fetchCollection<FilialZig>('mco_filiais', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || '',
      cidade: doc.data?.cidade || doc.cidade || '',
      uf: doc.data?.uf || doc.uf || '',
      regiao: doc.data?.regiao || doc.regiao || '',
      latitude: doc.data?.latitude || doc.latitude || 0,
      longitude: doc.data?.longitude || doc.longitude || 0,
      endereco: doc.data?.endereco || doc.endereco || '',
      cep: doc.data?.cep || doc.cep || '',
      logradouro: doc.data?.logradouro || doc.logradouro || '',
      numero: doc.data?.numero || doc.numero || '',
      complemento: doc.data?.complemento || doc.complemento || '',
      bairro: doc.data?.bairro || doc.bairro || '',
      raio_atuacao_km: doc.data?.raio_atuacao_km || doc.raio_atuacao_km || 100,
      cluster_limite: doc.data?.cluster_limite || doc.cluster_limite || 'G',
      is_matriz: doc.data?.is_matriz ?? doc.is_matriz ?? false,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createFilial(data: FilialZigFormData): Promise<string> {
    return createDocument('mco_filiais', { ...data, ativo: true })
  },

  async updateFilial(id: string, data: Partial<FilialZigFormData>): Promise<void> {
    return updateDocument('mco_filiais', id, data)
  },

  async deleteFilial(id: string): Promise<void> {
    return deleteDocument('mco_filiais', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_filiais', id, { ativo })
  },
}

// =============================================================================
// CARGOS SERVICE
// =============================================================================

export const cargosService = {
  async getCargos(): Promise<Cargo[]> {
    return fetchCollection<Cargo>('mco_cargos', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || '',
      sigla: doc.data?.sigla || doc.sigla || '',
      time: doc.data?.time || doc.time || 'tecnico',
      descricao: doc.data?.descricao || doc.descricao || '',
      valor_diaria: doc.data?.valor_diaria || doc.valor_diaria || 0,
      ordem: doc.data?.ordem || doc.ordem || 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createCargo(data: CargoFormData): Promise<string> {
    return createDocument('mco_cargos', { ...data, ativo: true })
  },

  async updateCargo(id: string, data: Partial<CargoFormData>): Promise<void> {
    return updateDocument('mco_cargos', id, data)
  },

  async deleteCargo(id: string): Promise<void> {
    return deleteDocument('mco_cargos', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_cargos', id, { ativo })
  },

  async reorderCargos(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_cargos', item.id, { ordem: item.ordem }))
    )
  },
}

// =============================================================================
// CARGO TIMES CONFIG SERVICE
// Opções dinâmicas para o dropdown de time
// =============================================================================

export const cargoTimesService = {
  async getTimes(): Promise<CargoTimeConfig[]> {
    return fetchCollection<CargoTimeConfig>('mco_cargo_times', (doc) => ({
      id: doc.id,
      sigla: doc.data?.sigla || doc.sigla || '',
      nome: doc.data?.nome || doc.nome || '',
      ordem: doc.data?.ordem ?? doc.ordem ?? 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createTime(data: CargoTimeConfigFormData): Promise<string> {
    return createDocument('mco_cargo_times', { ...data, ativo: true })
  },

  async updateTime(id: string, data: Partial<CargoTimeConfigFormData>): Promise<void> {
    return updateDocument('mco_cargo_times', id, data)
  },

  async deleteTime(id: string): Promise<void> {
    return deleteDocument('mco_cargo_times', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_cargo_times', id, { ativo })
  },

  async reorderTimes(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_cargo_times', item.id, { ordem: item.ordem }))
    )
  },

  async seedTimes(): Promise<void> {
    const times: CargoTimeConfigFormData[] = [
      { sigla: 'tecnico', nome: 'Técnico', ordem: 1 },
      { sigla: 'comercial', nome: 'Comercial', ordem: 2 },
      { sigla: 'suporte', nome: 'Suporte', ordem: 3 },
      { sigla: 'lideranca', nome: 'Liderança', ordem: 4 },
    ]

    for (const time of times) {
      await this.createTime(time)
    }
  },
}

// =============================================================================
// CARGO POR CLUSTER SERVICE
// =============================================================================

export const cargoClusterService = {
  async getCargosClusters(): Promise<CargoCluster[]> {
    return fetchCollection<CargoCluster>('mco_cargo_cluster', (doc) => ({
      id: doc.id,
      cluster_id: doc.data?.cluster_id || doc.cluster_id || '',
      cargo_id: doc.data?.cargo_id || doc.cargo_id || '',
      quantidade: doc.data?.quantidade || doc.quantidade || 0,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createCargoCluster(data: CargoClusterFormData): Promise<string> {
    return createDocument('mco_cargo_cluster', data)
  },

  async updateCargoCluster(id: string, data: Partial<CargoClusterFormData>): Promise<void> {
    return updateDocument('mco_cargo_cluster', id, data)
  },

  async deleteCargoCluster(id: string): Promise<void> {
    return deleteDocument('mco_cargo_cluster', id)
  },
}

// =============================================================================
// MODALIDADES SERVICE
// =============================================================================

export const modalidadesService = {
  async getModalidades(): Promise<Modalidade[]> {
    return fetchCollection<Modalidade>('mco_modalidades', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || '',
      descricao: doc.data?.descricao || doc.descricao || '',
      tpv_por_terminal: doc.data?.tpv_por_terminal || doc.tpv_por_terminal || 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createModalidade(data: ModalidadeFormData): Promise<string> {
    return createDocument('mco_modalidades', { ...data, ativo: true })
  },

  async updateModalidade(id: string, data: Partial<ModalidadeFormData>): Promise<void> {
    return updateDocument('mco_modalidades', id, data)
  },

  async deleteModalidade(id: string): Promise<void> {
    return deleteDocument('mco_modalidades', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_modalidades', id, { ativo })
  },
}

// =============================================================================
// JORNADAS SERVICE
// =============================================================================

export const jornadasService = {
  async getJornadas(): Promise<Jornada[]> {
    return fetchCollection<Jornada>('mco_jornadas', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || '',
      hora_inicio: doc.data?.hora_inicio || doc.hora_inicio || '08:00',
      hora_fim: doc.data?.hora_fim || doc.hora_fim || '18:00',
      duracao_horas: doc.data?.duracao_horas || doc.duracao_horas || 10,
      adicional_noturno: doc.data?.adicional_noturno ?? doc.adicional_noturno ?? false,
      ordem: doc.data?.ordem ?? doc.ordem ?? 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createJornada(data: JornadaFormData): Promise<string> {
    // Calcular duração em horas
    const [inicioH, inicioM] = data.hora_inicio.split(':').map(Number)
    const [fimH, fimM] = data.hora_fim.split(':').map(Number)
    let duracao = (fimH * 60 + fimM) - (inicioH * 60 + inicioM)
    if (duracao < 0) duracao += 24 * 60 // Cruza meia-noite
    const duracao_horas = duracao / 60

    return createDocument('mco_jornadas', { ...data, duracao_horas, ativo: true })
  },

  async updateJornada(id: string, data: Partial<JornadaFormData>): Promise<void> {
    let updateData: any = { ...data }

    if (data.hora_inicio && data.hora_fim) {
      const [inicioH, inicioM] = data.hora_inicio.split(':').map(Number)
      const [fimH, fimM] = data.hora_fim.split(':').map(Number)
      let duracao = (fimH * 60 + fimM) - (inicioH * 60 + inicioM)
      if (duracao < 0) duracao += 24 * 60
      updateData.duracao_horas = duracao / 60
    }

    return updateDocument('mco_jornadas', id, updateData)
  },

  async deleteJornada(id: string): Promise<void> {
    return deleteDocument('mco_jornadas', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_jornadas', id, { ativo })
  },

  async reorderJornadas(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_jornadas', item.id, { ordem: item.ordem }))
    )
  },
}

// =============================================================================
// PARAMETROS TRANSPORTE SERVICE
// =============================================================================

export const parametrosTransporteService = {
  async getParametros(): Promise<ParametrosTransporte[]> {
    return fetchCollection<ParametrosTransporte>('mco_parametros_transporte', (doc) => ({
      id: doc.id,
      modal: doc.data?.modal || doc.modal || 'carro',
      distancia_minima_km: doc.data?.distancia_minima_km || doc.distancia_minima_km || 0,
      distancia_maxima_km: doc.data?.distancia_maxima_km || doc.distancia_maxima_km || 100,
      custo_por_km: doc.data?.custo_por_km || doc.custo_por_km || 0,
      custo_fixo: doc.data?.custo_fixo || doc.custo_fixo || 0,
      pessoas_minimas: doc.data?.pessoas_minimas || doc.pessoas_minimas,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createParametro(data: ParametrosTransporteFormData): Promise<string> {
    return createDocument('mco_parametros_transporte', { ...data, ativo: true })
  },

  async updateParametro(id: string, data: Partial<ParametrosTransporteFormData>): Promise<void> {
    return updateDocument('mco_parametros_transporte', id, data)
  },

  async deleteParametro(id: string): Promise<void> {
    return deleteDocument('mco_parametros_transporte', id)
  },
}

// =============================================================================
// PARAMETROS FRETE SERVICE
// =============================================================================

export const parametrosFreteService = {
  async getParametros(): Promise<ParametrosFrete[]> {
    return fetchCollection<ParametrosFrete>('mco_parametros_frete', (doc) => ({
      id: doc.id,
      filial_id: doc.data?.filial_id || doc.filial_id || '',
      cluster_id: doc.data?.cluster_id || doc.cluster_id || '',
      valor_base: doc.data?.valor_base || doc.valor_base || 0,
      raio_maximo_km: doc.data?.raio_maximo_km || doc.raio_maximo_km || 100,
      valor_km_adicional: doc.data?.valor_km_adicional || doc.valor_km_adicional || 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createParametro(data: ParametrosFreteFormData): Promise<string> {
    return createDocument('mco_parametros_frete', { ...data, ativo: true })
  },

  async updateParametro(id: string, data: Partial<ParametrosFreteFormData>): Promise<void> {
    return updateDocument('mco_parametros_frete', id, data)
  },

  async deleteParametro(id: string): Promise<void> {
    return deleteDocument('mco_parametros_frete', id)
  },
}

// =============================================================================
// ALIMENTACAO VALORES SERVICE
// Valores de alimentação por fase (categoria) e jornada
// =============================================================================

export const alimentacaoValoresService = {
  async getValores(): Promise<AlimentacaoValor[]> {
    return fetchCollection<AlimentacaoValor>('mco_alimentacao_valores', (doc) => ({
      id: doc.id,
      categoria_id: doc.data?.categoria_id || doc.categoria_id || '',
      jornada_id: doc.data?.jornada_id || doc.jornada_id || null,
      valor: doc.data?.valor ?? doc.valor ?? 0,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async saveValores(valores: AlimentacaoValorFormData[]): Promise<void> {
    const existentes = await this.getValores()

    for (const val of valores) {
      const match = existentes.find(
        (e) => e.categoria_id === val.categoria_id && e.jornada_id === val.jornada_id
      )
      if (match) {
        await updateDocument('mco_alimentacao_valores', match.id, { valor: val.valor })
      } else {
        await createDocument('mco_alimentacao_valores', val)
      }
    }
  },
}

// =============================================================================
// PARAMETROS HOSPEDAGEM SERVICE
// =============================================================================

export const parametrosHospedagemService = {
  async getParametros(): Promise<ParametrosHospedagem[]> {
    return fetchCollection<ParametrosHospedagem>('mco_parametros_hospedagem', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || 'Padrão',
      valor_diaria: doc.data?.valor_diaria || doc.valor_diaria || 0,
      cidade: doc.data?.cidade || doc.cidade,
      uf: doc.data?.uf || doc.uf,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createParametro(data: ParametrosHospedagemFormData): Promise<string> {
    return createDocument('mco_parametros_hospedagem', { ...data, ativo: true })
  },

  async updateParametro(id: string, data: Partial<ParametrosHospedagemFormData>): Promise<void> {
    return updateDocument('mco_parametros_hospedagem', id, data)
  },

  async deleteParametro(id: string): Promise<void> {
    return deleteDocument('mco_parametros_hospedagem', id)
  },
}

// =============================================================================
// PARAMETROS GERAIS MCO SERVICE
// =============================================================================

export const parametrosGeraisService = {
  async getParametros(): Promise<ParametrosGeraisMCO | null> {
    const params = await fetchCollection<ParametrosGeraisMCO>('mco_parametros_gerais', (doc) => ({
      id: doc.id,
      max_tecnicos_por_lider: doc.data?.max_tecnicos_por_lider || doc.max_tecnicos_por_lider || 8,
      valor_transporte_local_diario: doc.data?.valor_transporte_local_diario || doc.valor_transporte_local_diario || 0,
      valor_day_off_diario: doc.data?.valor_day_off_diario || doc.valor_day_off_diario || 0,
      distancia_evento_local_km: doc.data?.distancia_evento_local_km || doc.distancia_evento_local_km || 50,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
    return params.length > 0 ? params[0] : null
  },

  async saveParametros(data: ParametrosGeraisMCOFormData): Promise<string> {
    // Busca se já existe
    const existing = await this.getParametros()
    if (existing) {
      await updateDocument('mco_parametros_gerais', existing.id, data)
      return existing.id
    }
    return createDocument('mco_parametros_gerais', { ...data, ativo: true })
  },
}

// =============================================================================
// HOSPEDAGEM BASE DE CUSTO SERVICE
// =============================================================================

const CIDADES_SEED: Omit<HospedagemBaseCusto, 'id' | 'created_at' | 'updated_at'>[] = [
  // Sudeste - São Paulo
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São Paulo', valor_diaria: 220 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Guarulhos', valor_diaria: 170 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Campinas', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São Bernardo do Campo', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Santo André', valor_diaria: 145 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Osasco', valor_diaria: 155 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São José dos Campos', valor_diaria: 155 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Ribeirão Preto', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Sorocaba', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Santos', valor_diaria: 180 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Mauá', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São José do Rio Preto', valor_diaria: 135 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Mogi das Cruzes', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Diadema', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Jundiaí', valor_diaria: 145 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Piracicaba', valor_diaria: 135 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Carapicuíba', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Bauru', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Itaquaquecetuba', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São Vicente', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Franca', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Guarujá', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Praia Grande', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Taubaté', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Limeira', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Suzano', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Taboão da Serra', valor_diaria: 135 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Sumaré', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Barueri', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Embu das Artes', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São Caetano do Sul', valor_diaria: 155 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Indaiatuba', valor_diaria: 135 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Cotia', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Americana', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Marília', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Araraquara', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Presidente Prudente', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: "Santa Bárbara d'Oeste", valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Rio Claro', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Araçatuba', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Ferraz de Vasconcelos', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Francisco Morato', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Itapecerica da Serra', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Itu', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Bragança Paulista', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Pindamonhangaba', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Itapevi', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'São Carlos', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Jacareí', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Hortolândia', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Franco da Rocha', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Atibaia', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Cubatão', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Sertãozinho', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Valinhos', valor_diaria: 135 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Catanduva', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Botucatu', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Assis', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Mogi Guaçu', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Ourinhos', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Votorantim', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Caraguatatuba', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Itatiba', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Salto', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Poá', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Paulínia', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Votuporanga', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Lençóis Paulista', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'SP', cidade: 'Birigui', valor_diaria: 110 },
  // Sudeste - Rio de Janeiro
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Rio de Janeiro', valor_diaria: 200 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'São Gonçalo', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Duque de Caxias', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Nova Iguaçu', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Niterói', valor_diaria: 170 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Belford Roxo', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Campos dos Goytacazes', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'São João de Meriti', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Petrópolis', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Volta Redonda', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Magé', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Itaboraí', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Macaé', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Mesquita', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Nilópolis', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Cabo Frio', valor_diaria: 170 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Nova Friburgo', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Barra Mansa', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Angra dos Reis', valor_diaria: 180 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Maricá', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Teresópolis', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Rio das Ostras', valor_diaria: 145 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Resende', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Queimados', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'RJ', cidade: 'Araruama', valor_diaria: 130 },
  // Sudeste - Minas Gerais
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Belo Horizonte', valor_diaria: 170 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Uberlândia', valor_diaria: 145 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Contagem', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Juiz de Fora', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Betim', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Montes Claros', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Ribeirão das Neves', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Uberaba', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Governador Valadares', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Ipatinga', valor_diaria: 125 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Sete Lagoas', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Divinópolis', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Santa Luzia', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Ibirité', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Poços de Caldas', valor_diaria: 140 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Patos de Minas', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Pouso Alegre', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Teófilo Otoni', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Barbacena', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Sabará', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Varginha', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Conselheiro Lafaiete', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Vespasiano', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Itabira', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Araguari', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Passos', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Coronel Fabriciano', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Muriaé', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Ituiutaba', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Lavras', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Nova Lima', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Itaúna', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Pará de Minas', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Caratinga', valor_diaria: 105 },
  { regiao: 'Sudeste', uf: 'MG', cidade: 'Patrocínio', valor_diaria: 105 },
  // Sudeste - Espírito Santo
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Vitória', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Vila Velha', valor_diaria: 150 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Serra', valor_diaria: 130 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Cariacica', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Cachoeiro de Itapemirim', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Linhares', valor_diaria: 120 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'São Mateus', valor_diaria: 115 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Colatina', valor_diaria: 110 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Guarapari', valor_diaria: 160 },
  { regiao: 'Sudeste', uf: 'ES', cidade: 'Aracruz', valor_diaria: 115 },
  // Sul - Paraná
  { regiao: 'Sul', uf: 'PR', cidade: 'Curitiba', valor_diaria: 165 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Londrina', valor_diaria: 140 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Maringá', valor_diaria: 140 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Ponta Grossa', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Cascavel', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'PR', cidade: 'São José dos Pinhais', valor_diaria: 135 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Foz do Iguaçu', valor_diaria: 160 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Colombo', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Guarapuava', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Paranaguá', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Araucária', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Toledo', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Apucarana', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Pinhais', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Campo Largo', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Arapongas', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Almirante Tamandaré', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Umuarama', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Piraquara', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Cambé', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Campo Mourão', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Fazenda Rio Grande', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Paranavaí', valor_diaria: 105 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Francisco Beltrão', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'PR', cidade: 'Pato Branco', valor_diaria: 110 },
  // Sul - Santa Catarina
  { regiao: 'Sul', uf: 'SC', cidade: 'Joinville', valor_diaria: 150 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Florianópolis', valor_diaria: 180 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Blumenau', valor_diaria: 145 },
  { regiao: 'Sul', uf: 'SC', cidade: 'São José', valor_diaria: 140 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Chapecó', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Itajaí', valor_diaria: 155 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Criciúma', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Jaraguá do Sul', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Palhoça', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Lages', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Balneário Camboriú', valor_diaria: 200 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Brusque', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Tubarão', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'SC', cidade: 'São Bento do Sul', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Caçador', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Concórdia', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Camboriú', valor_diaria: 150 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Navegantes', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Rio do Sul', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'SC', cidade: 'Biguaçu', valor_diaria: 120 },
  // Sul - Rio Grande do Sul
  { regiao: 'Sul', uf: 'RS', cidade: 'Porto Alegre', valor_diaria: 160 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Caxias do Sul', valor_diaria: 145 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Pelotas', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Canoas', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Santa Maria', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Gravataí', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Viamão', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Novo Hamburgo', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'RS', cidade: 'São Leopoldo', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Rio Grande', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Alvorada', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Passo Fundo', valor_diaria: 130 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Sapucaia do Sul', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Uruguaiana', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Cachoeirinha', valor_diaria: 120 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Santa Cruz do Sul', valor_diaria: 125 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Bagé', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Bento Gonçalves', valor_diaria: 140 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Erechim', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Guaíba', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Cachoeira do Sul', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Santana do Livramento', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Esteio', valor_diaria: 115 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Ijuí', valor_diaria: 110 },
  { regiao: 'Sul', uf: 'RS', cidade: 'Gramado', valor_diaria: 200 },
  // Nordeste - Bahia
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Salvador', valor_diaria: 170 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Feira de Santana', valor_diaria: 125 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Vitória da Conquista', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Camaçari', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Itabuna', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Juazeiro', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Lauro de Freitas', valor_diaria: 140 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Ilhéus', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Jequié', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Teixeira de Freitas', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Alagoinhas', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Barreiras', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Porto Seguro', valor_diaria: 180 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Simões Filho', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Paulo Afonso', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Eunápolis', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Santo Antônio de Jesus', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Valença', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Candeias', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'BA', cidade: 'Guanambi', valor_diaria: 105 },
  // Nordeste - Pernambuco
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Recife', valor_diaria: 165 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Jaboatão dos Guararapes', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Olinda', valor_diaria: 140 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Caruaru', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Petrolina', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Paulista', valor_diaria: 125 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Cabo de Santo Agostinho', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Camaragibe', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Garanhuns', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Vitória de Santo Antão', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Igarassu', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'São Lourenço da Mata', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Abreu e Lima', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Serra Talhada', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'PE', cidade: 'Araripina', valor_diaria: 100 },
  // Nordeste - Ceará
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Fortaleza', valor_diaria: 160 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Caucaia', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Juazeiro do Norte', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Maracanaú', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Sobral', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Crato', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Itapipoca', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Maranguape', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Iguatu', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Quixadá', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Pacatuba', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Aquiraz', valor_diaria: 140 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Canindé', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Russas', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'CE', cidade: 'Tianguá', valor_diaria: 100 },
  // Nordeste - Maranhão
  { regiao: 'Nordeste', uf: 'MA', cidade: 'São Luís', valor_diaria: 150 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Imperatriz', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'São José de Ribamar', valor_diaria: 115 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Timon', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Caxias', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Codó', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Paço do Lumiar', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Açailândia', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Bacabal', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'MA', cidade: 'Balsas', valor_diaria: 105 },
  // Nordeste - Paraíba
  { regiao: 'Nordeste', uf: 'PB', cidade: 'João Pessoa', valor_diaria: 150 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Campina Grande', valor_diaria: 125 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Santa Rita', valor_diaria: 105 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Patos', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Bayeux', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Sousa', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Cajazeiras', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'PB', cidade: 'Cabedelo', valor_diaria: 130 },
  // Nordeste - Rio Grande do Norte
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Natal', valor_diaria: 160 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Mossoró', valor_diaria: 120 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Parnamirim', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'São Gonçalo do Amarante', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Macaíba', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Ceará-Mirim', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Caicó', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'RN', cidade: 'Açu', valor_diaria: 95 },
  // Nordeste - Alagoas
  { regiao: 'Nordeste', uf: 'AL', cidade: 'Maceió', valor_diaria: 155 },
  { regiao: 'Nordeste', uf: 'AL', cidade: 'Arapiraca', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'AL', cidade: 'Rio Largo', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'AL', cidade: 'Palmeira dos Índios', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'AL', cidade: 'União dos Palmares', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'AL', cidade: 'Penedo', valor_diaria: 100 },
  // Nordeste - Piauí
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Teresina', valor_diaria: 140 },
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Parnaíba', valor_diaria: 130 },
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Picos', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Piripiri', valor_diaria: 95 },
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Floriano', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'PI', cidade: 'Campo Maior', valor_diaria: 95 },
  // Nordeste - Sergipe
  { regiao: 'Nordeste', uf: 'SE', cidade: 'Aracaju', valor_diaria: 150 },
  { regiao: 'Nordeste', uf: 'SE', cidade: 'Nossa Senhora do Socorro', valor_diaria: 110 },
  { regiao: 'Nordeste', uf: 'SE', cidade: 'Lagarto', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'SE', cidade: 'Itabaiana', valor_diaria: 100 },
  { regiao: 'Nordeste', uf: 'SE', cidade: 'São Cristóvão', valor_diaria: 105 },
  // Centro-Oeste - Goiás
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Goiânia', valor_diaria: 150 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Aparecida de Goiânia', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Anápolis', valor_diaria: 125 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Rio Verde', valor_diaria: 120 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Luziânia', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Águas Lindas de Goiás', valor_diaria: 100 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Valparaíso de Goiás', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Trindade', valor_diaria: 105 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Formosa', valor_diaria: 105 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Novo Gama', valor_diaria: 100 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Senador Canedo', valor_diaria: 105 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Itumbiara', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Jataí', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Catalão', valor_diaria: 115 },
  { regiao: 'Centro-Oeste', uf: 'GO', cidade: 'Caldas Novas', valor_diaria: 150 },
  // Centro-Oeste - Distrito Federal
  { regiao: 'Centro-Oeste', uf: 'DF', cidade: 'Brasília', valor_diaria: 200 },
  // Centro-Oeste - Mato Grosso
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Cuiabá', valor_diaria: 150 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Várzea Grande', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Rondonópolis', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Sinop', valor_diaria: 135 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Tangará da Serra', valor_diaria: 115 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Cáceres', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Sorriso', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Lucas do Rio Verde', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Primavera do Leste', valor_diaria: 125 },
  { regiao: 'Centro-Oeste', uf: 'MT', cidade: 'Barra do Garças', valor_diaria: 115 },
  // Centro-Oeste - Mato Grosso do Sul
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Campo Grande', valor_diaria: 145 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Dourados', valor_diaria: 125 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Três Lagoas', valor_diaria: 120 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Corumbá', valor_diaria: 130 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Ponta Porã', valor_diaria: 110 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Naviraí', valor_diaria: 105 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Nova Andradina', valor_diaria: 105 },
  { regiao: 'Centro-Oeste', uf: 'MS', cidade: 'Aquidauana', valor_diaria: 110 },
  // Norte - Pará
  { regiao: 'Norte', uf: 'PA', cidade: 'Belém', valor_diaria: 155 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Ananindeua', valor_diaria: 125 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Santarém', valor_diaria: 130 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Marabá', valor_diaria: 130 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Parauapebas', valor_diaria: 150 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Castanhal', valor_diaria: 110 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Abaetetuba', valor_diaria: 105 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Cametá', valor_diaria: 100 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Marituba', valor_diaria: 110 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Bragança', valor_diaria: 105 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Tucuruí', valor_diaria: 120 },
  { regiao: 'Norte', uf: 'PA', cidade: 'Altamira', valor_diaria: 125 },
  // Norte - Amazonas
  { regiao: 'Norte', uf: 'AM', cidade: 'Manaus', valor_diaria: 170 },
  { regiao: 'Norte', uf: 'AM', cidade: 'Parintins', valor_diaria: 130 },
  { regiao: 'Norte', uf: 'AM', cidade: 'Itacoatiara', valor_diaria: 115 },
  { regiao: 'Norte', uf: 'AM', cidade: 'Manacapuru', valor_diaria: 110 },
  { regiao: 'Norte', uf: 'AM', cidade: 'Coari', valor_diaria: 120 },
  // Norte - Rondônia
  { regiao: 'Norte', uf: 'RO', cidade: 'Porto Velho', valor_diaria: 150 },
  { regiao: 'Norte', uf: 'RO', cidade: 'Ji-Paraná', valor_diaria: 120 },
  { regiao: 'Norte', uf: 'RO', cidade: 'Ariquemes', valor_diaria: 115 },
  { regiao: 'Norte', uf: 'RO', cidade: 'Vilhena', valor_diaria: 120 },
  { regiao: 'Norte', uf: 'RO', cidade: 'Cacoal', valor_diaria: 115 },
  // Norte - Tocantins
  { regiao: 'Norte', uf: 'TO', cidade: 'Palmas', valor_diaria: 145 },
  { regiao: 'Norte', uf: 'TO', cidade: 'Araguaína', valor_diaria: 120 },
  { regiao: 'Norte', uf: 'TO', cidade: 'Gurupi', valor_diaria: 115 },
  { regiao: 'Norte', uf: 'TO', cidade: 'Porto Nacional', valor_diaria: 110 },
  // Norte - Acre
  { regiao: 'Norte', uf: 'AC', cidade: 'Rio Branco', valor_diaria: 145 },
  { regiao: 'Norte', uf: 'AC', cidade: 'Cruzeiro do Sul', valor_diaria: 130 },
  // Norte - Amapá
  { regiao: 'Norte', uf: 'AP', cidade: 'Macapá', valor_diaria: 150 },
  { regiao: 'Norte', uf: 'AP', cidade: 'Santana', valor_diaria: 125 },
  // Norte - Roraima
  { regiao: 'Norte', uf: 'RR', cidade: 'Boa Vista', valor_diaria: 150 },
]

export const hospedagemBaseCustoService = {
  async getAll(): Promise<HospedagemBaseCusto[]> {
    return fetchCollection<HospedagemBaseCusto>('mco_hospedagem_base_custo', (doc) => ({
      id: doc.id,
      regiao: doc.data?.regiao || doc.regiao || '',
      uf: doc.data?.uf || doc.uf || '',
      cidade: doc.data?.cidade || doc.cidade || '',
      valor_diaria: doc.data?.valor_diaria ?? doc.valor_diaria ?? 0,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async salvarAlteracoes(updates: { id: string; valor_diaria: number }[]): Promise<void> {
    await Promise.all(
      updates.map(({ id, valor_diaria }) =>
        updateDocument('mco_hospedagem_base_custo', id, { valor_diaria })
      )
    )
  },

  async marcarRevisao(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id) => updateDocument('mco_hospedagem_base_custo', id, {}))
    )
  },

  async seedCidades(): Promise<void> {
    for (const cidade of CIDADES_SEED) {
      await createDocument('mco_hospedagem_base_custo', cidade)
    }
  },
}

// =============================================================================
// HOSPEDAGEM ELEGIBILIDADE SERVICE
// =============================================================================

export const hospedagemElegibilidadeService = {
  async getAll(): Promise<HospedagemElegibilidade[]> {
    return fetchCollection<HospedagemElegibilidade>('mco_hospedagem_elegibilidade', (doc) => ({
      id: doc.id,
      cargo_id: doc.data?.cargo_id || doc.cargo_id || '',
      cluster_id: doc.data?.cluster_id || doc.cluster_id || '',
      elegivel: doc.data?.elegivel ?? doc.elegivel ?? false,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async salvarAlteracoes(
    changes: Record<string, boolean>,
    existing: HospedagemElegibilidade[]
  ): Promise<void> {
    await Promise.all(
      Object.entries(changes).map(([key, elegivel]) => {
        const [cargoId, clusterId] = key.split('__')
        const record = existing.find(
          (e) => e.cargo_id === cargoId && e.cluster_id === clusterId
        )
        if (record) {
          return updateDocument('mco_hospedagem_elegibilidade', record.id, { elegivel })
        } else {
          return createDocument('mco_hospedagem_elegibilidade', {
            cargo_id: cargoId,
            cluster_id: clusterId,
            elegivel,
          })
        }
      })
    )
  },
}

// =============================================================================
// STATS SERVICE
// =============================================================================

export const mcoParametrosStatsService = {
  async getStats(): Promise<MCOParametrosStats> {
    try {
      const [clusters, filiais, cargos, modalidades, jornadas] = await Promise.all([
        clustersService.getClusters(),
        filiaisService.getFiliais(),
        cargosService.getCargos(),
        modalidadesService.getModalidades(),
        jornadasService.getJornadas(),
      ])

      return {
        clusters: clusters.filter((c) => c.ativo).length,
        filiais: filiais.filter((f) => f.ativo).length,
        cargos: cargos.filter((c) => c.ativo).length,
        modalidades: modalidades.filter((m) => m.ativo).length,
        jornadas: jornadas.filter((j) => j.ativo).length,
      }
    } catch (error) {
      console.error('Error fetching MCO stats:', error)
      return {
        clusters: 0,
        filiais: 0,
        cargos: 0,
        modalidades: 0,
        jornadas: 0,
      }
    }
  },
}

// =============================================================================
// SEED DATA - Dados iniciais para popular o sistema
// =============================================================================

export const mcoSeedService = {
  async seedClusters(): Promise<void> {
    const clusters: ClusterFormData[] = [
      { tamanho: 'PP', nome: 'Pequeno Porte', faturamento_piso: 0, faturamento_teto: 74999, ite: 70, dias_setup: 0 },
      { tamanho: 'P', nome: 'Pequeno', faturamento_piso: 75000, faturamento_teto: 149999, ite: 70, dias_setup: 0 },
      { tamanho: 'M', nome: 'Médio', faturamento_piso: 150000, faturamento_teto: 499999, ite: 70, dias_setup: 0 },
      { tamanho: 'G', nome: 'Grande', faturamento_piso: 500000, faturamento_teto: 1499999, ite: 70, dias_setup: 0 },
      { tamanho: 'MEGA', nome: 'Mega', faturamento_piso: 1500000, faturamento_teto: 999999999, ite: 70, dias_setup: 4 },
    ]

    for (const cluster of clusters) {
      await clustersService.createCluster(cluster)
    }
  },

  async seedFiliais(): Promise<void> {
    const filiais: FilialZigFormData[] = [
      {
        nome: 'São Paulo',
        cidade: 'São Paulo',
        uf: 'SP',
        regiao: 'Sudeste',
        latitude: -23.5505,
        longitude: -46.6333,
        cep: '01310-100',
        logradouro: 'Av. Paulista',
        numero: '1000',
        complemento: 'Sala 200',
        bairro: 'Bela Vista',
        raio_atuacao_km: 100,
        cluster_limite: 'MEGA',
        is_matriz: true,
      },
      {
        nome: 'Rio de Janeiro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        regiao: 'Sudeste',
        latitude: -22.9068,
        longitude: -43.1729,
        cep: '20040-020',
        logradouro: 'Av. Rio Branco',
        numero: '500',
        complemento: '',
        bairro: 'Centro',
        raio_atuacao_km: 80,
        cluster_limite: 'G',
        is_matriz: false,
      },
      {
        nome: 'Belo Horizonte',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        regiao: 'Sudeste',
        latitude: -19.9167,
        longitude: -43.9345,
        cep: '30130-002',
        logradouro: 'Av. Afonso Pena',
        numero: '1500',
        complemento: 'Loja 10',
        bairro: 'Centro',
        raio_atuacao_km: 100,
        cluster_limite: 'M',
        is_matriz: false,
      },
    ]

    for (const filial of filiais) {
      await filiaisService.createFilial(filial)
    }
  },

  async seedCargos(): Promise<void> {
    const cargos: CargoFormData[] = [
      { nome: 'Líder Técnico', sigla: 'LTT', time: 'lideranca', descricao: 'Líder da equipe técnica', valor_diaria: 350, ordem: 1 },
      { nome: 'Técnico de Campo', sigla: 'TCA', time: 'tecnico', descricao: 'Técnico responsável por terminais', valor_diaria: 250, ordem: 2 },
      { nome: 'Suporte Operacional', sigla: 'SUP', time: 'suporte', descricao: 'Suporte ao evento', valor_diaria: 200, ordem: 3 },
    ]

    for (const cargo of cargos) {
      await cargosService.createCargo(cargo)
    }
  },

  async seedModalidades(): Promise<void> {
    const modalidades: ModalidadeFormData[] = [
      { nome: 'Self-Service', descricao: 'Cliente opera os terminais', tpv_por_terminal: 15000 },
      { nome: 'Atendimento Assistido', descricao: 'Equipe Zig opera os terminais', tpv_por_terminal: 12000 },
      { nome: 'Híbrido', descricao: 'Misto de self-service e assistido', tpv_por_terminal: 13500 },
      { nome: 'Cashless', descricao: 'Operação totalmente cashless', tpv_por_terminal: 18000 },
    ]

    for (const modalidade of modalidades) {
      await modalidadesService.createModalidade(modalidade)
    }
  },

  async seedJornadas(): Promise<void> {
    const jornadas: JornadaFormData[] = [
      { nome: 'Diurna', hora_inicio: '08:00', hora_fim: '18:00' },
      { nome: 'Vespertina', hora_inicio: '14:00', hora_fim: '22:00' },
      { nome: 'Noturna', hora_inicio: '18:00', hora_fim: '02:00' },
      { nome: 'Madrugada', hora_inicio: '22:00', hora_fim: '06:00' },
    ]

    for (const jornada of jornadas) {
      await jornadasService.createJornada(jornada)
    }
  },

  async seedParametrosTransporte(): Promise<void> {
    const params: ParametrosTransporteFormData[] = [
      { modal: 'carro', distancia_minima_km: 0, distancia_maxima_km: 100, custo_por_km: 1.5, custo_fixo: 50 },
      { modal: 'onibus', distancia_minima_km: 100, distancia_maxima_km: 500, custo_por_km: 0.8, custo_fixo: 80 },
      { modal: 'aereo', distancia_minima_km: 500, distancia_maxima_km: 99999, custo_por_km: 0.5, custo_fixo: 500, pessoas_minimas: 8 },
    ]

    for (const param of params) {
      await parametrosTransporteService.createParametro(param)
    }
  },

  async seedParametrosGerais(): Promise<void> {
    await parametrosGeraisService.saveParametros({
      max_tecnicos_por_lider: 8,
      valor_transporte_local_diario: 150,
      valor_day_off_diario: 200,
      distancia_evento_local_km: 50,
    })
  },

  async seedAll(): Promise<void> {
    await Promise.all([
      this.seedClusters(),
      this.seedFiliais(),
      this.seedCargos(),
      this.seedModalidades(),
      this.seedJornadas(),
      this.seedParametrosTransporte(),
      this.seedParametrosGerais(),
    ])
  },
}

// =============================================================================
// PARÂMETROS DE CÁLCULO DE CARGOS
// =============================================================================
export const cargoCalculoParametrosService = {
  async getParametros(): Promise<CargoCalculoParametros | null> {
    const items = await fetchCollection<CargoCalculoParametros>('mco_cargo_calculo_parametros', (doc) => ({
      id: doc.id,
      maximo_tecnicos_por_lider: doc.data?.maximo_tecnicos_por_lider ?? doc.maximo_tecnicos_por_lider ?? 10,
      cargo_tecnico_id: doc.data?.cargo_tecnico_id ?? doc.cargo_tecnico_id ?? null,
      cargo_lider_id: doc.data?.cargo_lider_id ?? doc.cargo_lider_id ?? null,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
    return items.length > 0 ? items[0] : null
  },

  async saveParametros(data: CargoCalculoParametrosFormData): Promise<string> {
    const existing = await cargoCalculoParametrosService.getParametros()

    if (existing) {
      await updateDocument('mco_cargo_calculo_parametros', existing.id, data)
      return existing.id
    } else {
      return createDocument('mco_cargo_calculo_parametros', data)
    }
  },
}

// =============================================================================
// CATEGORIAS DE REMUNERAÇÃO
// =============================================================================
export const categoriasRemuneracaoService = {
  async getCategorias(): Promise<CategoriaRemuneracao[]> {
    return fetchCollection<CategoriaRemuneracao>('mco_categorias_remuneracao', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || '',
      tipo_calculo: doc.data?.tipo_calculo || doc.tipo_calculo || 'viagem',
      descricao: doc.data?.descricao || doc.descricao || '',
      ordem: doc.data?.ordem ?? doc.ordem ?? 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createCategoria(data: CategoriaRemuneracaoFormData): Promise<string> {
    return createDocument('mco_categorias_remuneracao', { ...data, ativo: true })
  },

  async updateCategoria(id: string, data: Partial<CategoriaRemuneracaoFormData>): Promise<void> {
    return updateDocument('mco_categorias_remuneracao', id, data)
  },

  async deleteCategoria(id: string): Promise<void> {
    return deleteDocument('mco_categorias_remuneracao', id)
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_categorias_remuneracao', id, { ativo })
  },

  async reorderCategorias(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_categorias_remuneracao', item.id, { ordem: item.ordem }))
    )
  },
}

// =============================================================================
// CARGO CATEGORIA VALOR (Parâmetros de Diárias)
// =============================================================================
export const cargoCategoriaValorService = {
  async getValores(): Promise<CargoCategoriaValor[]> {
    return fetchCollection<CargoCategoriaValor>('mco_cargo_categoria_valor', (doc) => ({
      id: doc.id,
      cargo_id: doc.data?.cargo_id || doc.cargo_id || '',
      categoria_id: doc.data?.categoria_id || doc.categoria_id || '',
      valor: doc.data?.valor ?? doc.valor ?? 0,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async getValoresByCategoria(categoriaId: string): Promise<CargoCategoriaValor[]> {
    const allValores = await this.getValores()
    return allValores.filter(v => v.categoria_id === categoriaId)
  },

  async saveValores(valores: CargoCategoriaValorFormData[]): Promise<void> {
    await Promise.all(
      valores.map((valor) => createDocument('mco_cargo_categoria_valor', valor))
    )
  },

  async deleteByCategoria(categoriaId: string): Promise<void> {
    const valores = await this.getValoresByCategoria(categoriaId)
    await Promise.all(
      valores.map((valor) => deleteDocument('mco_cargo_categoria_valor', valor.id))
    )
  },
}

// =============================================================================
// CARGO JORNADA CATEGORIA (Diárias Go Live)
// =============================================================================
export const cargoJornadaCategoriaService = {
  async getValores(): Promise<CargoJornadaCategoria[]> {
    return fetchCollection<CargoJornadaCategoria>('mco_cargo_jornada_categoria', (doc) => ({
      id: doc.id,
      cargo_id: doc.data?.cargo_id || doc.cargo_id || '',
      jornada_id: doc.data?.jornada_id || doc.jornada_id || '',
      categoria_id: doc.data?.categoria_id || doc.categoria_id || '',
      valor: doc.data?.valor ?? doc.valor ?? 0,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async getValoresByCategoria(categoriaId: string): Promise<CargoJornadaCategoria[]> {
    const allValores = await this.getValores()
    return allValores.filter(v => v.categoria_id === categoriaId)
  },

  async saveValores(valores: CargoJornadaCategoriaFormData[]): Promise<void> {
    await Promise.all(
      valores.map((valor) => createDocument('mco_cargo_jornada_categoria', valor))
    )
  },

  async deleteByCategoria(categoriaId: string): Promise<void> {
    const valores = await this.getValoresByCategoria(categoriaId)
    await Promise.all(
      valores.map((valor) => deleteDocument('mco_cargo_jornada_categoria', valor.id))
    )
  },
}

// =============================================================================
// TIPO CALCULO CONFIG (Configuração de tipos de etapas)
// =============================================================================
export const tipoCalculoConfigService = {
  async getTipos(): Promise<TipoCalculoConfig[]> {
    return fetchCollection<TipoCalculoConfig>('mco_tipo_calculo_config', (doc) => ({
      id: doc.id,
      valor: doc.data?.valor || doc.valor || '',
      label: doc.data?.label || doc.label || '',
      icon: doc.data?.icon || doc.icon || 'Circle',
      cor_fundo: doc.data?.cor_fundo || doc.cor_fundo || 'bg-gray-100',
      cor_texto: doc.data?.cor_texto || doc.cor_texto || 'text-gray-700',
      cor_borda: doc.data?.cor_borda || doc.cor_borda || 'border-gray-200',
      is_sistema: doc.data?.is_sistema ?? doc.is_sistema ?? false,
      ordem: doc.data?.ordem ?? doc.ordem ?? 0,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createTipo(data: TipoCalculoConfigFormData): Promise<string> {
    return createDocument('mco_tipo_calculo_config', { ...data, is_sistema: false, ativo: true })
  },

  async updateTipo(id: string, data: Partial<TipoCalculoConfigFormData>): Promise<void> {
    return updateDocument('mco_tipo_calculo_config', id, data)
  },

  async deleteTipo(id: string): Promise<void> {
    return deleteDocument('mco_tipo_calculo_config', id)
  },

  async reorderTipos(items: { id: string; ordem: number }[]): Promise<void> {
    await Promise.all(
      items.map((item) => updateDocument('mco_tipo_calculo_config', item.id, { ordem: item.ordem }))
    )
  },

  // Seed dos tipos padrão do sistema
  async seedTiposPadrao(): Promise<void> {
    const tiposPadrao: Array<TipoCalculoConfigFormData & { is_sistema: boolean }> = [
      {
        valor: 'viagem',
        label: 'Viagem',
        icon: 'Plane',
        cor_fundo: 'bg-blue-100',
        cor_texto: 'text-blue-700',
        cor_borda: 'border-blue-200',
        ordem: 1,
        is_sistema: true,
      },
      {
        valor: 'setup',
        label: 'Setup',
        icon: 'Wrench',
        cor_fundo: 'bg-orange-100',
        cor_texto: 'text-orange-700',
        cor_borda: 'border-orange-200',
        ordem: 2,
        is_sistema: true,
      },
      {
        valor: 'go_live',
        label: 'Go Live',
        icon: 'Zap',
        cor_fundo: 'bg-green-100',
        cor_texto: 'text-green-700',
        cor_borda: 'border-green-200',
        ordem: 3,
        is_sistema: true,
      },
      {
        valor: 'day_off',
        label: 'Day Off',
        icon: 'Coffee',
        cor_fundo: 'bg-purple-100',
        cor_texto: 'text-purple-700',
        cor_borda: 'border-purple-200',
        ordem: 4,
        is_sistema: true,
      },
    ]

    for (const tipo of tiposPadrao) {
      await createDocument('mco_tipo_calculo_config', { ...tipo, ativo: true })
    }
  },
}

// =============================================================================
// TIMES POR ETAPA SERVICE
// Configuração de participação de times em cada etapa
// =============================================================================

export const etapaTimesService = {
  async getConfiguracoes(): Promise<EtapaTimeConfig[]> {
    return fetchCollection<EtapaTimeConfig>('mco_etapa_times', (doc) => ({
      id: doc.id,
      etapa_id: doc.data?.etapa_id || doc.etapa_id || '',
      time_id: doc.data?.time_id || doc.time_id || '',
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createConfiguracao(data: EtapaTimeConfigFormData): Promise<string> {
    return createDocument('mco_etapa_times', data)
  },

  async updateConfiguracao(id: string, data: Partial<EtapaTimeConfigFormData>): Promise<void> {
    return updateDocument('mco_etapa_times', id, data)
  },

  async deleteConfiguracao(id: string): Promise<void> {
    return deleteDocument('mco_etapa_times', id)
  },

  async toggleAtivo(id: string, ativo: boolean): Promise<void> {
    return updateDocument('mco_etapa_times', id, { ativo })
  },
}

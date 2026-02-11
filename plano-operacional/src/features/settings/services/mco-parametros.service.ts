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
  ParametrosAlimentacao,
  ParametrosAlimentacaoFormData,
  ParametrosHospedagem,
  ParametrosHospedagemFormData,
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
// PARAMETROS ALIMENTACAO SERVICE
// =============================================================================

export const parametrosAlimentacaoService = {
  async getParametros(): Promise<ParametrosAlimentacao[]> {
    return fetchCollection<ParametrosAlimentacao>('mco_parametros_alimentacao', (doc) => ({
      id: doc.id,
      nome: doc.data?.nome || doc.nome || 'Padrão',
      valor_pequeno_almoco: doc.data?.valor_pequeno_almoco || doc.valor_pequeno_almoco || 0,
      valor_almoco: doc.data?.valor_almoco || doc.valor_almoco || 0,
      valor_jantar: doc.data?.valor_jantar || doc.valor_jantar || 0,
      valor_lanche_noturno: doc.data?.valor_lanche_noturno || doc.valor_lanche_noturno || 0,
      valor_diaria_completa:
        (doc.data?.valor_pequeno_almoco || 0) +
        (doc.data?.valor_almoco || 0) +
        (doc.data?.valor_jantar || 0) +
        (doc.data?.valor_lanche_noturno || 0),
      cidade: doc.data?.cidade || doc.cidade,
      uf: doc.data?.uf || doc.uf,
      ativo: doc.data?.ativo ?? doc.ativo ?? true,
      created_at: doc.data?.createdAt || doc.createdAt || '',
      updated_at: doc.data?.updatedAt || doc.updatedAt || '',
    }))
  },

  async createParametro(data: ParametrosAlimentacaoFormData): Promise<string> {
    const valor_diaria_completa =
      data.valor_pequeno_almoco + data.valor_almoco + data.valor_jantar + data.valor_lanche_noturno
    return createDocument('mco_parametros_alimentacao', { ...data, valor_diaria_completa, ativo: true })
  },

  async updateParametro(id: string, data: Partial<ParametrosAlimentacaoFormData>): Promise<void> {
    return updateDocument('mco_parametros_alimentacao', id, data)
  },

  async deleteParametro(id: string): Promise<void> {
    return deleteDocument('mco_parametros_alimentacao', id)
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
      { nome: 'Diurna', hora_inicio: '08:00', hora_fim: '18:00', adicional_noturno: false },
      { nome: 'Vespertina', hora_inicio: '14:00', hora_fim: '22:00', adicional_noturno: true },
      { nome: 'Noturna', hora_inicio: '18:00', hora_fim: '02:00', adicional_noturno: true },
      { nome: 'Madrugada', hora_inicio: '22:00', hora_fim: '06:00', adicional_noturno: true },
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

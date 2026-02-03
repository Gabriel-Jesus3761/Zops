import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

// Helper para pegar o token de autenticação
const getAuthToken = (): string => {
  const authStorage = localStorage.getItem('auth-storage')
  if (!authStorage) {
    throw new Error('Token de autenticação não encontrado')
  }

  const parsed = JSON.parse(authStorage)
  const token = parsed?.state?.token?.token

  if (!token) {
    throw new Error('Token de autenticação não encontrado')
  }

  return token
}

// Helper para criar headers autenticados
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Tipos de resposta
export interface DadosGerais {
  totalEventos: number
  totalTerminais: number
  totalTecnicos: number
  percentualEventosComEquipe: number
  eventosPorProduto: Array<{ produto: string; quantidade: number; cor?: string }>
  eventosPorTamanho: Array<{ tamanho: string; quantidade: number }>
  eventosPorFilial: Array<{ filial: string; quantidade: number }>
}

export interface DadosCasas {
  totalCasas: number
  totalTerminais: number
  totalTecnicos: number
  percentualCasasComTecnicos: number
  casasPorProduto: Array<{ produto: string; quantidade: number; cor?: string }>
  casasPorTamanho: Array<{ tamanho: string; quantidade: number }>
  casasPorFilial: Array<{ filial: string; quantidade: number }>
}

export interface DadosECC {
  eventosComChamados: number
  totalChamados: number
  tempoMedioPrimeiraResposta: string
  tempoMedioSolucao: string
  chamadosPorCategoria: Array<{ categoria?: string; nome?: string; quantidade: number }>
  chamadosPorTamanhoEvento?: Array<{ tamanho: string; quantidade: number }>
  chamadosPorProduto?: Array<{ produto: string; quantidade: number }>
  chamadosPorSolucao?: Array<{ solucao: string; quantidade: number }>
}

export interface DadosReportTech {
  eventosComChamados: number
  totalChamados: number
  tempoMedioSolucaoFormatado?: string
  status: Array<{ status: string; quantidade: number }>
  taxonomia: Array<{ taxonomia: string; quantidade: number }>
  tribo: Array<{ tribo: string; quantidade: number }>
  prioridade: Array<{ prioridade: string; quantidade: number }>
  produto: Array<{ produto: string; quantidade: number }>
  prazo: Array<{ prazo: string; quantidade: number }>
  reportador: Array<{ reportador: string; quantidade: number }>
  dataCriacao: Array<{ data: string; quantidade: number }>
}

export interface DadosReportsInterno {
  eventosComChamados: number
  totalChamados: number
  impactoCliente: Array<{ impacto?: string; nome?: string; quantidade: number }>
  chamadosPorTamanhoProjeto: Array<{ tamanho: string; quantidade: number }>
  chamadosPorProduto: Array<{ produto: string; quantidade: number }>
  chamadosPorSolucao: Array<{ solucao: string; quantidade: number }>
  chamadosPorSubarea: Array<{ subarea: string; quantidade: number }>
  chamadosPorFilial: Array<{ filial: string; quantidade: number }>
  reportadores: Array<{ reportador?: string; nome?: string; quantidade: number }>
  dadosReportInterno?: Array<any>
}

export interface DadosFieldZiger {
  eventosComChamados: number
  totalChamados: number
  tempoMedioSolucao: string
  chamadosPorCategoria: Array<{ categoria?: string; nome?: string; quantidade: number }>
  detalhes?: {
    periodo: {
      inicio: string
      fim: string
    }
    tempoSolucao: {
      minimo: { horasMinutos: string }
      medio: { horasMinutos: string }
      maximo: { horasMinutos: string }
    }
  }
}

// Serviço
export const raioXService = {
  // Buscar dados gerais (Eventos)
  buscarDadosGerais: async (startDate: string, endDate: string, tipo = 'evento', filtrosExtras = {}) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      startDate,
      endDate,
      tipo,
      ...filtrosExtras
    }

    const response = await axios.post<DadosGerais>(
      `${BASE_URL}/getDadosGerais`,
      payload,
      { headers: getAuthHeaders() }
    )

    return response.data
  },

  // Buscar dados de Casas
  buscarDadosCasas: async (startDate: string, endDate: string, filtrosExtras = {}) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      startDate,
      endDate,
      tipo: 'casa',
      ...filtrosExtras
    }

    const response = await axios.post<DadosCasas>(
      `${BASE_URL}/getDadosGerais`,
      payload,
      { headers: getAuthHeaders() }
    )

    return response.data
  },

  // Buscar dados ECC
  buscarDadosECC: async (startDate: string, endDate: string, filtrosExtras = {}) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      cardIds: [5497, 5498],
      startDate,
      endDate,
      ...filtrosExtras
    }

    const response = await axios.post<{ dadosConsolidados: DadosECC; dadosSeparados?: any }>(
      `${BASE_URL}/getMetabaseDataECC`,
      payload,
      { headers: getAuthHeaders() }
    )

    // API retorna { dadosConsolidados, dadosSeparados }
    return response.data.dadosConsolidados
  },

  // Buscar dados Report Tech
  buscarDadosReportTech: async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      start: startDate,
      end: endDate
    }

    const response = await axios.post<DadosReportTech>(
      `${BASE_URL}/getMetabaseDataRT`,
      payload,
      { headers: getAuthHeaders() }
    )

    return response.data
  },

  // Buscar dados Reports Interno
  buscarDadosReportsInterno: async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      start: startDate,
      end: endDate
    }

    const response = await axios.post<DadosReportsInterno>(
      `${BASE_URL}/getReportInternoData`,
      payload,
      { headers: getAuthHeaders() }
    )

    return response.data
  },

  // Buscar dados Field Ziger
  buscarDadosFieldZiger: async (startDate: string, endDate: string, filtrosExtras = {}) => {
    if (!startDate || !endDate) {
      throw new Error('Data de início e fim são obrigatórias')
    }

    const payload = {
      start: startDate,
      end: endDate,
      ...filtrosExtras
    }

    const response = await axios.post<DadosFieldZiger>(
      `${BASE_URL}/getChamadosFieldZigger`,
      payload,
      { headers: getAuthHeaders() }
    )

    return response.data
  },
}

const CLOUD_FUNCTIONS_BASE = 'https://southamerica-east1-zops-mobile.cloudfunctions.net'

// Mapeamento dos dealstages permitidos (todos os pipelines)
export const DEAL_STAGES = {
  // Pipeline Principal
  '161805109': 'Lista de Leads',
  '161805110': 'Prospecção',
  '161805111': 'Reunião Agendada',
  '1158259457': 'Reunião Realizada',
  '161805112': 'Proposta',
  '161805113': 'Negociação',
  '166220723': 'Ganho',
  '161805114': 'Contrato Assinado',
  '161805115': 'Negócio Perdido',
  // Pipeline Secundário
  '154833686': 'Lista de Leads',
  '154833687': 'Prospecção',
  'appointmentscheduled': 'Reunião Realizada',
  'decisionmakerboughtin': 'Proposta',
  'contractsent': 'Negociação',
  '139227492': 'Formalização',
  'closedwon': 'Contrato Assinado',
  'closedlost': 'Negócio Perdido',
  // Pipeline Terceiro
  '140001402': 'Lista de Leads',
  '140001403': 'Cadência de Prospecção',
  '140001404': 'Conectado',
  '159975702': 'Qualificado',
  '140001405': 'Reunião Agendada',
  '256800043': 'Reunião Realizada',
  '159946839': 'Proposta',
  '159946840': 'Negociação',
  '159946841': 'Formalização',
  '159946842': 'Contrato Assinado',
  '140001408': 'Negócio Perdido',
  // Pipeline SDR
  '1145529615': 'Leads',
  '1145529616': 'Prospecção',
  '1145529618': 'Qualificado',
  '1145529619': 'Reunião Agendada',
  '1145320247': 'No-show',
  '1145529620': 'Perdido',
  // Pipeline Enterprise 1
  '1108095583': 'Leads',
  '1108095584': 'Connect',
  '1108095585': 'Discovery',
  '1108095586': 'Deal Calculator',
  '1108095587': 'Under Negotiation',
  '1108095588': 'Commit',
  '1108095589': 'Deal Won',
  '1108226935': 'Deal Lost',
  // Pipeline Enterprise 2
  '249551971': 'Leads',
  '249551972': 'Connect',
  '249551973': 'Discovery',
  '249551974': 'Deal Calculator',
  '249551975': 'Under Negotiation',
  '249551976': 'Commit',
  '249551977': 'Deal Won',
  '249558235': 'Deal Lost',
  // Pipeline Enterprise 3
  '178237503': 'Leads',
  '178237504': 'Connect',
  '178237505': 'Discovery',
  '178237506': 'Deal Calculator',
  '178237507': 'Under Negotiation',
  '178237508': 'Commit',
  '179787258': 'Deal Won',
  '178237509': 'Deal Lost',
  // Pipeline Enterprise 4
  '1108065067': 'Leads',
  '1108065068': 'Connect',
  '1108065069': 'Discovery',
  '1108065070': 'Deal Calculator',
  '1108065071': 'Under Negotiation',
  '1108065072': 'Commit',
  '1108065073': 'Deal Won',
  '1108176156': 'Deal Lost',
  // Pipeline MX Venues/Events
  '760757291': 'MX Venues',
} as const

export type DealStageId = keyof typeof DEAL_STAGES
export type DealStageName = typeof DEAL_STAGES[DealStageId]

export interface HubspotDealEndereco {
  logradouro: string
  cep: string
  estado: string
  cidade: string
}

export interface HubspotDeal {
  id: string
  dealId: string
  dealname: string
  dealstage: string
  pipeline: string
  pipelineName: string
  createdAt: string | null
  nomeEmpresa: string
  cnpj: string
  endereco: HubspotDealEndereco
  placeId: string
}

// Mapeamento de Pipeline IDs do HubSpot
export const HUBSPOT_PIPELINES = {
  '86716801': 'Eventos',
  'default': 'Casas Field Sales',
  '72861815': 'Inside Sales',
  '782783146': 'SDR',
  '760035200': 'EUR Venues',
  '147326995': 'EUR Events',
  '97398362': 'MX Venues/Events',
  '760757291': 'MX Venues/Events',
  '153488669': 'Teste',
  '824388460': 'Inside Parcerias',
} as const

interface GetHubspotDealsResponse {
  ok: boolean
  total: number
  counts: Record<string, number>
  grouped: Record<string, HubspotDeal[]>
}

export interface HubspotProgressEvent {
  step: number
  label: string
  progress: number
}

export interface HubspotStreamCallbacks {
  onProgress?: (event: HubspotProgressEvent) => void
  onComplete?: (data: GetHubspotDealsResponse) => void
  onError?: (error: Error) => void
}

/**
 * Serviço para gerenciar dados do Hubspot via Cloud Function
 */
export const hubspotService = {
  /**
   * Busca deals já agrupados por stage (otimizado)
   * Usa a Cloud Function getHubspotDeals que já retorna dados filtrados e agrupados
   */
  async getDealsGrouped(): Promise<{ grouped: Record<string, HubspotDeal[]>; total: number; counts: Record<string, number> }> {
    try {
      console.log('Iniciando busca de deals do Hubspot...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 segundos

      const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/getHubspotDeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        throw new Error(`Erro ao buscar deals do Hubspot: ${response.status}`)
      }

      const result: GetHubspotDealsResponse = await response.json()

      if (!result.ok) {
        throw new Error('Falha ao carregar deals do Hubspot')
      }

      console.log('Hubspot response - total:', result.total, 'counts:', result.counts)

      return {
        grouped: result.grouped,
        total: result.total,
        counts: result.counts,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Timeout na requisição do Hubspot')
        throw new Error('Timeout ao carregar deals do Hubspot. Tente novamente.')
      }
      console.error('Erro ao listar deals do Hubspot:', error)
      throw new Error('Falha ao carregar deals do Hubspot')
    }
  },

  /**
   * Busca deals com progresso em tempo real via Server-Sent Events (SSE)
   * Retorna uma Promise que resolve com os dados e permite acompanhar o progresso
   */
  getDealsGroupedWithProgress(callbacks: HubspotStreamCallbacks): { promise: Promise<GetHubspotDealsResponse>; abort: () => void } {
    const url = `${CLOUD_FUNCTIONS_BASE}/getHubspotDealsStream`
    let eventSource: EventSource | null = null
    let aborted = false

    const promise = new Promise<GetHubspotDealsResponse>((resolve, reject) => {
      console.log('Iniciando busca de deals do Hubspot com SSE...')

      eventSource = new EventSource(url)

      const timeoutId = setTimeout(() => {
        if (eventSource) {
          eventSource.close()
          reject(new Error('Timeout ao carregar deals do Hubspot. Tente novamente.'))
        }
      }, 180000) // 3 minutos

      eventSource.addEventListener('progress', (event) => {
        if (aborted) return
        try {
          const data = JSON.parse(event.data) as HubspotProgressEvent
          console.log('SSE Progress:', data)
          callbacks.onProgress?.(data)
        } catch (e) {
          console.error('Erro ao parsear evento de progresso:', e)
        }
      })

      eventSource.addEventListener('complete', (event) => {
        clearTimeout(timeoutId)
        if (eventSource) eventSource.close()
        if (aborted) return

        try {
          const data = JSON.parse(event.data) as GetHubspotDealsResponse
          console.log('SSE Complete - total:', data.total)
          callbacks.onComplete?.(data)
          resolve(data)
        } catch (e) {
          console.error('Erro ao parsear evento complete:', e)
          reject(new Error('Erro ao processar resposta do servidor'))
        }
      })

      eventSource.addEventListener('error', (event) => {
        clearTimeout(timeoutId)
        if (eventSource) eventSource.close()
        if (aborted) return

        // Tenta extrair mensagem de erro se disponível
        let errorMessage = 'Falha ao carregar deals do Hubspot'
        if (event instanceof MessageEvent && event.data) {
          try {
            const errorData = JSON.parse(event.data)
            errorMessage = errorData.error || errorMessage
          } catch {
            // Ignora erro de parse
          }
        }

        const error = new Error(errorMessage)
        console.error('SSE Error:', error)
        callbacks.onError?.(error)
        reject(error)
      })

      eventSource.onerror = () => {
        clearTimeout(timeoutId)
        if (eventSource) eventSource.close()
        if (aborted) return

        const error = new Error('Conexão perdida com o servidor')
        callbacks.onError?.(error)
        reject(error)
      }
    })

    const abort = () => {
      aborted = true
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }

    return { promise, abort }
  },
}

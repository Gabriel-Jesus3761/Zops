import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud,
  Handshake,
  Trophy,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Link2,
  Search,
  SlidersHorizontal,
  Calculator,
  GitCommit,
  ChevronsUpDown,
  ChevronsDownUp,
  PartyPopper,
  Building2,
  Phone as PhoneIcon,
  UserPlus,
  Globe,
  MapPin,
  FlaskConical,
  Handshake as HandshakeIcon,
  Info,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { hubspotService, type HubspotDeal, type HubspotProgressEvent, HUBSPOT_PIPELINES, DEAL_STAGES } from '../services/hubspot.service'
import { Building, MapPin as MapPinIcon, Hash, Calendar, ExternalLink, Copy, Check } from 'lucide-react'

// Mapeamento de stage IDs para categorias unificadas
const STAGE_TO_UNIFIED: Record<string, string> = {
  // ========== LEADS ==========
  '161805109': 'leads',
  '154833686': 'leads',
  '140001402': 'leads',
  '1145529615': 'leads',
  '1108095583': 'leads',
  '249551971': 'leads',
  '178237503': 'leads',
  '1108065067': 'leads',

  // ========== CONNECT/PROSPECÇÃO ==========
  '161805110': 'connect',
  '154833687': 'connect',
  '140001403': 'connect',
  '140001404': 'connect',
  '1145529616': 'connect',
  '1108095584': 'connect',
  '249551972': 'connect',
  '178237504': 'connect',
  '1108065068': 'connect',

  // ========== DISCOVERY/QUALIFICADO ==========
  '161805111': 'discovery',
  '1158259457': 'discovery',
  'appointmentscheduled': 'discovery',
  '140001405': 'discovery',
  '256800043': 'discovery',
  '159975702': 'discovery',
  '1145529618': 'discovery',
  '1145529619': 'discovery',
  '1108095585': 'discovery',
  '249551973': 'discovery',
  '178237505': 'discovery',
  '1108065069': 'discovery',

  // ========== PROPOSAL/PROPOSTA ==========
  '161805112': 'proposal',
  'decisionmakerboughtin': 'proposal',
  '159946839': 'proposal',
  '1108095586': 'proposal',
  '249551974': 'proposal',
  '178237506': 'proposal',
  '1108065070': 'proposal',

  // ========== NEGOTIATION/NEGOCIAÇÃO ==========
  'contractsent': 'negotiation',
  '161805113': 'negotiation',
  '159946840': 'negotiation',
  '1108095587': 'negotiation',
  '249551975': 'negotiation',
  '178237507': 'negotiation',
  '1108065071': 'negotiation',

  // ========== COMMIT/FORMALIZAÇÃO ==========
  '139227492': 'commit',
  '159946841': 'commit',
  '1108095588': 'commit',
  '249551976': 'commit',
  '178237508': 'commit',
  '1108065072': 'commit',

  // ========== WON/GANHO ==========
  '166220723': 'won',
  '161805114': 'won',
  'closedwon': 'won',
  '159946842': 'won',
  '1108095589': 'won',
  '249551977': 'won',
  '179787258': 'won',
  '1108065073': 'won',

  // ========== LOST/PERDIDO ==========
  '161805115': 'lost',
  'closedlost': 'lost',
  '140001408': 'lost',
  '1145320247': 'lost',
  '1145529620': 'lost',
  '1108226935': 'lost',
  '249558235': 'lost',
  '178237509': 'lost',
  '1108176156': 'lost',

  // ========== MX VENUES/EVENTS ==========
  '760757291': 'leads', // MX Venues - ajuste a categoria se necessário
}

// Mapeamento de pipelines para ícones e cores
const PIPELINE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  'Eventos': { icon: PartyPopper, color: 'text-pink-600', bgColor: 'bg-pink-500/10' },
  'Casas Field Sales': { icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  'Inside Sales': { icon: PhoneIcon, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  'SDR': { icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
  'EUR Venues': { icon: Globe, color: 'text-indigo-600', bgColor: 'bg-indigo-500/10' },
  'EUR Events': { icon: PartyPopper, color: 'text-violet-600', bgColor: 'bg-violet-500/10' },
  'MX Venues/Events': { icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  'Teste': { icon: FlaskConical, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  'Inside Parcerias': { icon: HandshakeIcon, color: 'text-teal-600', bgColor: 'bg-teal-500/10' },
}

// Configuração das categorias unificadas
const UNIFIED_STAGE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  'leads': { icon: Users, color: 'text-slate-600', bgColor: 'bg-slate-500/10', label: 'Leads' },
  'connect': { icon: Link2, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Connect / Prospecção' },
  'discovery': { icon: Search, color: 'text-cyan-600', bgColor: 'bg-cyan-500/10', label: 'Discovery / Qualificado' },
  'proposal': { icon: Calculator, color: 'text-indigo-600', bgColor: 'bg-indigo-500/10', label: 'Proposta' },
  'negotiation': { icon: Handshake, color: 'text-orange-600', bgColor: 'bg-orange-500/10', label: 'Negociação' },
  'commit': { icon: GitCommit, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Commit / Formalização' },
  'won': { icon: Trophy, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Ganho' },
  'lost': { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Perdido' },
}

const HUBSPOT_LOADING_STEPS = [
  { label: 'Conectando com a API do HubSpot' },
  { label: 'Buscando pipelines e negócios' },
  { label: 'Classificando por estágios' },
  { label: 'Finalizando visualização' },
] as const

type HubspotAdvancedFilters = {
  pipelines: string[]
  categories: string[]
  dealName: string
  dealId: string
  companyName: string
  cnpj: string
  cep: string
  city: string
  state: string
  address: string
  placeId: string
  createdFrom: string
  createdTo: string
}

const createDefaultFilters = (): HubspotAdvancedFilters => ({
  pipelines: [],
  categories: [],
  dealName: '',
  dealId: '',
  companyName: '',
  cnpj: '',
  cep: '',
  city: '',
  state: '',
  address: '',
  placeId: '',
  createdFrom: '',
  createdTo: '',
})

export function HubspotPage() {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<HubspotDeal | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentStepLabel, setCurrentStepLabel] = useState<string>(HUBSPOT_LOADING_STEPS[0].label)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<HubspotAdvancedFilters>(createDefaultFilters)
  const [filterDraft, setFilterDraft] = useState<HubspotAdvancedFilters>(createDefaultFilters)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const handleProgress = (event: HubspotProgressEvent) => {
    setLoadingProgress(event.progress)
    setCurrentStepIndex(event.step)
    setCurrentStepLabel(event.label)
  }

  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['hubspot-deals'],
    queryFn: () => {
      // Reset progress state quando inicia nova busca
      setLoadingProgress(0)
      setCurrentStepIndex(0)
      setCurrentStepLabel(HUBSPOT_LOADING_STEPS[0].label)

      const { promise } = hubspotService.getDealsGroupedWithProgress({
        onProgress: handleProgress,
      })
      return promise
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return 'Sem atualização ainda'
    return new Date(dataUpdatedAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [dataUpdatedAt])

  // Limpa o progresso quando finaliza
  useEffect(() => {
    if (!isLoading && !isFetching) {
      const cleanupTimer = setTimeout(() => setLoadingProgress(0), 250)
      return () => clearTimeout(cleanupTimer)
    }
  }, [isLoading, isFetching])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (appliedFilters.pipelines.length > 0) count += 1
    if (appliedFilters.categories.length > 0) count += 1
    if (appliedFilters.dealName.trim()) count += 1
    if (appliedFilters.dealId.trim()) count += 1
    if (appliedFilters.companyName.trim()) count += 1
    if (appliedFilters.cnpj.trim()) count += 1
    if (appliedFilters.cep.trim()) count += 1
    if (appliedFilters.city.trim()) count += 1
    if (appliedFilters.state.trim()) count += 1
    if (appliedFilters.address.trim()) count += 1
    if (appliedFilters.placeId.trim()) count += 1
    if (appliedFilters.createdFrom.trim()) count += 1
    if (appliedFilters.createdTo.trim()) count += 1
    return count
  }, [appliedFilters])

  const hasAdvancedFilters = activeFiltersCount > 0

  const openFiltersModal = () => {
    setFilterDraft({
      ...appliedFilters,
      pipelines: [...appliedFilters.pipelines],
      categories: [...appliedFilters.categories],
    })
    setFiltersOpen(true)
  }

  const toggleDraftPipeline = (pipelineName: string) => {
    setFilterDraft(prev => ({
      ...prev,
      pipelines: prev.pipelines.includes(pipelineName)
        ? prev.pipelines.filter(name => name !== pipelineName)
        : [...prev.pipelines, pipelineName]
    }))
  }

  const toggleDraftCategory = (category: string) => {
    setFilterDraft(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(item => item !== category)
        : [...prev.categories, category]
    }))
  }

  const applyFilters = () => {
    setAppliedFilters({
      ...filterDraft,
      pipelines: [...filterDraft.pipelines],
      categories: [...filterDraft.categories],
    })
    setFiltersOpen(false)
  }

  const resetDraftFilters = () => {
    setFilterDraft(createDefaultFilters())
  }

  const clearAppliedFilters = () => {
    const reset = createDefaultFilters()
    setAppliedFilters(reset)
    setFilterDraft(reset)
  }

  const updateDraftField = (field: keyof HubspotAdvancedFilters, value: string) => {
    setFilterDraft(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Normaliza o nome do pipeline (converte ID para nome se necessário)
  const normalizePipelineName = (pipelineName: string | null | undefined): string => {
    if (!pipelineName) return ''
    if (pipelineName in HUBSPOT_PIPELINES) {
      return HUBSPOT_PIPELINES[pipelineName as keyof typeof HUBSPOT_PIPELINES]
    }
    return pipelineName
  }

  // Agrupa os deals por categoria unificada
  const unifiedGroupedDeals = useMemo(() => {
    if (!data?.grouped) return {}

    const unified: Record<string, HubspotDeal[]> = {}

    Object.entries(data.grouped).forEach(([stageId, deals]) => {
      const unifiedCategory = STAGE_TO_UNIFIED[stageId]
      if (unifiedCategory) {
        if (!unified[unifiedCategory]) {
          unified[unifiedCategory] = []
        }
        unified[unifiedCategory].push(...deals)
      }
    })

    return unified
  }, [data?.grouped])

  const pipelineOptions = useMemo(() => {
    const knownPipelines = Object.values(HUBSPOT_PIPELINES)
    const pipelinesFromDeals = Object.values(unifiedGroupedDeals)
      .flatMap(deals => deals.map(deal => normalizePipelineName(deal.pipelineName)))
      .filter(Boolean)

    return Array.from(new Set([...knownPipelines, ...pipelinesFromDeals]))
      .sort((a, b) => a.localeCompare(b))
  }, [unifiedGroupedDeals])

  // Filtra os deals por termo de busca
  const filteredGroupedDeals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const hasSearchTerm = normalizedSearch.length > 0
    const hasFilters = hasAdvancedFilters

    if (!hasSearchTerm && !hasFilters) return unifiedGroupedDeals

    const matchesText = (source: string | null | undefined, value: string) => {
      if (!value.trim()) return true
      return (source || '').toLowerCase().includes(value.trim().toLowerCase())
    }

    const createdFromTimestamp = appliedFilters.createdFrom
      ? new Date(`${appliedFilters.createdFrom}T00:00:00`).getTime()
      : null

    const createdToTimestamp = appliedFilters.createdTo
      ? new Date(`${appliedFilters.createdTo}T23:59:59.999`).getTime()
      : null

    const filtered: Record<string, HubspotDeal[]> = {}

    Object.entries(unifiedGroupedDeals).forEach(([category, deals]) => {
      const filteredDeals = deals.filter(deal => {
        if (hasSearchTerm && !matchesText(deal.dealname, normalizedSearch)) return false

        if (appliedFilters.pipelines.length > 0 && !appliedFilters.pipelines.includes(normalizePipelineName(deal.pipelineName))) return false

        const dealCategory = STAGE_TO_UNIFIED[deal.dealstage]
        if (appliedFilters.categories.length > 0 && (!dealCategory || !appliedFilters.categories.includes(dealCategory))) return false

        if (!matchesText(deal.dealname, appliedFilters.dealName)) return false
        if (!matchesText(deal.dealId, appliedFilters.dealId)) return false
        if (!matchesText(deal.nomeEmpresa, appliedFilters.companyName)) return false
        if (!matchesText(deal.cnpj, appliedFilters.cnpj)) return false
        if (!matchesText(deal.endereco?.cep, appliedFilters.cep)) return false
        if (!matchesText(deal.endereco?.cidade, appliedFilters.city)) return false
        if (!matchesText(deal.endereco?.estado, appliedFilters.state)) return false
        if (!matchesText(deal.endereco?.logradouro, appliedFilters.address)) return false
        if (!matchesText(deal.placeId, appliedFilters.placeId)) return false

        if (createdFromTimestamp !== null || createdToTimestamp !== null) {
          if (!deal.createdAt) return false
          const createdTimestamp = new Date(deal.createdAt).getTime()
          if (Number.isNaN(createdTimestamp)) return false
          if (createdFromTimestamp !== null && createdTimestamp < createdFromTimestamp) return false
          if (createdToTimestamp !== null && createdTimestamp > createdToTimestamp) return false
        }

        return true
      })

      if (filteredDeals.length > 0) {
        filtered[category] = filteredDeals
      }
    })

    return filtered
  }, [unifiedGroupedDeals, searchTerm, appliedFilters, hasAdvancedFilters])

  // Calcula os counts por categoria unificada (baseado nos deals filtrados)
  const unifiedCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    Object.entries(filteredGroupedDeals).forEach(([category, deals]) => {
      counts[category] = deals.length
    })

    return counts
  }, [filteredGroupedDeals])

  const getVisibleCount = (category: string) => visibleCounts[category] || 20

  const loadMore = (category: string) => {
    setVisibleCounts(prev => ({
      ...prev,
      [category]: (prev[category] || 20) + 20
    }))
  }

  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const isExpanded = (category: string) => expandedGroups[category] ?? false

  const allExpanded = Object.keys(UNIFIED_STAGE_CONFIG).every(category => isExpanded(category))

  const toggleAllGroups = () => {
    const newExpandedState = !allExpanded
    const newExpandedGroups: Record<string, boolean> = {}
    Object.keys(UNIFIED_STAGE_CONFIG).forEach(category => {
      newExpandedGroups[category] = newExpandedState
    })
    setExpandedGroups(newExpandedGroups)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl bg-card border border-border shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Integração
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                  HubSpot
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Visualize os negócios do HubSpot CRM por status.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Modal de Legenda dos Pipelines */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Legenda
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Legenda de Pipelines
                    </DialogTitle>
                    <DialogDescription>
                      Identificação visual dos pipelines do HubSpot CRM.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {Object.entries(PIPELINE_CONFIG).map(([name, config]) => {
                      const Icon = config.icon
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn("p-1.5 rounded-md shrink-0", config.bgColor)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllGroups}
                className="shrink-0"
              >
                {allExpanded ? (
                  <>
                    <ChevronsUpDown className="h-4 w-4 mr-2" />
                    Recolher Todos
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="h-4 w-4 mr-2" />
                    Expandir Todos
                  </>
                )}
              </Button>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="shrink-0"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
                      Atualizar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Última atualização: {lastUpdatedLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome do negócio..."
                  value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(searchInput)
                  }
                }}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('')
                    setSearchTerm('')
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={openFiltersModal}
              className="shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {hasAdvancedFilters && (
              <Button
                variant="ghost"
                onClick={clearAppliedFilters}
                className="shrink-0"
              >
                Limpar filtros
              </Button>
            )}
            <Button
              onClick={() => setSearchTerm(searchInput)}
              className="shrink-0"
            >
              <Search className="h-4 w-4 mr-2" />
              Pesquisar
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={filtersOpen}
        onOpenChange={(open) => {
          setFiltersOpen(open)
          if (open) {
            setFilterDraft({
              ...appliedFilters,
              pipelines: [...appliedFilters.pipelines],
              categories: [...appliedFilters.categories],
            })
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filtros avançados
            </DialogTitle>
            <DialogDescription>
              Filtre por pipeline, status e campos do negócio, empresa e endereço.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Pipelines</p>
              <div className="flex flex-wrap gap-2">
                {pipelineOptions.map((pipelineName) => {
                  const selected = filterDraft.pipelines.includes(pipelineName)
                  return (
                    <Button
                      key={pipelineName}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleDraftPipeline(pipelineName)}
                    >
                      {pipelineName}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Categorias de status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(UNIFIED_STAGE_CONFIG).map(([category, config]) => {
                  const selected = filterDraft.categories.includes(category)
                  return (
                    <Button
                      key={category}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleDraftCategory(category)}
                    >
                      {config.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome do negócio</label>
                <Input value={filterDraft.dealName} onChange={(e) => updateDraftField('dealName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ID do Deal</label>
                <Input value={filterDraft.dealId} onChange={(e) => updateDraftField('dealId', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                <Input value={filterDraft.companyName} onChange={(e) => updateDraftField('companyName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
                <Input value={filterDraft.cnpj} onChange={(e) => updateDraftField('cnpj', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">CEP</label>
                <Input value={filterDraft.cep} onChange={(e) => updateDraftField('cep', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                <Input value={filterDraft.city} onChange={(e) => updateDraftField('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Input value={filterDraft.state} onChange={(e) => updateDraftField('state', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Endereço</label>
                <Input value={filterDraft.address} onChange={(e) => updateDraftField('address', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Place ID</label>
                <Input value={filterDraft.placeId} onChange={(e) => updateDraftField('placeId', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Criado a partir de</label>
                <Input type="date" value={filterDraft.createdFrom} onChange={(e) => updateDraftField('createdFrom', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Criado até</label>
                <Input type="date" value={filterDraft.createdTo} onChange={(e) => updateDraftField('createdTo', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={resetDraftFilters}>
                Limpar
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-xl bg-card border border-border shadow-sm p-6 sm:p-8">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    Sincronizando dados do HubSpot
                  </p>
                  <span className="text-xs font-medium text-primary">{loadingProgress}%</span>
                </div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {currentStepLabel}
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <div className="space-y-2">
              {HUBSPOT_LOADING_STEPS.map((step, index) => {
                const status =
                  index < currentStepIndex
                    ? 'done'
                    : index === currentStepIndex
                      ? 'current'
                      : 'pending'

                return (
                  <div
                    key={step.label}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm transition-colors',
                      status === 'done' && 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
                      status === 'current' && 'border-primary/40 bg-primary/5 text-foreground',
                      status === 'pending' && 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {status === 'done' ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : status === 'current' ? (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
                    )}
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Listas por Status - Layout Hierárquico */}
      {!isLoading && filteredGroupedDeals && (
        <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
          {Object.keys(UNIFIED_STAGE_CONFIG).map((category, index) => {
            const config = UNIFIED_STAGE_CONFIG[category]
            const Icon = config.icon
            const allCategoryDeals = filteredGroupedDeals[category] || []
            const visibleLimit = getVisibleCount(category)
            const categoryDeals = allCategoryDeals.slice(0, visibleLimit)
            const totalCount = unifiedCounts[category] || 0
            const hasMore = allCategoryDeals.length > visibleLimit
            const expanded = isExpanded(category)

            // Pula categorias sem deals
            if (totalCount === 0) return null

            return (
              <div key={category}>
                {/* Separador entre grupos */}
                {index > 0 && <div className="border-t border-border" />}

                {/* Header do Grupo - Clicável para expandir/colapsar */}
                <div
                  onClick={() => toggleGroup(category)}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  {/* Ícone de Expandir/Colapsar */}
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                      expanded && "rotate-90"
                    )}
                  />

                  {/* Ícone do Status */}
                  <div className={cn("p-1.5 rounded-lg shrink-0", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>

                  {/* Label do Status */}
                  <span className="font-semibold text-foreground">{config.label}</span>

                  {/* Badge com Count */}
                  <Badge
                    variant="secondary"
                    className={cn("ml-auto shrink-0", config.bgColor, config.color)}
                  >
                    {totalCount}
                  </Badge>
                </div>

                {/* Lista de Deals (quando expandido) */}
                {expanded && (
                  <div className="bg-muted/20">
                    {categoryDeals.length === 0 ? (
                      <div className="flex items-center gap-3 px-3 py-6 text-sm text-muted-foreground justify-center">
                        <Icon className={cn("h-4 w-4", config.color, "opacity-50")} />
                        Nenhum negócio nesta categoria
                      </div>
                    ) : (
                      <>
                        {categoryDeals.map((deal: HubspotDeal, dealIndex: number) => {
                          const normalizedPipeline = normalizePipelineName(deal.pipelineName)
                          const pipelineConfig = normalizedPipeline ? PIPELINE_CONFIG[normalizedPipeline] : null
                          const PipelineIcon = pipelineConfig?.icon

                          return (
                            <div
                              key={deal.id}
                              onClick={() => setSelectedDeal(deal)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors border-l-2 border-transparent hover:border-l-2 ml-11 cursor-pointer",
                                dealIndex % 2 === 0 ? "bg-card" : "bg-muted/50"
                              )}
                              style={{
                                borderLeftColor: expanded ? undefined : 'transparent'
                              }}
                            >
                              {/* Indicador de status (bolinha) */}
                              <div className={cn("w-2 h-2 rounded-full shrink-0", config.color.replace('text-', 'bg-'))} />

                              {/* Nome do Deal */}
                              <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                                {deal.dealname || 'Sem nome'}
                              </span>

                              {/* Pipeline Icon com Tooltip */}
                              {normalizedPipeline && pipelineConfig && PipelineIcon && (
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={cn("p-1.5 rounded-md shrink-0 cursor-help", pipelineConfig.bgColor)}>
                                        <PipelineIcon className={cn("h-3.5 w-3.5", pipelineConfig.color)} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs font-medium">{normalizedPipeline}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )
                        })}

                        {/* Botão Carregar Mais */}
                        {hasMore && (
                          <div className="px-3 py-2 ml-11">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                loadMore(category)
                              }}
                              className="w-full text-xs justify-start"
                            >
                              <ChevronDown className="h-3 w-3 mr-2" />
                              Carregar mais {allCategoryDeals.length - visibleLimit} negócios
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes do Deal */}
      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDeal && (() => {
            const normalizedPipeline = normalizePipelineName(selectedDeal.pipelineName)
            const pipelineConfig = normalizedPipeline ? PIPELINE_CONFIG[normalizedPipeline] : null
            const PipelineIcon = pipelineConfig?.icon
            const stageConfig = STAGE_TO_UNIFIED[selectedDeal.dealstage]
            const unifiedConfig = stageConfig ? UNIFIED_STAGE_CONFIG[stageConfig] : null
            const StageIcon = unifiedConfig?.icon

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 pr-8">
                    {StageIcon && (
                      <div className={cn("p-2 rounded-lg shrink-0", unifiedConfig?.bgColor)}>
                        <StageIcon className={cn("h-5 w-5", unifiedConfig?.color)} />
                      </div>
                    )}
                    <span className="truncate">{selectedDeal.dealname || 'Negócio sem nome'}</span>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2">
                    {PipelineIcon && pipelineConfig && (
                      <span className={cn("inline-flex p-1 rounded shrink-0", pipelineConfig.bgColor)}>
                        <PipelineIcon className={cn("h-3.5 w-3.5", pipelineConfig.color)} />
                      </span>
                    )}
                    <span>{normalizedPipeline || 'Pipeline desconhecido'}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{unifiedConfig?.label || DEAL_STAGES[selectedDeal.dealstage as keyof typeof DEAL_STAGES] || selectedDeal.dealstage}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* IDs */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Identificação
                    </h4>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground">ID do Deal (HubSpot)</p>
                        <p className="text-sm font-medium">{selectedDeal.dealId || '-'}</p>
                      </div>
                      {selectedDeal.dealId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(selectedDeal.dealId, 'dealId')}
                        >
                          {copiedField === 'dealId' ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Empresa
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-xs text-muted-foreground">Nome da Empresa</p>
                          <p className="text-sm font-medium">{selectedDeal.nomeEmpresa || '-'}</p>
                        </div>
                        {selectedDeal.nomeEmpresa && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(selectedDeal.nomeEmpresa, 'nomeEmpresa')}
                          >
                            {copiedField === 'nomeEmpresa' ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-xs text-muted-foreground">CNPJ</p>
                          <p className="text-sm font-medium font-mono">{selectedDeal.cnpj || '-'}</p>
                        </div>
                        {selectedDeal.cnpj && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(selectedDeal.cnpj, 'cnpj')}
                          >
                            {copiedField === 'cnpj' ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      Endereço
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                      {selectedDeal.endereco?.logradouro && (
                        <p className="text-sm">{selectedDeal.endereco.logradouro}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {selectedDeal.endereco?.cidade && (
                          <span>{selectedDeal.endereco.cidade}</span>
                        )}
                        {selectedDeal.endereco?.estado && (
                          <span>{selectedDeal.endereco.estado}</span>
                        )}
                        {selectedDeal.endereco?.cep && (
                          <span className="font-mono">{selectedDeal.endereco.cep}</span>
                        )}
                      </div>
                      {!selectedDeal.endereco?.logradouro && !selectedDeal.endereco?.cidade && (
                        <p className="text-sm text-muted-foreground">Endereço não informado</p>
                      )}
                    </div>
                    {selectedDeal.placeId && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-xs text-muted-foreground">Place ID</p>
                          <p className="text-sm font-medium font-mono truncate max-w-[280px]">{selectedDeal.placeId}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(selectedDeal.placeId, 'placeId')}
                        >
                          {copiedField === 'placeId' ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Datas */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Criado em</p>
                      <p className="text-sm font-medium">{formatDate(selectedDeal.createdAt)}</p>
                    </div>
                  </div>

                  {/* Link para HubSpot */}
                  {selectedDeal.dealId && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <a
                          href={`https://app.hubspot.com/contacts/44029088/record/0-3/${selectedDeal.dealId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir no HubSpot
                        </a>
                      </Button>
                    </div>
                  )}

                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}


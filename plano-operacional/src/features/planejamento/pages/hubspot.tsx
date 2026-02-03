import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud,
  FileText,
  Handshake,
  Trophy,
  FileCheck,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Link2,
  Search,
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
import { hubspotService, type HubspotDeal, HUBSPOT_PIPELINES, DEAL_STAGES } from '../services/hubspot.service'
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

export function HubspotPage() {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<HubspotDeal | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

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

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['hubspot-deals'],
    queryFn: () => hubspotService.getDealsGrouped(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

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

  // Filtra os deals por termo de busca
  const filteredGroupedDeals = useMemo(() => {
    if (!searchTerm.trim()) return unifiedGroupedDeals

    const filtered: Record<string, HubspotDeal[]> = {}

    Object.entries(unifiedGroupedDeals).forEach(([category, deals]) => {
      const filteredDeals = deals.filter(deal =>
        deal.dealname?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filteredDeals.length > 0) {
        filtered[category] = filteredDeals
      }
    })

    return filtered
  }, [unifiedGroupedDeals, searchTerm])

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

  const isExpanded = (category: string) => expandedGroups[category] ?? true

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
                  Hubspot
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Visualize os deals do Hubspot CRM por status
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
                      Identificação visual dos pipelines do Hubspot CRM
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
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome do deal..."
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
              onClick={() => setSearchTerm(searchInput)}
              className="shrink-0"
            >
              <Search className="h-4 w-4 mr-2" />
              Pesquisar
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-xl bg-card border border-border shadow-sm p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Carregando deals do Hubspot...</p>
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
                        Nenhum deal nesta categoria
                      </div>
                    ) : (
                      <>
                        {categoryDeals.map((deal: HubspotDeal, dealIndex: number) => {
                          const pipelineConfig = deal.pipelineName ? PIPELINE_CONFIG[deal.pipelineName] : null
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
                              {deal.pipelineName && pipelineConfig && PipelineIcon && (
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={cn("p-1.5 rounded-md shrink-0 cursor-help", pipelineConfig.bgColor)}>
                                        <PipelineIcon className={cn("h-3.5 w-3.5", pipelineConfig.color)} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs font-medium">{deal.pipelineName}</p>
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
                              Carregar mais {allCategoryDeals.length - visibleLimit} deals
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
            const pipelineConfig = selectedDeal.pipelineName ? PIPELINE_CONFIG[selectedDeal.pipelineName] : null
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
                    <span className="truncate">{selectedDeal.dealname || 'Deal sem nome'}</span>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2">
                    {PipelineIcon && pipelineConfig && (
                      <div className={cn("p-1 rounded shrink-0", pipelineConfig.bgColor)}>
                        <PipelineIcon className={cn("h-3.5 w-3.5", pipelineConfig.color)} />
                      </div>
                    )}
                    <span>{selectedDeal.pipelineName || 'Pipeline desconhecido'}</span>
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
                        <p className="text-xs text-muted-foreground">Deal ID (HubSpot)</p>
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


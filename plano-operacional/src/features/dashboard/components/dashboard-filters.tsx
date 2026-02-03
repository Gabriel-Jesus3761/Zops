import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Filter, RefreshCw, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface DateFilter {
  type: '7d' | '15d' | '30d' | '90d' | 'custom'
  startDate?: string
  endDate?: string
}

export interface AdvancedFilters {
  nomeEvento?: string
  osId?: string
  temEquipeTecnica?: boolean | null
  eventoRecorrente?: string
  tipoEvento?: string
  statusNegociacao?: string
  plannerResponsavel?: string
}

interface DashboardFiltersProps {
  onFilterChange: (dateFilter: DateFilter, advancedFilters: AdvancedFilters) => void
  isLoading?: boolean
}

const calcularDatas = (filtro: DateFilter['type']): { startDate: string; endDate: string } => {
  const hoje = new Date()
  const endDate = hoje.toISOString().split('T')[0]

  let diasAtras: number
  switch (filtro) {
    case '7d':
      diasAtras = 6 // 7 dias incluindo hoje
      break
    case '15d':
      diasAtras = 14 // 15 dias incluindo hoje
      break
    case '30d':
      diasAtras = 29 // 30 dias incluindo hoje
      break
    case '90d':
      diasAtras = 89 // 90 dias incluindo hoje
      break
    default:
      diasAtras = 6
  }

  const dataInicio = new Date(hoje)
  dataInicio.setDate(dataInicio.getDate() - diasAtras)
  const startDate = dataInicio.toISOString().split('T')[0]

  return { startDate, endDate }
}

export function DashboardFilters({ onFilterChange, isLoading = false }: DashboardFiltersProps) {
  const { t } = useTranslation()
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: '30d' })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({})
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const handleDateFilterChange = (value: DateFilter['type']) => {
    let newDateFilter: DateFilter
    if (value === 'custom') {
      newDateFilter = {
        type: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
      }
    } else {
      const { startDate, endDate } = calcularDatas(value)
      newDateFilter = { type: value, startDate, endDate }
    }
    setDateFilter(newDateFilter)
    onFilterChange(newDateFilter, advancedFilters)
  }

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const newDateFilter: DateFilter = {
        type: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
      }
      setDateFilter(newDateFilter)
      onFilterChange(newDateFilter, advancedFilters)
    }
  }

  const handleAdvancedFilterChange = (key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...advancedFilters, [key]: value }
    setAdvancedFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilterChange(dateFilter, advancedFilters)
  }

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({})
    setCustomStartDate('')
    setCustomEndDate('')
    const { startDate, endDate } = calcularDatas(dateFilter.type === 'custom' ? '30d' : dateFilter.type)
    const newDateFilter: DateFilter = { type: dateFilter.type === 'custom' ? '30d' : dateFilter.type, startDate, endDate }
    setDateFilter(newDateFilter)
    onFilterChange(newDateFilter, {})
  }

  const hasActiveFilters = Object.values(advancedFilters).some(v => v !== undefined && v !== '' && v !== null && v !== 'all')

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* Filtros Principais */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={dateFilter.type === 'custom' && customStartDate ? 'custom' : dateFilter.type}
            onValueChange={handleDateFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.period')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('filters.last7Days')}</SelectItem>
              <SelectItem value="15d">{t('filters.last15Days')}</SelectItem>
              <SelectItem value="30d">{t('filters.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('filters.last90Days')}</SelectItem>
              <SelectItem value="custom">{t('filters.customPeriod')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={showAdvancedFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t('filters.advancedFilters')}
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.values(advancedFilters).filter(v => v !== undefined && v !== '' && v !== null && v !== 'all').length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyFilters}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t('filters.update')}
        </Button>

        {(hasActiveFilters || dateFilter.type === 'custom') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAdvancedFilters}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      {/* Período Customizado */}
      {dateFilter.type === 'custom' && (
        <div className="grid gap-4 rounded-lg border border-border bg-muted/50 p-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('filters.startDate')}</Label>
            <Input
              id="startDate"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('filters.endDate')}</Label>
            <Input
              id="endDate"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleCustomDateChange}
              disabled={!customStartDate || !customEndDate}
              className="w-full"
            >
              {t('filters.applyDates')}
            </Button>
          </div>
        </div>
      )}

      {/* Filtros Avançados */}
      {showAdvancedFilters && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
          <h3 className="font-semibold text-foreground">{t('filters.advancedFilters')}</h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="nomeEvento">{t('filters.eventName')}</Label>
              <Input
                id="nomeEvento"
                placeholder={t('filters.eventNamePlaceholder')}
                value={advancedFilters.nomeEvento || ''}
                onChange={(e) => handleAdvancedFilterChange('nomeEvento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="osId">{t('filters.osNumber')}</Label>
              <Input
                id="osId"
                placeholder={t('filters.osNumberPlaceholder')}
                value={advancedFilters.osId || ''}
                onChange={(e) => handleAdvancedFilterChange('osId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temEquipeTecnica">{t('filters.technicalTeam')}</Label>
              <Select
                value={
                  advancedFilters.temEquipeTecnica === null || advancedFilters.temEquipeTecnica === undefined
                    ? 'all'
                    : advancedFilters.temEquipeTecnica.toString()
                }
                onValueChange={(value) =>
                  handleAdvancedFilterChange('temEquipeTecnica', value === 'all' ? null : value === 'true')
                }
              >
                <SelectTrigger id="temEquipeTecnica">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="true">{t('filters.withTechnicalTeam')}</SelectItem>
                  <SelectItem value="false">{t('filters.withoutTechnicalTeam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventoRecorrente">{t('filters.recurringEvent')}</Label>
              <Select
                value={advancedFilters.eventoRecorrente || 'all'}
                onValueChange={(value) => handleAdvancedFilterChange('eventoRecorrente', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="eventoRecorrente">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="Sim">{t('common.yes')}</SelectItem>
                  <SelectItem value="Não">{t('common.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoEvento">{t('filters.eventType')}</Label>
              <Select
                value={advancedFilters.tipoEvento || 'all'}
                onValueChange={(value) => handleAdvancedFilterChange('tipoEvento', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="tipoEvento">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="Evento">{t('filters.event')}</SelectItem>
                  <SelectItem value="Casa">{t('filters.house')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusNegociacao">{t('filters.negotiationStatus')}</Label>
              <Select
                value={advancedFilters.statusNegociacao || 'all'}
                onValueChange={(value) => handleAdvancedFilterChange('statusNegociacao', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="statusNegociacao">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="Lista de Leads">{t('filters.status.leadList')}</SelectItem>
                  <SelectItem value="Prospecção">{t('filters.status.prospecting')}</SelectItem>
                  <SelectItem value="Reunião Agendada">{t('filters.status.scheduledMeeting')}</SelectItem>
                  <SelectItem value="Aguardando">{t('filters.status.waiting')}</SelectItem>
                  <SelectItem value="Proposta">{t('filters.status.proposal')}</SelectItem>
                  <SelectItem value="Negociação">{t('filters.status.negotiation')}</SelectItem>
                  <SelectItem value="Formalização">{t('filters.status.formalization')}</SelectItem>
                  <SelectItem value="Contrato Assinado">{t('filters.status.signedContract')}</SelectItem>
                  <SelectItem value="Ganho">{t('filters.status.won')}</SelectItem>
                  <SelectItem value="Fechado">{t('filters.status.closed')}</SelectItem>
                  <SelectItem value="Cancelado">{t('filters.status.cancelled')}</SelectItem>
                  <SelectItem value="Negócio Perdido">{t('filters.status.lostBusiness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plannerResponsavel">{t('filters.responsiblePlanner')}</Label>
              <Input
                id="plannerResponsavel"
                placeholder={t('filters.plannerPlaceholder')}
                value={advancedFilters.plannerResponsavel || ''}
                onChange={(e) => handleAdvancedFilterChange('plannerResponsavel', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

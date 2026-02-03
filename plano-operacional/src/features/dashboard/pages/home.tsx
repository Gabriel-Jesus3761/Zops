import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import {
  ResumoEventosSection,
  ResumoCasasSection,
  ResumoECCSection,
  ResumoFieldZigerSection,
  ResumoReportTechSection,
  ResumoReportsInternoSection,
} from '../components'
import { DashboardFilters } from '../components/dashboard-filters'
import { FilterProvider, useFilters } from '../contexts/filter-context'
import { ChartFilterProvider, useChartFilters } from '../contexts/chart-filter-context'

function DashboardContent() {
  const { t } = useTranslation()
  const { dateFilter, advancedFilters, setFilters } = useFilters()
  const { interactiveMode, setInteractiveMode, activeFiltersCount, clearChartFilters } = useChartFilters()

  // Preparar filtros extras para os hooks
  const filtrosExtras: Record<string, any> = {}
  if (advancedFilters.nomeEvento) filtrosExtras.nomeEvento = advancedFilters.nomeEvento
  if (advancedFilters.osId) filtrosExtras.osId = advancedFilters.osId
  if (advancedFilters.temEquipeTecnica !== null && advancedFilters.temEquipeTecnica !== undefined) {
    filtrosExtras.temEquipeTecnica = advancedFilters.temEquipeTecnica
  }
  if (advancedFilters.eventoRecorrente) filtrosExtras.eventoRecorrente = advancedFilters.eventoRecorrente
  if (advancedFilters.tipoEvento) filtrosExtras.tipoEvento = advancedFilters.tipoEvento
  if (advancedFilters.statusNegociacao) filtrosExtras.statusNegociacao = advancedFilters.statusNegociacao
  if (advancedFilters.plannerResponsavel) filtrosExtras.plannerResponsavel = advancedFilters.plannerResponsavel

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Filtros */}
      <DashboardFilters onFilterChange={setFilters} />

      {/* Controles do Modo Interativo */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {t('dashboard.chartFilters.active', { count: activeFiltersCount })}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChartFilters}
              disabled={activeFiltersCount === 0}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t('dashboard.clearChartFilters')}
              {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('dashboard.interactiveMode')}</span>
              <Switch
                checked={interactiveMode}
                onCheckedChange={setInteractiveMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="resumo">{t('dashboard.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="field-ziger">{t('dashboard.tabs.fieldZiger')}</TabsTrigger>
          <TabsTrigger value="ecc">{t('dashboard.tabs.ecc')}</TabsTrigger>
          <TabsTrigger value="report-tech">{t('dashboard.tabs.reportTech')}</TabsTrigger>
          <TabsTrigger value="reports-interno">{t('dashboard.tabs.internalReports')}</TabsTrigger>
        </TabsList>

        {/* TAB: Resumo (Eventos + Casas) - DADOS REAIS */}
        <TabsContent value="resumo" className="space-y-8">
          <ResumoEventosSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            filtrosExtras={filtrosExtras}
          />
          <ResumoCasasSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            filtrosExtras={filtrosExtras}
          />
        </TabsContent>

        {/* TAB: Field Ziger (Go Live) */}
        <TabsContent value="field-ziger" className="space-y-6">
          <ResumoFieldZigerSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            filtrosExtras={filtrosExtras}
          />
        </TabsContent>

        {/* TAB: ECC (WhatsApp) */}
        <TabsContent value="ecc" className="space-y-6">
          <ResumoECCSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            filtrosExtras={filtrosExtras}
          />
        </TabsContent>

        {/* TAB: Report Tech */}
        <TabsContent value="report-tech" className="space-y-6">
          <ResumoReportTechSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
          />
        </TabsContent>

        {/* TAB: Reports Interno */}
        <TabsContent value="reports-interno" className="space-y-6">
          <ResumoReportsInternoSection
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function DashboardHome() {
  return (
    <FilterProvider>
      <ChartFilterProvider>
        <DashboardContent />
      </ChartFilterProvider>
    </FilterProvider>
  )
}

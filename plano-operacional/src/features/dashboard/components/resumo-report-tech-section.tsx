import { Phone, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PieChart, BarChart, ProgressCard } from '@/components/charts'
import { useDadosReportTech } from '../hooks/use-raio-x-data'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  subtitle?: string
  color?: string
}

function StatCard({ title, value, icon, subtitle, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">{value}</h3>
          {subtitle && (
            <p className={`mt-2 text-xs ${color || 'text-muted-foreground'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="rounded-full bg-[#0050C3]/10 p-3 text-[#0050C3]">
          {icon}
        </div>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  Aberto: '#faad14',
  'Em andamento': '#1890ff',
  Resolvido: '#52c41a',
  Fechado: '#8c8c8c',
}

const PRIORIDADE_COLORS: Record<string, string> = {
  Baixa: '#52c41a',
  Média: '#1890ff',
  Alta: '#faad14',
  Crítica: '#ff4d4f',
}

const PRAZO_COLORS: Record<string, string> = {
  'Dentro do prazo': '#52c41a',
  'Próximo do prazo': '#faad14',
  'Fora do prazo': '#ff4d4f',
}

interface ResumoReportTechSectionProps {
  startDate?: string
  endDate?: string
}

export function ResumoReportTechSection({ startDate, endDate }: ResumoReportTechSectionProps = {}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useDadosReportTech(startDate, endDate)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0050C3]" />
        <span className="ml-2 text-muted-foreground">{t('reportTech.loading')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">
          {t('common.errorLoadingData')}: {error?.message || t('common.unknownError')}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t('common.noDataAvailable')}</p>
      </div>
    )
  }

  // Transformar dados para os gráficos
  const statusChart = (data.status || []).map((item) => ({
    name: item.status,
    value: item.quantidade,
    color: STATUS_COLORS[item.status] || '#8c8c8c',
  }))

  const prioridadeChart = (data.prioridade || []).map((item) => ({
    name: item.prioridade,
    value: item.quantidade,
    color: PRIORIDADE_COLORS[item.prioridade] || '#8c8c8c',
  }))

  const prazoChart = (data.prazo || []).map((item) => ({
    name: item.prazo,
    value: item.quantidade,
    color: PRAZO_COLORS[item.prazo] || '#8c8c8c',
  }))

  const produtoChart = (data.produto || [])
    .filter((item) => item.produto !== 'N/A')
    .slice(0, 8)
    .map((item) => ({
      name: item.produto,
      value: item.quantidade,
      color: '#1890ff',
    }))

  const taxonomiaProgress = (data.taxonomia || []).slice(0, 5).map((item) => ({
    label: item.taxonomia,
    value: item.quantidade,
    total: data.totalChamados,
  }))

  const triboProgress = (data.tribo || []).slice(0, 5).map((item) => ({
    label: item.tribo,
    value: item.quantidade,
    total: data.totalChamados,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-[#722ed1]" />
        <h2 className="text-2xl font-bold text-foreground">{t('reportTech.title')}</h2>
      </div>

      {/* Report Tech Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <StatCard
          title={t('reportTech.eventsWithTickets')}
          value={data.eventosComChamados.toString()}
          icon={<Phone className="h-6 w-6" />}
          subtitle={t('common.totalEvents')}
        />
        <StatCard
          title={t('reportTech.totalTickets')}
          value={data.totalChamados.toString()}
          icon={<AlertCircle className="h-6 w-6" />}
          subtitle={t('common.registeredTickets')}
        />
      </div>

      {/* Report Tech Charts - Status, Prioridade, Prazo */}
      <div className="grid gap-6 lg:grid-cols-3">
        {statusChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={statusChart}
              title={t('reportTech.byStatus')}
              showLegend={true}
            />
          </div>
        )}
        {prioridadeChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={prioridadeChart}
              title={t('reportTech.byPriority')}
              showLegend={true}
            />
          </div>
        )}
        {prazoChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={prazoChart}
              title={t('reportTech.byDeadline')}
              showLegend={true}
            />
          </div>
        )}
      </div>

      {/* Report Tech Charts - Produto */}
      {produtoChart.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <BarChart
            data={produtoChart}
            title={t('reportTech.byProduct')}
          />
        </div>
      )}

      {/* Report Tech Progress - Taxonomia e Tribo */}
      <div className="grid gap-6 lg:grid-cols-2">
        {taxonomiaProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title={t('reportTech.byTaxonomy')}
              items={taxonomiaProgress}
              maxVisible={5}
              showPercentage={true}
            />
          </div>
        )}
        {triboProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title={t('reportTech.byTribe')}
              items={triboProgress}
              maxVisible={5}
              showPercentage={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

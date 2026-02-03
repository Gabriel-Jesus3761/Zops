import { Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProgressCard } from '@/components/charts'
import { useDadosFieldZiger } from '../hooks/use-raio-x-data'

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

interface ResumoFieldZigerSectionProps {
  startDate?: string
  endDate?: string
  filtrosExtras?: Record<string, any>
}

export function ResumoFieldZigerSection({ startDate, endDate, filtrosExtras }: ResumoFieldZigerSectionProps = {}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useDadosFieldZiger(startDate, endDate, filtrosExtras)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0050C3]" />
        <span className="ml-2 text-muted-foreground">{t('fieldZiger.loading')}</span>
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

  // Formatar tempo médio de solução
  const tempoMedioFormatado = data.detalhes?.tempoSolucao?.medio?.horasMinutos ||
    (data.tempoMedioSolucao ? `${data.tempoMedioSolucao}` : '0h')

  // Transformar dados para o gráfico
  const categoriasProgress = (data.chamadosPorCategoria || []).map((item) => ({
    label: item.categoria || item.nome || 'Sem categoria',
    value: item.quantidade,
    total: data.totalChamados,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-[#fa8c16]" />
        <h2 className="text-2xl font-bold text-foreground">{t('fieldZiger.title')}</h2>
        <span className="rounded-full bg-[#F4A460] px-3 py-1 text-sm font-bold text-white">
          GOLIVE
        </span>
      </div>

      {/* Field Ziger Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title={t('fieldZiger.eventsWithTickets')}
          value={data.eventosComChamados.toString()}
          icon={<Phone className="h-6 w-6" />}
          subtitle={t('common.totalEvents')}
        />
        <StatCard
          title={t('fieldZiger.totalTickets')}
          value={data.totalChamados.toString()}
          icon={<AlertCircle className="h-6 w-6" />}
          subtitle={t('common.registeredTickets')}
        />
        <StatCard
          title={t('fieldZiger.averageSolutionTime')}
          value={tempoMedioFormatado}
          icon={<CheckCircle className="h-6 w-6" />}
          subtitle={t('fieldZiger.solutionTime')}
        />
      </div>

      {/* Field Ziger Charts */}
      {categoriasProgress.length > 0 && (
        <ProgressCard
          title={t('fieldZiger.byCategory')}
          items={categoriasProgress}
          maxVisible={5}
          showPercentage={true}
        />
      )}

      {/* Detalhes adicionais se disponíveis */}
      {data.detalhes && data.detalhes.tempoSolucao && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">{t('fieldZiger.timeStats')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t('fieldZiger.minTime')}</span>
              <span className="text-xl font-bold text-foreground">
                {data.detalhes.tempoSolucao.minimo?.horasMinutos || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t('fieldZiger.avgTime')}</span>
              <span className="text-xl font-bold text-foreground">
                {data.detalhes.tempoSolucao.medio?.horasMinutos || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t('fieldZiger.maxTime')}</span>
              <span className="text-xl font-bold text-foreground">
                {data.detalhes.tempoSolucao.maximo?.horasMinutos || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { Phone, AlertCircle, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PieChart, BarChart, ProgressCard } from '@/components/charts'
import { useDadosECC } from '../hooks/use-raio-x-data'

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

const PRODUTO_COLORS: Record<string, string> = {
  'PDV Standard': '#52c41a',
  'PDV Premium': '#1890ff',
  'Auto Atendimento': '#faad14',
  Outros: '#722ed1',
}

const SOLUCAO_COLORS: Record<string, string> = {
  Resolvido: '#52c41a',
  Pendente: '#faad14',
  'Em andamento': '#1890ff',
  Cancelado: '#ff4d4f',
}

const TAMANHO_COLORS: Record<string, string> = {
  PP: '#52c41a',
  P: '#1890ff',
  M: '#faad14',
  G: '#ff7a45',
  MEGA: '#f5222d',
}

interface ResumoECCSectionProps {
  startDate?: string
  endDate?: string
  filtrosExtras?: Record<string, any>
}

export function ResumoECCSection({ startDate, endDate, filtrosExtras }: ResumoECCSectionProps = {}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useDadosECC(startDate, endDate, filtrosExtras)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0050C3]" />
        <span className="ml-2 text-muted-foreground">{t('ecc.loading')}</span>
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

  // Transformar dados para os gráficos (filtrar N/A)
  const produtosChart = (data.chamadosPorProduto || [])
    .filter((item) => item.produto !== 'N/A')
    .map((item) => ({
      name: item.produto,
      value: item.quantidade,
      color: PRODUTO_COLORS[item.produto] || '#8c8c8c',
    }))

  const solucoesChart = (data.chamadosPorSolucao || []).map((item) => ({
    name: item.solucao,
    value: item.quantidade,
    color: SOLUCAO_COLORS[item.solucao] || '#8c8c8c',
  }))

  const tamanhosChart = (data.chamadosPorTamanhoEvento || []).map((item) => ({
    name: item.tamanho,
    value: item.quantidade,
    color: TAMANHO_COLORS[item.tamanho] || '#8c8c8c',
  }))

  const categoriasProgress = (data.chamadosPorCategoria || []).map((item) => ({
    label: item.categoria || item.nome || 'Sem categoria',
    value: item.quantidade,
    total: data.totalChamados,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-[#13c2c2]" />
        <h2 className="text-2xl font-bold text-foreground">{t('ecc.title')}</h2>
      </div>

      {/* ECC Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title={t('ecc.eventsWithTickets')}
          value={data.eventosComChamados.toString()}
          icon={<Phone className="h-6 w-6" />}
          subtitle={t('common.totalEvents')}
        />
        <StatCard
          title={t('ecc.totalTickets')}
          value={data.totalChamados.toString()}
          icon={<AlertCircle className="h-6 w-6" />}
          subtitle={t('common.registeredTickets')}
        />
        <StatCard
          title={t('ecc.avgFirstResponseTime')}
          value={data.tempoMedioPrimeiraResposta}
          icon={<Clock className="h-6 w-6" />}
          subtitle={t('ecc.responseTime')}
        />
        <StatCard
          title={t('ecc.avgSolutionTime')}
          value={data.tempoMedioSolucao}
          icon={<CheckCircle className="h-6 w-6" />}
          subtitle={t('ecc.solutionTime')}
        />
      </div>

      {/* ECC Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {tamanhosChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <BarChart
              data={tamanhosChart}
              title={t('ecc.bySize')}
            />
          </div>
        )}
        {produtosChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={produtosChart}
              title={t('ecc.byProduct')}
              showLegend={true}
            />
          </div>
        )}
        {solucoesChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={solucoesChart}
              title={t('ecc.bySolution')}
              showLegend={true}
            />
          </div>
        )}
      </div>

      {/* Categorias Progress */}
      {categoriasProgress.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <ProgressCard
            title={t('ecc.byCategory')}
            items={categoriasProgress}
            maxVisible={5}
            showPercentage={false}
          />
        </div>
      )}
    </div>
  )
}

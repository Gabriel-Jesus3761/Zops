import { Phone, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PieChart, BarChart, ProgressCard } from '@/components/charts'
import { useDadosReportsInterno } from '../hooks/use-raio-x-data'
import { getFilialColor } from '../utils/filial-colors'

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

const TAMANHO_COLORS: Record<string, string> = {
  PP: '#52c41a',
  P: '#1890ff',
  M: '#faad14',
  G: '#ff7a45',
  MEGA: '#f5222d',
  'Super MEGA': '#cf1322',
  'Não informado': '#8c8c8c',
}

const PRODUTO_COLORS: Record<string, string> = {
  'PDV Standard': '#52c41a',
  'PDV Premium': '#1890ff',
  'Auto Atendimento': '#faad14',
  Logistics: '#0050C3',
  Planning: '#0066F5',
  'Go Live': '#52c41a',
  ECC: '#faad14',
  Outros: '#722ed1',
  // Valores reais da API
  Z: '#0050C3',          // Azul
  N: '#52c41a',          // Verde
  'Não informado': '#8c8c8c',  // Cinza
}

const SOLUCAO_COLORS: Record<string, string> = {
  // Estados de solução
  Resolvido: '#52c41a',
  Pendente: '#faad14',
  'Em andamento': '#1890ff',
  Cancelado: '#ff4d4f',
  // Formas de pagamento (valores reais da API)
  'Ficha': '#52c41a',           // Verde
  'Cashless Pré': '#1890ff',    // Azul
  'New Cashless': '#722ed1',    // Roxo
  'Ficha, Cashless Pré': '#faad14', // Amarelo
  'Cashless Pós': '#eb2f96',    // Rosa
  'HIBRIDO': '#fa8c16',         // Laranja
}

const IMPACTO_COLORS: Record<string, string> = {
  Alto: '#ff4d4f',
  Médio: '#faad14',
  Baixo: '#52c41a',
  Nenhum: '#8c8c8c',
  // Valores reais da API
  zig: '#0050C3',        // Azul
  produtor: '#52c41a',   // Verde
  parceiro: '#722ed1',   // Roxo
}

// Paleta de cores para Subárea, Filial e Criador
const AREA_COLORS = [
  '#0050C3', // Azul
  '#52c41a', // Verde
  '#faad14', // Amarelo
  '#722ed1', // Roxo
  '#eb2f96', // Rosa
  '#fa8c16', // Laranja
  '#1890ff', // Azul claro
  '#f5222d', // Vermelho
  '#13c2c2', // Ciano
  '#a0d911', // Verde limão
]

interface ResumoReportsInternoSectionProps {
  startDate?: string
  endDate?: string
}

export function ResumoReportsInternoSection({ startDate, endDate }: ResumoReportsInternoSectionProps = {}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useDadosReportsInterno(startDate, endDate)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0050C3]" />
        <span className="ml-2 text-muted-foreground">{t('reportsInterno.loading')}</span>
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
  const impactoChart = (data.impactoCliente || [])
    .filter((item) => item && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((item) => ({
      name: item.impacto || t('common.notInformed'),
      value: item.quantidade,
      color: IMPACTO_COLORS[item.impacto || 'Nenhum'] || '#8c8c8c',
    }))

  const tamanhoChart = (data.chamadosPorTamanhoProjeto || [])
    .filter((item) => item && item.tamanho && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((item) => ({
      name: item.tamanho,
      value: item.quantidade,
      color: TAMANHO_COLORS[item.tamanho] || '#8c8c8c',
    }))

  const produtoChart = (data.chamadosPorProduto || [])
    .filter((item) => item && item.produto && item.produto !== 'N/A' && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((item) => ({
      name: item.produto,
      value: item.quantidade,
      color: PRODUTO_COLORS[item.produto] || '#8c8c8c',
    }))

  const solucaoProgress = (data.chamadosPorSolucao || [])
    .filter((item) => item && item.solucao && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((item) => ({
      label: item.solucao,
      value: item.quantidade,
      total: data.totalChamados,
      color: item.solucao !== t('common.notInformed') && item.solucao !== 'N/A'
        ? SOLUCAO_COLORS[item.solucao] || '#8c8c8c'
        : undefined,
    }))

  const subareaProgress = (data.chamadosPorSubarea || [])
    .filter((item) => item && item.subarea && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
    .map((item, index) => ({
      label: item.subarea,
      value: item.quantidade,
      total: data.totalChamados,
      color: item.subarea !== t('common.notInformed') ? AREA_COLORS[index % AREA_COLORS.length] : undefined,
    }))

  const filialProgress = (data.chamadosPorFilial || [])
    .filter((item) => item && item.filial && item.filial !== t('common.notInformed') && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
    .map((item) => ({
      label: item.filial,
      value: item.quantidade,
      total: data.totalChamados,
      color: getFilialColor(item.filial),
    }))

  const reportadoresProgress = (data.reportadores || [])
    .filter((item) => item && item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
    .map((item, index) => {
      const nome = item.reportador || item.nome || t('common.notInformed')
      return {
        label: nome,
        value: item.quantidade,
        total: data.totalChamados,
        color: nome !== t('common.notInformed') ? AREA_COLORS[index % AREA_COLORS.length] : undefined,
      }
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-[#eb2f96]" />
        <h2 className="text-2xl font-bold text-foreground">Reports Interno</h2>
      </div>

      {/* Reports Interno Stats - Linha 1: 3 cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Eventos com Chamados"
          value={data.eventosComChamados.toString()}
          icon={<Phone className="h-6 w-6" />}
          subtitle="Total de eventos"
        />
        <StatCard
          title="Total de Chamados"
          value={data.totalChamados.toString()}
          icon={<AlertCircle className="h-6 w-6" />}
          subtitle="Chamados registrados"
        />
        {impactoChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={impactoChart}
              title="Impacto"
              showLegend={true}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Reports Interno Charts - Linha 2: Tamanho, Produto, Solução */}
      <div className="grid gap-6 lg:grid-cols-3">
        {tamanhoChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <BarChart
              data={tamanhoChart}
              title="Tamanho"
            />
          </div>
        )}
        {produtoChart.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <PieChart
              data={produtoChart}
              title="Produto"
              showLegend={true}
            />
          </div>
        )}
        {solucaoProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title="Solução"
              items={solucaoProgress}
              maxVisible={6}
              showPercentage={true}
            />
          </div>
        )}
      </div>

      {/* Reports Interno Progress - Linha 3: Subárea, Filial, Criador */}
      <div className="grid gap-6 lg:grid-cols-3">
        {subareaProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title="Subárea"
              items={subareaProgress}
              maxVisible={5}
              showPercentage={true}
            />
          </div>
        )}
        {filialProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title="Filial"
              items={filialProgress}
              maxVisible={5}
              showPercentage={true}
            />
          </div>
        )}
        {reportadoresProgress.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <ProgressCard
              title="Criador"
              items={reportadoresProgress}
              maxVisible={5}
              showPercentage={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

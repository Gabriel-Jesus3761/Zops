import React from 'react'
import { useTranslation } from 'react-i18next'
import { Home as HomeIcon, Laptop, UserCheck, Loader2, MousePointer2 } from 'lucide-react'
import { PieChart, BarChart, ProgressCard } from '@/components/charts'
import { useDadosCasas } from '../hooks/use-raio-x-data'
import { useChartFilters } from '../contexts/chart-filter-context'
import { Badge } from '@/components/ui/badge'
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

const COLORS = {
  PP: '#52c41a',
  P: '#1890ff',
  M: '#faad14',
  G: '#ff7a45',
  MEGA: '#f5222d',
}

const PRODUTO_COLORS: Record<string, string> = {
  'PDV Standard': '#52c41a',
  'PDV Premium': '#1890ff',
  'Auto Atendimento': '#faad14',
  Outros: '#722ed1',
}

interface ResumoCasasSectionProps {
  startDate?: string
  endDate?: string
  filtrosExtras?: Record<string, any>
}

export function ResumoCasasSection({ startDate, endDate, filtrosExtras }: ResumoCasasSectionProps = {}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useDadosCasas(startDate, endDate, filtrosExtras)
  const { interactiveMode, chartFilters, setChartFilter } = useChartFilters()

  // Aplicar filtros cruzados de gráficos aos dados
  const filteredData = React.useMemo(() => {
    // Se não há dados, retorna undefined
    if (!data) {
      return undefined
    }

    // Se não há filtros de gráfico ativos, retorna dados originais
    const produtoFilter = chartFilters['casas-produto']
    const tamanhoFilter = chartFilters['casas-tamanho']
    const filialFilter = chartFilters['casas-filial']

    if (!produtoFilter && !tamanhoFilter && !filialFilter) {
      return data
    }

    // Filtrar dados com base nos filtros de gráfico ativos
    let filteredProdutos = data.casasPorProduto
    let filteredTamanhos = data.casasPorTamanho
    let filteredFiliais = data.casasPorFilial
    let totalCasas = data.totalCasas
    let totalTerminais = data.totalTerminais
    let totalTecnicos = data.totalTecnicos

    // Se há filtro de produto ativo
    if (produtoFilter) {
      filteredProdutos = filteredProdutos.filter(p => p.produto === produtoFilter)
      // Recalcular os outros gráficos baseado no filtro de produto
      const casasProduto = filteredProdutos.reduce((acc, p) => acc + p.quantidade, 0)
      const proporcao = casasProduto > 0 ? casasProduto / data.totalCasas : 0

      filteredTamanhos = filteredTamanhos.map(t => ({
        ...t,
        quantidade: Math.round(t.quantidade * proporcao)
      }))

      filteredFiliais = filteredFiliais.map(f => ({
        ...f,
        quantidade: Math.round(f.quantidade * proporcao)
      }))

      totalCasas = casasProduto
      totalTerminais = Math.round(data.totalTerminais * proporcao)
      totalTecnicos = Math.round(data.totalTecnicos * proporcao)
    }

    // Se há filtro de tamanho ativo
    if (tamanhoFilter) {
      filteredTamanhos = filteredTamanhos.filter(t => t.tamanho === tamanhoFilter)
      // Recalcular os outros gráficos baseado no filtro de tamanho
      const casasTamanho = filteredTamanhos.reduce((acc, t) => acc + t.quantidade, 0)
      const proporcao = casasTamanho > 0 ? casasTamanho / totalCasas : 0

      if (!produtoFilter) {
        filteredProdutos = filteredProdutos.map(p => ({
          ...p,
          quantidade: Math.round(p.quantidade * proporcao)
        }))
      }

      filteredFiliais = filteredFiliais.map(f => ({
        ...f,
        quantidade: Math.round(f.quantidade * proporcao)
      }))

      totalCasas = casasTamanho
      totalTerminais = Math.round(totalTerminais * proporcao)
      totalTecnicos = Math.round(totalTecnicos * proporcao)
    }

    // Se há filtro de filial ativo
    if (filialFilter) {
      filteredFiliais = filteredFiliais.filter(f => f.filial === filialFilter)
      // Recalcular os outros gráficos baseado no filtro de filial
      const casasFilial = filteredFiliais.reduce((acc, f) => acc + f.quantidade, 0)
      const proporcao = casasFilial > 0 ? casasFilial / totalCasas : 0

      if (!produtoFilter) {
        filteredProdutos = filteredProdutos.map(p => ({
          ...p,
          quantidade: Math.round(p.quantidade * proporcao)
        }))
      }

      if (!tamanhoFilter) {
        filteredTamanhos = filteredTamanhos.map(t => ({
          ...t,
          quantidade: Math.round(t.quantidade * proporcao)
        }))
      }

      totalCasas = casasFilial
      totalTerminais = Math.round(totalTerminais * proporcao)
      totalTecnicos = Math.round(totalTecnicos * proporcao)
    }

    return {
      ...data,
      casasPorProduto: filteredProdutos,
      casasPorTamanho: filteredTamanhos,
      casasPorFilial: filteredFiliais,
      totalCasas,
      totalTerminais,
      totalTecnicos,
    }
  }, [data, chartFilters])

  // Handlers para cliques nos gráficos
  const handleProdutoClick = (data: any) => {
    if (!interactiveMode) return
    const currentValue = chartFilters['casas-produto']
    const newValue = currentValue === data.name ? null : data.name
    setChartFilter('casas-produto', newValue)
  }

  const handleTamanhoClick = (data: any) => {
    if (!interactiveMode) return
    const currentValue = chartFilters['casas-tamanho']
    const newValue = currentValue === data.name ? null : data.name
    setChartFilter('casas-tamanho', newValue)
  }

  const handleFilialClick = (item: any) => {
    if (!interactiveMode) return
    const currentValue = chartFilters['casas-filial']
    const newValue = currentValue === item.label ? null : item.label
    setChartFilter('casas-filial', newValue)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0050C3]" />
        <span className="ml-2 text-muted-foreground">{t('houses.loading')}</span>
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

  if (!filteredData) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t('common.noDataAvailable')}</p>
      </div>
    )
  }

  // Calcular média de terminais por casa
  const mediaPorCasa = filteredData.totalCasas > 0
    ? (filteredData.totalTerminais / filteredData.totalCasas).toFixed(1)
    : '0'

  // Transformar dados para os gráficos (filtrar N/A)
  const produtosChart = filteredData.casasPorProduto
    .filter((item) => item.produto !== 'N/A')
    .map((item) => ({
      name: item.produto,
      value: item.quantidade,
      color: item.cor || PRODUTO_COLORS[item.produto] || '#8c8c8c',
    }))

  const tamanhosChart = filteredData.casasPorTamanho.map((item) => ({
    name: item.tamanho,
    value: item.quantidade,
    color: COLORS[item.tamanho as keyof typeof COLORS] || '#8c8c8c',
  }))

  const filiaisProgress = filteredData.casasPorFilial.map((item) => ({
    label: item.filial,
    value: item.quantidade,
    total: filteredData.totalCasas,
    color: getFilialColor(item.filial),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-[#52c41a]" />
        <h2 className="text-2xl font-bold text-foreground">{t('houses.title')}</h2>
      </div>

      {/* Casas Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title={t('houses.totalHouses')}
          value={filteredData.totalCasas.toString()}
          icon={<HomeIcon className="h-6 w-6" />}
          subtitle={t('common.selectedPeriod')}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title={t('houses.totalTerminals')}
          value={filteredData.totalTerminais.toString()}
          icon={<Laptop className="h-6 w-6" />}
          subtitle={t('houses.averagePerHouse', { value: mediaPorCasa })}
        />
        <StatCard
          title={t('houses.techniciansUsed')}
          value={filteredData.totalTecnicos.toString()}
          icon={<UserCheck className="h-6 w-6" />}
          subtitle={t('houses.housesWithTechnicians', { percent: filteredData.percentualCasasComTecnicos })}
        />
      </div>

      {/* Casas Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {interactiveMode && (
                <Badge variant="outline" className="gap-1">
                  <MousePointer2 className="h-3 w-3" />
                  {t('common.clickable')}
                </Badge>
              )}
            </span>
          </div>
          <PieChart
            data={produtosChart}
            title={t('houses.byProduct')}
            showLegend={true}
            onItemClick={handleProdutoClick}
            selectedItem={chartFilters['casas-produto']}
            interactiveMode={interactiveMode}
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {interactiveMode && (
                <Badge variant="outline" className="gap-1">
                  <MousePointer2 className="h-3 w-3" />
                  {t('common.clickable')}
                </Badge>
              )}
            </span>
          </div>
          <BarChart
            data={tamanhosChart}
            title={t('houses.bySize')}
            onItemClick={handleTamanhoClick}
            selectedItem={chartFilters['casas-tamanho']}
            interactiveMode={interactiveMode}
          />
        </div>
        <ProgressCard
          title={t('houses.byBranch')}
          items={filiaisProgress}
          maxVisible={5}
          showPercentage={false}
          onItemClick={handleFilialClick}
          selectedItem={chartFilters['casas-filial']}
          interactiveMode={interactiveMode}
        />
      </div>
    </div>
  )
}

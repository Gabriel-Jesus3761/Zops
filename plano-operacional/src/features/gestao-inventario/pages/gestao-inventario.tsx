import * as React from 'react'
import { toast } from 'sonner'
import {
  Package,
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ScanBarcode,
  History,
  TrendingUp,
  Activity,
} from 'lucide-react'
import '../styles/inventory-animations.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Skeleton,
  SkeletonTable,
} from '@/components/ui/skeleton'
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip'
import { FormField } from '@/components/ui/form-field'

import { useAssets, useDebouncedSearch } from '../hooks'
import { InfiniteScrollTrigger, FiltersDrawer } from '../components'
import { FILTER_OPTIONS } from '../constants'
import type {
  Asset,
  AssetFilters,
  TabKey,
  ExportProgress,
  MissingDataStats,
} from '../types'

const TABS_CONFIG: Record<TabKey, { label: string; icon: React.ReactNode; filter?: Partial<AssetFilters['where']> }> = {
  all: { label: 'Parque Total', icon: <Package className="h-4 w-4" /> },
  good: { label: 'Ativos Good', icon: <CheckCircle className="h-4 w-4" />, filter: { situacao: ['Good'] } },
  bad: { label: 'Ativos Bad', icon: <XCircle className="h-4 w-4" />, filter: { situacao: ['Bad'] } },
  indisponivel: { label: 'Indisponíveis', icon: <Ban className="h-4 w-4" />, filter: { detalhamento: ['Possível perda'] } },
  perdas: { label: 'Perdas', icon: <AlertTriangle className="h-4 w-4" />, filter: { detalhamento: ['Perda protocolada', 'Perda não protocolada'] } },
  transito: { label: 'Em Trânsito', icon: <ArrowLeftRight className="h-4 w-4" /> },
  dashboard: { label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
}

const DEFAULT_FILTERS: AssetFilters = {
  q: '',
  where: {},
  incompleteOnly: false,
  osOnly: false,
  transitOnly: false,
}

export function GestaoInventarioPage() {
  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabKey>('all')

  // Filter states
  const [filters, setFilters] = React.useState<AssetFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Selection states
  const [selectedRows, setSelectedRows] = React.useState<Asset[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>([])

  // Modal states
  const [isSerialSearchOpen, setIsSerialSearchOpen] = React.useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false)
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = React.useState(false)
  const [historySerial, setHistorySerial] = React.useState('')

  // Export states
  const [exportProgress, setExportProgress] = React.useState<ExportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    phase: 'fetching',
    batchCount: 0,
    currentBatch: 0,
  })
  const [, setIsExporting] = React.useState(false)

  // Serial search states
  const [serialSearchInput, setSerialSearchInput] = React.useState('')
  const [serialSearchLoading, setSerialSearchLoading] = React.useState(false)

  // Combine filters with active tab
  const activeFilters = React.useMemo<AssetFilters>(() => {
    const tabConfig = TABS_CONFIG[activeTab]
    const combined = { ...filters }

    if (tabConfig.filter) {
      // Merge tab filter with existing where clause, filtering out undefined values
      const mergedWhere: Record<string, string[]> = { ...combined.where }
      Object.entries(tabConfig.filter).forEach(([key, value]) => {
        if (value !== undefined) {
          mergedWhere[key] = value
        }
      })
      combined.where = mergedWhere
    }

    if (activeTab === 'transito') {
      combined.transitOnly = true
    }

    return combined
  }, [filters, activeTab])

  // Data hooks
  const {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
    invalidateCache,
    isUpdating,
  } = useAssets(activeTab === 'dashboard' ? null : activeFilters)

  // Use constants for filter options instead of fetching from API
  const filterOptions = FILTER_OPTIONS

  // Missing data stats
  const missingDataStats = React.useMemo<MissingDataStats>(() => {
    let semSerialN = 0
    let semDeviceZ = 0
    let semAmbos = 0

    data.forEach(asset => {
      const hasSerialN = asset.serialN && asset.serialN.trim().length > 0
      const hasDeviceZ = asset.deviceZ && asset.deviceZ.trim().length > 0

      if (!hasSerialN && !hasDeviceZ) {
        semAmbos++
      } else if (!hasSerialN) {
        semSerialN++
      } else if (!hasDeviceZ) {
        semDeviceZ++
      }
    })

    return {
      semSerialN,
      semDeviceZ,
      semAmbos,
      total: semSerialN + semDeviceZ + semAmbos,
    }
  }, [data])

  // Debounced search
  const handleSearchDebounced = useDebouncedSearch((value: string) => {
    setFilters(prev => ({ ...prev, q: value }))
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    handleSearchDebounced(value)
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabKey)
    setSelectedRows([])
    setSelectedRowKeys([])
  }

  // Handle serial search
  const handleSerialSearch = async () => {
    const serials = serialSearchInput
      .split(/[\n\r,;\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (serials.length === 0) {
      toast.error('Por favor, insira ao menos um Serial Máquina')
      return
    }

    setSerialSearchLoading(true)

    try {
      const BATCH_SIZE = 30
      const batches: string[][] = []

      for (let i = 0; i < serials.length; i += BATCH_SIZE) {
        batches.push(serials.slice(i, i + BATCH_SIZE))
      }

      let allFoundAssets: Asset[] = []

      for (const batch of batches) {
        const response = await fetch(
          'https://southamerica-east1-zops-mobile.cloudfunctions.net/getAtivos',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: '/ativos',
              where: [{ field: 'serialMaquina', operator: 'in', value: batch }],
            }),
          }
        )

        if (!response.ok) throw new Error('Falha ao buscar ativos')

        const result = await response.json()
        const foundInBatch = result.docs.map((doc: { id: string; data: Partial<Asset> }) => ({
          ...doc.data,
          firestoreId: doc.id,
        }))

        allFoundAssets = allFoundAssets.concat(foundInBatch)
      }

      if (allFoundAssets.length === 0) {
        toast.error('Nenhum ativo encontrado com os seriais informados')
        return
      }

      setSelectedRows(allFoundAssets)
      setSelectedRowKeys(allFoundAssets.map(a => a.firestoreId))
      setIsSerialSearchOpen(false)
      setSerialSearchInput('')

      const notFoundCount = serials.length - allFoundAssets.length
      if (notFoundCount > 0) {
        toast.warning(
          `${allFoundAssets.length} ativos encontrados. ${notFoundCount} serial(is) não encontrado(s).`
        )
      } else {
        toast.success(`${allFoundAssets.length} ativos encontrados e selecionados!`)
      }
    } catch (error) {
      console.error('Erro ao buscar seriais:', error)
      toast.error('Erro ao buscar ativos por serial')
    } finally {
      setSerialSearchLoading(false)
    }
  }

  // Handle full export
  const handleFullExport = async () => {
    setIsExportModalOpen(true)
    setIsExporting(true)
    setExportProgress({ current: 0, total: 0, percentage: 0, phase: 'fetching', batchCount: 0, currentBatch: 0 })

    try {
      const BATCH_SIZE = 5000
      let allAssets: Asset[] = []
      let lastDocId: string | null = null
      let hasMore = true
      let batchCount = 0

      // Phase 1: Fetch all data
      while (hasMore) {
        batchCount++

        const response = await fetch(
          'https://southamerica-east1-zops-mobile.cloudfunctions.net/getAtivos',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: '/ativos',
              where: [],
              limit: BATCH_SIZE,
              ...(lastDocId && { startAfter: lastDocId }),
            }),
          }
        )

        if (!response.ok) throw new Error(`Falha no lote ${batchCount}`)

        const result = await response.json()
        const batch = result.docs.map((doc: { id: string; data: Partial<Asset> }) => ({
          ...doc.data,
          firestoreId: doc.id,
        }))

        allAssets = allAssets.concat(batch)

        setExportProgress({
          current: allAssets.length,
          total: allAssets.length,
          percentage: 0,
          phase: 'fetching',
          currentBatch: batchCount,
          batchCount,
        })

        if (batch.length < BATCH_SIZE) {
          hasMore = false
        } else if (result.lastVisible) {
          lastDocId = result.lastVisible
        } else {
          hasMore = false
        }

        if (batchCount >= 100) hasMore = false
      }

      // Phase 2: Process data
      setExportProgress(prev => ({ ...prev, phase: 'processing', total: allAssets.length }))

      const exportData = allAssets.map((asset, index) => {
        if (index % 1000 === 0) {
          setExportProgress(prev => ({
            ...prev,
            current: index,
            percentage: Math.round((index / allAssets.length) * 100),
          }))
        }

        return {
          Tipo: asset.tipo || '',
          Modelo: asset.modelo || '',
          Adquirencia: asset.adquirencia || '',
          'Serial Maquina': asset.serialMaquina || '',
          'Serial N': asset.serialN || '',
          'Device Z': asset.deviceZ || '',
          Situacao: asset.situacao || '',
          'Categoria Parque': asset.categoria_parque || '',
          Subcategoria: asset.subcategoria_parque || '',
          Alocacao: (asset.alocacao || 'Estoque').replace(' (Matriz)', ''),
          Detalhamento: asset.detalhamento || '',
        }
      })

      // Phase 3: Generate Excel
      setExportProgress(prev => ({
        ...prev,
        phase: 'generating',
        current: allAssets.length,
        percentage: 100,
      }))

      const { utils, writeFile } = await import('xlsx')
      const wb = utils.book_new()
      const ws = utils.json_to_sheet(exportData)

      ws['!cols'] = [
        { width: 12 }, { width: 15 }, { width: 12 }, { width: 18 },
        { width: 18 }, { width: 15 }, { width: 10 }, { width: 15 },
        { width: 15 }, { width: 25 }, { width: 25 },
      ]

      utils.book_append_sheet(wb, ws, 'Ativos')
      writeFile(wb, `ativos_completo_${new Date().toISOString().split('T')[0]}.xlsx`)

      setExportProgress(prev => ({ ...prev, phase: 'complete' }))
      toast.success(`${allAssets.length} ativos exportados com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar ativos')
    } finally {
      setIsExporting(false)
      setTimeout(() => setIsExportModalOpen(false), 2000)
    }
  }

  // Handle selection export
  const handleSelectionExport = async () => {
    if (selectedRows.length === 0) {
      toast.warning('Nenhum ativo selecionado para exportar')
      return
    }

    try {
      const { utils, writeFile } = await import('xlsx')

      const exportData = selectedRows.map(asset => ({
        Tipo: asset.tipo || '',
        Modelo: asset.modelo || '',
        Adquirencia: asset.adquirencia || '',
        'Serial Maquina': asset.serialMaquina || '',
        'Serial N': asset.serialN || '',
        'Device Z': asset.deviceZ || '',
        Situacao: asset.situacao || '',
        Alocacao: (asset.alocacao || 'Estoque').replace(' (Matriz)', ''),
        Detalhamento: asset.detalhamento || '',
      }))

      const wb = utils.book_new()
      const ws = utils.json_to_sheet(exportData)
      utils.book_append_sheet(wb, ws, 'Ativos')
      writeFile(wb, `ativos_selecionados_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success(`${selectedRows.length} ativos exportados!`)
    } catch (error) {
      toast.error('Erro ao exportar ativos')
    }
  }

  // Show history modal
  const handleShowHistory = (asset: Asset) => {
    setHistorySerial(asset.serialMaquina || asset.serialN || '')
    setIsHistoryModalOpen(true)
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <CardTitle className="mb-2">Erro ao carregar ativos</CardTitle>
          <CardDescription className="mb-4">{error}</CardDescription>
          <Button onClick={reload} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <Card className="inventory-card-animate border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="inventory-header-animate">
                <CardTitle className="flex items-center gap-3 text-3xl font-bold inventory-text">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <Package className="h-6 w-6" />
                  </div>
                  Gestão de Inventário
                </CardTitle>
                <CardDescription className="mt-2 text-base inventory-text">
                  Gerencie os ativos serializados do seu parque de equipamentos
                </CardDescription>
              </div>

              <div className="flex items-center gap-3 inventory-stagger-1">
                {/* Missing data indicator */}
                {missingDataStats.total > 0 && (
                  <SimpleTooltip
                    content={`${missingDataStats.total} ativos com dados incompletos`}
                  >
                    <Badge
                      variant="destructive"
                      className="cursor-pointer missing-data-indicator px-3 py-1.5 text-sm font-medium"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      {missingDataStats.total} incompletos
                    </Badge>
                  </SimpleTooltip>
                )}

                {/* Export button */}
                <SimpleTooltip content="Exportar todos os ativos">
                  <Button
                    variant="outline"
                    onClick={handleFullExport}
                    className="inventory-button font-medium"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Tudo
                  </Button>
                </SimpleTooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6 p-1 bg-muted/50 rounded-lg">
                {Object.entries(TABS_CONFIG).map(([key, config], idx) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="inventory-tab gap-2 data-[state=active]:bg-accent data-[state=active]:shadow-sm font-medium inventory-text data-[state=active]:!text-accent-foreground"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab content - Dashboard has its own content */}
              {activeTab === 'dashboard' ? (
                <TabsContent value="dashboard">
                  <DashboardContent data={data} loading={loading} />
                </TabsContent>
              ) : (
                <TabsContent value={activeTab} className="space-y-5">
                  {/* Filters Bar */}
                  <div className="flex flex-wrap items-center gap-3 inventory-stagger-2">
                    {/* Search */}
                    <div className="search-input-wrapper relative flex-1 min-w-[200px] max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Buscar por serial..."
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="pl-9 inventory-text font-medium"
                      />
                    </div>

                    {/* Filter selects */}
                    <Select
                      value={filters.where.tipo?.[0]}
                      onValueChange={value =>
                        setFilters(prev => ({
                          ...prev,
                          where: { ...prev.where, tipo: value ? [value] : [] },
                        }))
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.tipo.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.where.modelo?.[0]}
                      onValueChange={value =>
                        setFilters(prev => ({
                          ...prev,
                          where: { ...prev.where, modelo: value ? [value] : [] },
                        }))
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Todos os modelos" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.modelo.map(modelo => (
                          <SelectItem key={modelo} value={modelo}>
                            {modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      <SimpleTooltip content="Buscar por múltiplos seriais">
                        <Button
                          variant="outline"
                          onClick={() => setIsSerialSearchOpen(true)}
                          className="inventory-button h-10 px-4 font-medium"
                        >
                          <ScanBarcode className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Buscar Seriais</span>
                        </Button>
                      </SimpleTooltip>

                      <SimpleTooltip content="Filtros avançados">
                        <Button
                          variant="outline"
                          onClick={() => setIsFiltersDrawerOpen(true)}
                          className="inventory-button h-10 px-4 font-medium"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Filtros</span>
                        </Button>
                      </SimpleTooltip>

                      <SimpleTooltip content="Atualizar dados">
                        <Button
                          variant="outline"
                          onClick={invalidateCache}
                          disabled={isUpdating}
                          className="inventory-button h-10 px-4 font-medium"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''} sm:mr-2`}
                          />
                          <span className="hidden sm:inline">Atualizar</span>
                        </Button>
                      </SimpleTooltip>
                    </div>
                  </div>

                  {/* Selection bar */}
                  {selectedRows.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                      <span className="text-sm font-medium">
                        {selectedRows.length} ativo(s) selecionado(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectionExport}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Seleção
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRows([])
                            setSelectedRowKeys([])
                          }}
                        >
                          Limpar Seleção
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  {loading && data.length === 0 ? (
                    <SkeletonTable rows={10} columns={8} />
                  ) : (
                    <AssetTableSimple
                      data={data}
                      loading={loading}
                      selectedKeys={selectedRowKeys}
                      onSelectionChange={(keys, rows) => {
                        setSelectedRowKeys(keys)
                        setSelectedRows(rows)
                      }}
                      onShowHistory={handleShowHistory}
                      hasMore={hasMore}
                      onLoadMore={loadMore}
                    />
                  )}

                  {/* Infinite scroll trigger */}
                  <InfiniteScrollTrigger
                    hasMore={hasMore}
                    loading={loading}
                    onLoadMore={loadMore}
                    threshold={200}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Serial Search Modal */}
        <Dialog open={isSerialSearchOpen} onOpenChange={setIsSerialSearchOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5" />
                Buscar por Serial Máquina
              </DialogTitle>
              <DialogDescription>
                Cole a lista de Serial Máquina (um por linha ou separados por vírgula).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-accent p-3 text-sm">
                <p className="font-medium text-accent-foreground mb-1">
                  Dica:
                </p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Copie a coluna de Serial Máquina direto do Excel</li>
                  <li>• Você pode colar múltiplos seriais separados por vírgula</li>
                </ul>
              </div>

              <FormField>
                <FormField.Label>Lista de Serial Máquina</FormField.Label>
                <FormField.Textarea
                  rows={8}
                  placeholder={'Exemplo:\n123456\n789012\n345678'}
                  value={serialSearchInput}
                  onChange={e => setSerialSearchInput(e.target.value)}
                  className="font-mono"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSerialSearchOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSerialSearch} disabled={serialSearchLoading}>
                {serialSearchLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ScanBarcode className="mr-2 h-4 w-4" />
                )}
                Buscar e Selecionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Progress Modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportação Completa
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress steps */}
              <div className="flex justify-between text-sm">
                <span
                  className={
                    exportProgress.phase === 'fetching'
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  1. Buscando
                </span>
                <span
                  className={
                    exportProgress.phase === 'processing'
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  2. Processando
                </span>
                <span
                  className={
                    exportProgress.phase === 'generating' ||
                    exportProgress.phase === 'complete'
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  3. Gerando
                </span>
              </div>

              {/* Progress bar */}
              {exportProgress.phase !== 'complete' && (
                <div className="space-y-2">
                  <Progress value={exportProgress.percentage} />
                  <p className="text-sm text-muted-foreground text-center">
                    {exportProgress.phase === 'fetching' && (
                      <>
                        Buscando dados... Lote {exportProgress.currentBatch} (
                        {exportProgress.current.toLocaleString()} registros)
                      </>
                    )}
                    {exportProgress.phase === 'processing' && (
                      <>
                        Processando {exportProgress.current.toLocaleString()} de{' '}
                        {exportProgress.total.toLocaleString()} ativos
                      </>
                    )}
                    {exportProgress.phase === 'generating' && 'Gerando arquivo Excel...'}
                  </p>
                </div>
              )}

              {/* Success state */}
              {exportProgress.phase === 'complete' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600">
                    Exportação Concluída!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {exportProgress.total.toLocaleString()} ativos exportados
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* History Modal */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico do Ativo: {historySerial}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground text-center">
                Histórico do equipamento será carregado aqui...
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters Drawer */}
        <FiltersDrawer
          open={isFiltersDrawerOpen}
          onOpenChange={setIsFiltersDrawerOpen}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters)
            setSearchQuery(newFilters.q || '')
          }}
          filterOptions={filterOptions}
        />
      </div>
    </TooltipProvider>
  )
}

// Simple Asset Table Component
interface AssetTableSimpleProps {
  data: Asset[]
  loading: boolean
  selectedKeys: string[]
  onSelectionChange: (keys: string[], rows: Asset[]) => void
  onShowHistory: (asset: Asset) => void
  hasMore: boolean
  onLoadMore: () => void
}

function AssetTableSimple({
  data,
  loading,
  selectedKeys,
  onSelectionChange,
  onShowHistory,
}: AssetTableSimpleProps) {
  const toggleSelection = (asset: Asset) => {
    const key = asset.firestoreId
    if (selectedKeys.includes(key)) {
      onSelectionChange(
        selectedKeys.filter(k => k !== key),
        data.filter(a => selectedKeys.includes(a.firestoreId) && a.firestoreId !== key)
      )
    } else {
      onSelectionChange(
        [...selectedKeys, key],
        [...data.filter(a => selectedKeys.includes(a.firestoreId)), asset]
      )
    }
  }

  const toggleAll = () => {
    if (selectedKeys.length === data.length) {
      onSelectionChange([], [])
    } else {
      onSelectionChange(
        data.map(a => a.firestoreId),
        data
      )
    }
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="w-12 p-3">
                <input
                  type="checkbox"
                  checked={selectedKeys.length === data.length && data.length > 0}
                  onChange={toggleAll}
                  className="rounded border-input"
                />
              </th>
              <th className="p-3 text-left font-medium">Tipo</th>
              <th className="p-3 text-left font-medium">Modelo</th>
              <th className="p-3 text-left font-medium">Serial Máquina</th>
              <th className="p-3 text-left font-medium">Serial N</th>
              <th className="p-3 text-left font-medium">Device Z</th>
              <th className="p-3 text-left font-medium">Situação</th>
              <th className="p-3 text-left font-medium">Alocação</th>
              <th className="w-16 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((asset, idx) => (
              <tr
                key={asset.firestoreId}
                className={`inventory-table-row border-b ${
                  selectedKeys.includes(asset.firestoreId) ? 'bg-primary/5' : ''
                }`}
                data-selected={selectedKeys.includes(asset.firestoreId)}
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(asset.firestoreId)}
                    onChange={() => toggleSelection(asset)}
                    className="rounded border-input cursor-pointer"
                  />
                </td>
                <td className="p-3 inventory-text font-medium">{asset.tipo}</td>
                <td className="p-3 inventory-text">{asset.modelo}</td>
                <td className="p-3 font-mono text-xs inventory-number text-muted-foreground">
                  {asset.serialMaquina}
                </td>
                <td className="p-3 font-mono text-xs inventory-number text-muted-foreground">
                  {asset.serialN || '-'}
                </td>
                <td className="p-3 font-mono text-xs inventory-number text-muted-foreground">
                  {asset.deviceZ || '-'}
                </td>
                <td className="p-3">
                  <Badge
                    className={`
                      ${asset.situacao === 'Good' ? 'status-badge-good' : 'status-badge-bad'}
                      font-medium px-2.5 py-0.5 inventory-text
                    `}
                  >
                    {asset.situacao}
                  </Badge>
                </td>
                <td className="p-3 max-w-[200px] truncate inventory-text text-sm">
                  {asset.alocacao || 'Estoque'}
                </td>
                <td className="p-3">
                  <SimpleTooltip content="Ver histórico">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onShowHistory(asset)}
                      className="inventory-button"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </SimpleTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="inventory-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm text-muted-foreground inventory-text">Carregando ativos...</p>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center p-12 space-y-3">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground inventory-text">Nenhum ativo encontrado</p>
        </div>
      )}
    </div>
  )
}

// Dashboard Content Component
interface DashboardContentProps {
  data: Asset[]
  loading: boolean
}

function DashboardContent({ data, loading }: DashboardContentProps) {
  const metrics = React.useMemo(() => {
    const totalAssets = data.length
    const goodAssets = data.filter(a => a.situacao === 'Good').length
    const badAssets = data.filter(a => a.situacao === 'Bad').length

    const tiposCount: Record<string, number> = {}
    const modelosCount: Record<string, number> = {}

    data.forEach(asset => {
      if (asset.tipo) tiposCount[asset.tipo] = (tiposCount[asset.tipo] || 0) + 1
      if (asset.modelo) modelosCount[asset.modelo] = (modelosCount[asset.modelo] || 0) + 1
    })

    const tipoMaisComum = Object.keys(tiposCount).reduce(
      (a, b) => (tiposCount[a] > tiposCount[b] ? a : b),
      'N/A'
    )
    const modeloMaisComum = Object.keys(modelosCount).reduce(
      (a, b) => (modelosCount[a] > modelosCount[b] ? a : b),
      'N/A'
    )

    return {
      totalAssets,
      goodAssets,
      badAssets,
      tipoMaisComum,
      modeloMaisComum,
      goodPercentage: totalAssets > 0 ? Math.round((goodAssets / totalAssets) * 100) : 0,
    }
  }, [data])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="kpi-card inventory-stagger-1 relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="kpi-label inventory-text">Total de Ativos</CardDescription>
              <div className="p-2 rounded-lg bg-accent">
                <Package className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="kpi-number inventory-number">
              {metrics.totalAssets.toLocaleString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground inventory-text">
              <Activity className="h-3.5 w-3.5" />
              <span>Parque completo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card inventory-stagger-2 relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="kpi-label inventory-text">Ativos Good</CardDescription>
              <div className="p-2 rounded-lg bg-accent">
                <CheckCircle className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="kpi-number inventory-number" style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.18 145) 0%, oklch(0.45 0.18 145) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {metrics.goodAssets.toLocaleString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Progress value={metrics.goodPercentage} className="h-1.5 export-progress-bar" />
            <div className="flex items-center justify-between text-xs inventory-text">
              <span className="text-muted-foreground">{metrics.goodPercentage}% do total</span>
              <span className="font-medium text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Operacional
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card inventory-stagger-3 relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="kpi-label inventory-text">Ativos Bad</CardDescription>
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <CardTitle className="kpi-number inventory-number" style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.22 25) 0%, oklch(0.45 0.22 25) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {metrics.badAssets.toLocaleString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-1.5 text-xs text-destructive font-medium inventory-text">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Necessita atenção</span>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card inventory-stagger-4 relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="kpi-label inventory-text">Modelo Destaque</CardDescription>
              <div className="p-2 rounded-lg bg-accent">
                <BarChart3 className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold inventory-text truncate" style={{
              background: 'linear-gradient(135deg, oklch(0.45 0.15 285) 0%, oklch(0.35 0.15 285) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {metrics.modeloMaisComum}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground inventory-text">
              <Activity className="h-3.5 w-3.5" />
              <span>Mais comum</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More dashboard content can be added here */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada</CardTitle>
          <CardDescription>
            Gráficos e métricas avançadas em desenvolvimento...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <BarChart3 className="h-16 w-16 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

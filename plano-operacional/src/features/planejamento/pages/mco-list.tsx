import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Plus,
  Eye,
  MapPin,
  Search,
  Trash2,
  Calculator,
  Pencil,
  FileText,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  Building2,
  BarChart3,
  FileSpreadsheet,
  FolderOpen,
  TrendingUp,
  Users,
  List,
  Columns,
  Map
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { mcoService } from '../services/mco.service'
import type { MCO, SortField, SortDirection } from '../types/mco.types'
import { MCOKanbanView } from '../components/mco-kanban-view'
import { MCOMapView } from '../components/mco-map-view'

const ITEMS_PER_PAGE = 20

// Componente de Status Badge
const MCOStatusBadge = ({ status }: { status: MCO['status'] }) => {
  const statusConfig = {
    pendente: {
      label: 'Pendente',
      variant: 'outline' as const,
      className: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      icon: Clock
    },
    aprovado: {
      label: 'Aprovado',
      variant: 'default' as const,
      className: 'bg-green-500 text-white border-green-500',
      icon: CheckCircle2
    },
    rejeitado: {
      label: 'Rejeitado',
      variant: 'destructive' as const,
      className: '',
      icon: null
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cn('text-[10px] px-1.5 py-0 gap-1', config.className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}

export function MCOListPage() {
  const navigate = useNavigate()
  const [searchGeral, setSearchGeral] = useState('')
  const [filterPendente, setFilterPendente] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mcoToDelete, setMcoToDelete] = useState<MCO | null>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'map'>('list')

  const { data: mcos, isLoading, refetch } = useQuery({
    queryKey: ['mcos'],
    queryFn: () => mcoService.listarMCOs(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchGeral, filterPendente])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null) }
      else setSortDirection('asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />
    return <ArrowDown className="h-3 w-3 ml-1" />
  }

  const filteredMCOs = useMemo(() => {
    let result = mcos?.filter((mco) => {
      const termoBusca = searchGeral.toLowerCase().trim()

      // Normalizar busca por código MCO: 13 → MCO-0013
      let matchCodigo = false
      if (/^\d+$/.test(termoBusca)) {
        const codigoNormalizado = `mco-${termoBusca.padStart(4, '0')}`
        matchCodigo = mco.codigo?.toLowerCase() === codigoNormalizado
      } else if (termoBusca.includes('mco')) {
        matchCodigo = mco.codigo?.toLowerCase().includes(termoBusca)
      }

      const matchEvento = mco.nome_evento.toLowerCase().includes(termoBusca)
      const matchCliente = mco.cliente_nome?.toLowerCase().includes(termoBusca)
      const matchBusca = !termoBusca || matchCodigo || matchEvento || matchCliente

      const matchPendente = !filterPendente || mco.status === 'pendente'

      return matchBusca && matchPendente
    }) || []

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let aVal: string | number, bVal: string | number
        switch (sortField) {
          case 'codigo': aVal = a.codigo || ''; bVal = b.codigo || ''; break
          case 'nome_evento': aVal = a.nome_evento.toLowerCase(); bVal = b.nome_evento.toLowerCase(); break
          case 'cliente_nome': aVal = (a.cliente_nome || '').toLowerCase(); bVal = (b.cliente_nome || '').toLowerCase(); break
          case 'cidade': aVal = `${a.cidade}/${a.uf}`.toLowerCase(); bVal = `${b.cidade}/${b.uf}`.toLowerCase(); break
          case 'porte': aVal = a.porte || ''; bVal = b.porte || ''; break
          case 'data_inicial': aVal = new Date(a.data_inicial).getTime(); bVal = new Date(b.data_inicial).getTime(); break
          case 'custo_operacional_efetivo': aVal = a.custo_operacional_efetivo || 0; bVal = b.custo_operacional_efetivo || 0; break
          case 'cot': aVal = a.cot || 0; bVal = b.cot || 0; break
          case 'status': aVal = a.status || ''; bVal = b.status || ''; break
          default: return 0
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [mcos, searchGeral, filterPendente, sortField, sortDirection])

  const paginatedMCOs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMCOs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMCOs, currentPage])

  const totalPages = Math.ceil((filteredMCOs?.length || 0) / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    if (!filteredMCOs || filteredMCOs.length === 0) {
      return {
        total: 0,
        custoMedio: 0,
        pendentesAprovacao: mcos?.filter(s => s.status === 'pendente').length || 0,
        tiposAtendimento: { matriz: 0, filial: 0, filialInterior: 0 }
      }
    }

    const custoTotal = filteredMCOs.reduce((sum, s) => sum + (s.custo_operacional_efetivo || 0), 0)

    return {
      total: filteredMCOs.length,
      custoMedio: custoTotal / filteredMCOs.length,
      pendentesAprovacao: mcos?.filter(s => s.status === 'pendente').length || 0,
      tiposAtendimento: {
        matriz: filteredMCOs.filter(s => s.tipo_atendimento === 'atendimento_matriz').length,
        filial: filteredMCOs.filter(s => s.tipo_atendimento === 'filial').length,
        filialInterior: filteredMCOs.filter(s => s.tipo_atendimento === 'filial_interior').length,
      }
    }
  }, [filteredMCOs, mcos])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDisplayText = (text?: string) => {
    if (!text) return '-'
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const confirmDeleteMCO = (mco: MCO) => {
    setMcoToDelete(mco)
    setDeleteDialogOpen(true)
  }

  const deleteMCO = async () => {
    if (!mcoToDelete) return

    try {
      await mcoService.deletarMCO(mcoToDelete.id)
      toast.success('MCO excluída com sucesso')
      refetch()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir MCO')
    } finally {
      setDeleteDialogOpen(false)
      setMcoToDelete(null)
    }
  }

  const aplicarFiltroPendente = () => {
    setFilterPendente(!filterPendente)
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      const half = Math.floor(maxVisiblePages / 2)
      let start = Math.max(1, currentPage - half)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }

      for (let i = start; i <= end; i++) pages.push(i)
    }

    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl bg-card border border-border shadow-sm p-6 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gerenciamento
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                Matriz de Custo Operacional
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gerencie e analise os custos operacionais dos eventos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1.5" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                <Columns className="h-4 w-4 mr-1.5" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="h-8 px-3"
              >
                <Map className="h-4 w-4 mr-1.5" />
                Mapa
              </Button>
            </div>
            <Button
              onClick={() => navigate('/planejamento/mcos/nova')}
              className="shrink-0 shadow-lg shadow-primary/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova MCO
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de MCOs */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </span>
              <p className="text-3xl font-bold text-foreground mt-1">
                {stats.total}
              </p>
              <span className="text-xs text-muted-foreground">
                simulações
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-chart-1/10">
              <FileText className="h-5 w-5 text-chart-1" />
            </div>
          </div>
        </div>

        {/* Custo Médio */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custo Médio
              </span>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(stats.custoMedio)}
              </p>
              <span className="text-xs text-muted-foreground">
                por MCO
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-chart-2/10">
              <BarChart3 className="h-5 w-5 text-chart-2" />
            </div>
          </div>
        </div>

        {/* Tipo de Atendimento */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tipo de atendimento
            </span>
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Building2 className="h-4 w-4 text-chart-3" />
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-3"></span>
                Matriz
              </span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-chart-3/10 border-chart-3/30">
                {stats.tiposAtendimento.matriz}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-3/70"></span>
                Filial
              </span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {stats.tiposAtendimento.filial}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-3/40"></span>
                Filial Interior
              </span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {stats.tiposAtendimento.filialInterior}
              </Badge>
            </div>
          </div>
        </div>

        {/* MCOs Pendentes de Aprovação */}
        {(() => {
          const isPendentesZero = stats.pendentesAprovacao === 0
          return (
            <div
              className={cn(
                "rounded-xl bg-card border shadow-sm p-4 transition-all",
                isPendentesZero
                  ? "opacity-50 cursor-default"
                  : filterPendente
                    ? "border-primary bg-primary/5 cursor-pointer hover:bg-primary/10"
                    : "border-border hover:border-primary/50 hover:shadow-md cursor-pointer"
              )}
              onClick={isPendentesZero ? undefined : aplicarFiltroPendente}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pendentes
                  </span>
                  <p className={cn(
                    "text-3xl font-bold mt-1",
                    isPendentesZero ? "text-muted-foreground" : filterPendente ? "text-primary" : "text-foreground"
                  )}>
                    {isPendentesZero ? "—" : stats.pendentesAprovacao}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {isPendentesZero ? "nenhuma pendência" : filterPendente ? "filtro ativo" : "clique para filtrar"}
                  </span>
                </div>
                <div className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  filterPendente ? "bg-primary text-primary-foreground" : "bg-chart-4/10"
                )}>
                  <Clock className={cn("h-5 w-5", filterPendente ? "" : "text-chart-4")} />
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Filtros */}
      <div className="rounded-xl bg-card border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Busca
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Buscar por número (ex: 13), nome do evento ou cliente..."
              value={searchGeral}
              onChange={(e) => setSearchGeral(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {filterPendente && (
            <Button
              variant="outline"
              onClick={() => setFilterPendente(false)}
              className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Clock className="h-4 w-4 mr-2" />
              Limpar filtro
            </Button>
          )}
        </div>
      </div>

      {/* Visualização: Lista, Kanban ou Mapa */}
      {viewMode === 'kanban' ? (
        <MCOKanbanView
          mcos={filteredMCOs}
          onEdit={(mco) => navigate(`/planejamento/mcos/${mco.id}/editar`)}
          onView={(mco) => navigate(`/planejamento/mcos/${mco.id}/detalhes`)}
          onViewResumo={(mco) => navigate(`/planejamento/mcos/${mco.id}/resumo`)}
          onDelete={confirmDeleteMCO}
        />
      ) : viewMode === 'map' ? (
        <MCOMapView
          mcos={filteredMCOs}
          onView={(mco) => navigate(`/planejamento/mcos/${mco.id}/detalhes`)}
        />
      ) : (
        <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                Simulações
              </span>
              <p className="text-xs text-muted-foreground">
                {filteredMCOs?.length || 0} {filteredMCOs?.length === 1 ? 'resultado' : 'resultados'}
                {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
              </p>
            </div>
          </div>
          {filteredMCOs.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatCurrency(filteredMCOs.reduce((sum, m) => sum + (m.custo_operacional_efetivo || 0), 0))} total
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('nome_evento')}>
                  <div className="flex items-center">Evento<SortIcon field="nome_evento" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('cliente_nome')}>
                  <div className="flex items-center">Cliente<SortIcon field="cliente_nome" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('cidade')}>
                  <div className="flex items-center">Local<SortIcon field="cidade" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('porte')}>
                  <div className="flex items-center justify-center">Porte<SortIcon field="porte" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('data_inicial')}>
                  <div className="flex items-center">Go Live<SortIcon field="data_inicial" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('custo_operacional_efetivo')}>
                  <div className="flex items-center">Custo<SortIcon field="custo_operacional_efetivo" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('cot')}>
                  <div className="flex items-center">COT<SortIcon field="cot" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center">Status<SortIcon field="status" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide py-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Carregando simulações...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMCOs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-2xl bg-muted/50">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-lg font-semibold text-foreground">Nenhuma MCO encontrada</p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {searchGeral || filterPendente
                            ? "Ajuste os filtros para ver mais resultados"
                            : "Crie sua primeira matriz de custo operacional para começar"
                          }
                        </p>
                      </div>
                      {!searchGeral && !filterPendente && (
                        <Button
                          onClick={() => navigate('/planejamento/mcos/nova')}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar primeira MCO
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMCOs?.map((mco, index) => (
                  <TableRow
                    key={mco.id}
                    className={cn(
                      "h-12 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-muted/40"
                    )}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 bg-muted/50">
                          {mco.codigo}
                        </Badge>
                        <span className="font-medium text-sm truncate max-w-[180px]">{formatDisplayText(mco.nome_evento)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{formatDisplayText(mco.cliente_nome)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{formatDisplayText(mco.cidade)}/{mco.uf}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-bold text-[10px] px-2 py-0.5",
                          mco.porte === 'Grande' && "bg-purple-500/10 border-purple-500/30 text-purple-700",
                          mco.porte === 'Médio' && "bg-blue-500/10 border-blue-500/30 text-blue-700",
                          mco.porte === 'Pequeno' && "bg-gray-500/10 border-gray-500/30 text-gray-700"
                        )}
                      >
                        {mco.porte || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(mco.data_inicial), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(mco.custo_operacional_efetivo || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={cn(
                        "text-xs font-medium",
                        mco.cot > 30 ? "text-red-600" : mco.cot > 20 ? "text-amber-600" : "text-green-600"
                      )}>
                        {mco.cot > 0 ? `${mco.cot.toFixed(2).replace('.', ',')}%` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <MCOStatusBadge status={mco.status} />
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => navigate(`/planejamento/mcos/${mco.id}/editar`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-chart-2/10 hover:text-chart-2"
                                onClick={() => navigate(`/planejamento/mcos/${mco.id}/resumo`)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Resumo</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-chart-1/10 hover:text-chart-1"
                                onClick={() => navigate(`/planejamento/mcos/${mco.id}/detalhes`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver MCO</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => confirmDeleteMCO(mco)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-muted/20">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={cn(
                      "cursor-pointer",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {getPageNumbers().map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={cn(
                      "cursor-pointer",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja excluir a MCO <strong>"{mcoToDelete?.nome_evento}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMCO}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

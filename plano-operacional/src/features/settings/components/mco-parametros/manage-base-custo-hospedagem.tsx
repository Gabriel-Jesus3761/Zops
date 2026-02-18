import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarClock,
  RefreshCw,
  BedDouble,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { NumberInput } from '@/components/ui/number-input'
import { hospedagemBaseCustoService } from '../../services/mco-parametros.service'
import type { HospedagemBaseCusto } from '../../types/mco-parametros'
import { toast } from 'sonner'

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

const UFS_POR_REGIAO: Record<string, string[]> = {
  Norte: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
}

type SortField = 'regiao' | 'uf' | 'cidade' | 'valor_diaria'
type SortDirection = 'asc' | 'desc' | null

const ITEMS_PER_PAGE = 20

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ManageBaseCustoHospedagem() {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegiao, setSelectedRegiao] = useState<string>('all')
  const [selectedUF, setSelectedUF] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const { data: baseCusto = [], isLoading } = useQuery({
    queryKey: ['hospedagem-base-custo'],
    queryFn: () => hospedagemBaseCustoService.getAll(),
  })

  const lastUpdate = useMemo(() => {
    if (!baseCusto.length) return null
    return baseCusto.reduce((max, item) => {
      return item.updated_at > max ? item.updated_at : max
    }, baseCusto[0].updated_at)
  }, [baseCusto])

  const saveMutation = useMutation({
    mutationFn: () => {
      const updates = Object.entries(editedValues).map(([id, valor_diaria]) => ({
        id,
        valor_diaria,
      }))
      return hospedagemBaseCustoService.salvarAlteracoes(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospedagem-base-custo'] })
      setEditedValues({})
      toast.success('Valores salvos com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao salvar valores')
    },
  })

  const marcarRevisaoMutation = useMutation({
    mutationFn: () =>
      hospedagemBaseCustoService.marcarRevisao(baseCusto.map((i) => i.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospedagem-base-custo'] })
      toast.success('Valores marcados como revisados!')
    },
    onError: () => {
      toast.error('Erro ao marcar revisão')
    },
  })

  const seedMutation = useMutation({
    mutationFn: () => hospedagemBaseCustoService.seedCidades(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospedagem-base-custo'] })
      toast.success('367 cidades populadas com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao popular dados iniciais')
    },
  })

  const availableUFs = useMemo(() => {
    if (selectedRegiao !== 'all') return UFS_POR_REGIAO[selectedRegiao] ?? []
    return Object.values(UFS_POR_REGIAO).flat()
  }, [selectedRegiao])

  const filteredData = useMemo(() => {
    let filtered = baseCusto.filter((item) => {
      const matchesSearch = item.cidade
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesRegiao =
        selectedRegiao === 'all' || item.regiao === selectedRegiao
      const matchesUF = selectedUF === 'all' || item.uf === selectedUF
      return matchesSearch && matchesRegiao && matchesUF
    })

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal), 'pt-BR')
          : String(bVal).localeCompare(String(aVal), 'pt-BR')
      })
    }

    return filtered
  }, [baseCusto, searchTerm, selectedRegiao, selectedUF, sortField, sortDirection])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />
    if (sortDirection === 'asc') return <ArrowUp className="ml-1 h-3 w-3" />
    return <ArrowDown className="ml-1 h-3 w-3" />
  }

  const handleValueChange = (id: string, value: number) => {
    const original = baseCusto.find((i) => i.id === id)?.valor_diaria
    if (original === value) {
      setEditedValues((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      setEditedValues((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleRegiaoChange = (value: string) => {
    setSelectedRegiao(value)
    setSelectedUF('all')
    setCurrentPage(1)
  }

  const hasChanges = Object.keys(editedValues).length > 0
  const changesCount = Object.keys(editedValues).length

  // Paginação: páginas visíveis
  const getVisiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2)
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ]
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {filteredData.length === baseCusto.length
              ? `${baseCusto.length} cidades cadastradas`
              : `${filteredData.length} de ${baseCusto.length} cidades`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {baseCusto.length === 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={seedMutation.isPending}>
                  <Database className="mr-2 h-4 w-4" />
                  Popular Dados Iniciais
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Popular com cidades brasileiras?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Serão criados registros para 367 cidades das 5 regiões do Brasil,
                    com valores de diária baseados no mercado. Você poderá ajustar
                    os valores individualmente depois.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => seedMutation.mutate()}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {hasChanges && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar ({changesCount})
            </Button>
          )}
        </div>
      </div>

      {/* Última atualização + Marcar Revisão */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          <span>
            Última atualização:{' '}
            <span className="font-medium text-foreground">
              {formatDate(lastUpdate ?? '')}
            </span>
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={marcarRevisaoMutation.isPending || baseCusto.length === 0}
            >
              <RefreshCw
                className={`mr-2 h-3.5 w-3.5 ${marcarRevisaoMutation.isPending ? 'animate-spin' : ''}`}
              />
              Marcar Revisão
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar valores como revisados?</AlertDialogTitle>
              <AlertDialogDescription>
                Atualiza a data de revisão de todos os registros para agora,
                indicando que os valores foram verificados e estão corretos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => marcarRevisaoMutation.mutate()}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedRegiao} onValueChange={handleRegiaoChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Região" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Regiões</SelectItem>
            {REGIOES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedUF}
          onValueChange={(v) => {
            setSelectedUF(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas UFs</SelectItem>
            {[...availableUFs].sort().map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-md border bg-white dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('regiao')}
              >
                <div className="flex items-center">
                  Região {getSortIcon('regiao')}
                </div>
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer select-none"
                onClick={() => handleSort('uf')}
              >
                <div className="flex items-center">UF {getSortIcon('uf')}</div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('cidade')}
              >
                <div className="flex items-center">
                  Cidade {getSortIcon('cidade')}
                </div>
              </TableHead>
              <TableHead
                className="w-[200px] cursor-pointer select-none text-right"
                onClick={() => handleSort('valor_diaria')}
              >
                <div className="flex items-center justify-end">
                  Valor Diária {getSortIcon('valor_diaria')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-muted-foreground"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  {baseCusto.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <BedDouble className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="font-medium">Nenhuma cidade cadastrada</p>
                        <p className="text-sm">
                          Clique em "Popular Capitais" para começar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Nenhuma cidade encontrada para os filtros selecionados
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => {
                const isEdited = item.id in editedValues
                return (
                  <TableRow
                    key={item.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white dark:bg-card'
                        : 'bg-muted/30'
                    }
                  >
                    <TableCell>{item.regiao}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {item.uf}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{item.cidade}</TableCell>
                    <TableCell>
                      <NumberInput
                        value={editedValues[item.id] ?? item.valor_diaria}
                        onChange={(v) => handleValueChange(item.id, v)}
                        currency
                        className={`h-8 w-full ${isEdited ? 'border-primary/60 bg-primary/5' : ''}`}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {getVisiblePages().map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

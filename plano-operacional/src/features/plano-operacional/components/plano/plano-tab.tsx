import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Plus, Filter } from 'lucide-react'
import type { PDV, PlanoFilters } from '../../types'
import { PDVTable } from './pdv-table'
import { PDVCards } from './pdv-cards'

interface PlanoTabProps {
  data: PDV[]
  isLoading?: boolean
}

type StatusFilter = PlanoFilters['status'][number]

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Entregue', label: 'Entregue' },
  { value: 'Devolvido', label: 'Devolvido' },
  { value: 'Inativo', label: 'Inativo' },
]

export function PlanoTab({ data, isLoading }: PlanoTabProps) {
  const [filters, setFilters] = useState<PlanoFilters>({
    searchText: '',
    status: [],
    setor: [],
    categoria: [],
  })
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<StatusFilter[]>([])

  const filteredData = data.filter(pdv => {
    // Filtro de busca
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase()
      const matches =
        pdv['Ponto de Venda'].toLowerCase().includes(search) ||
        pdv.setor?.toLowerCase().includes(search) ||
        pdv.categoria?.toLowerCase().includes(search) ||
        pdv.responsavel?.toLowerCase().includes(search)
      if (!matches) return false
    }

    // Filtro por status
    if (filters.status.length > 0) {
      const includesInactive = filters.status.includes('Inativo')
      const statusFilters = filters.status.filter(status => status !== 'Inativo') as Exclude<StatusFilter, 'Inativo'>[]
      const matchesInactive = includesInactive && (pdv.desativado || pdv.Status === 'Cancelado')
      const matchesStatus = statusFilters.length > 0 && statusFilters.includes(pdv.Status as Exclude<StatusFilter, 'Inativo'>)

      if (!matchesInactive && !matchesStatus) return false
    }

    return true
  })

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }))
  }

  const openFiltersModal = () => {
    setDraftStatus([...filters.status])
    setFiltersOpen(true)
  }

  const toggleDraftStatus = (value: StatusFilter) => {
    setDraftStatus(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }

  const applyStatusFilters = () => {
    setFilters(prev => ({ ...prev, status: [...draftStatus] }))
    setFiltersOpen(false)
  }

  const clearDraftFilters = () => {
    setDraftStatus([])
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar PDV, setor, categoria..."
                value={filters.searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 pl-10"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={openFiltersModal}
              className="w-full justify-between gap-2 sm:w-auto"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </span>
              {filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.status.length}
                </Badge>
              )}
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
              >
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
              >
                Cards
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo PDV
              </Button>
            </div>
          </div>

          <Button className="w-full sm:hidden">
            <Plus className="mr-2 h-4 w-4" />
            Novo PDV
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="sm:hidden">
        <PDVCards data={filteredData} isLoading={isLoading} />
      </div>
      <div className="hidden sm:block">
        {viewMode === 'table' ? (
          <PDVTable data={filteredData} isLoading={isLoading} />
        ) : (
          <PDVCards data={filteredData} isLoading={isLoading} />
        )}
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros de status</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {STATUS_OPTIONS.map(option => (
              <div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => toggleDraftStatus(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleDraftStatus(option.value)
                  }
                }}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <span>{option.label}</span>
                <Checkbox
                  checked={draftStatus.includes(option.value)}
                  onCheckedChange={() => toggleDraftStatus(option.value)}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={clearDraftFilters}>
              Limpar
            </Button>
            <Button variant="outline" onClick={() => setFiltersOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={applyStatusFilters}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

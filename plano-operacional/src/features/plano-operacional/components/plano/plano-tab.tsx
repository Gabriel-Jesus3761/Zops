import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Filter } from 'lucide-react'
import type { PDV, PlanoFilters } from '../../types'
import { PDVTable } from './pdv-table'
import { PDVCards } from './pdv-cards'

interface PlanoTabProps {
  data: PDV[]
  isLoading?: boolean
}

export function PlanoTab({ data, isLoading }: PlanoTabProps) {
  const [filters, setFilters] = useState<PlanoFilters>({
    searchText: '',
    status: [],
    setor: [],
    categoria: [],
  })
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

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
    if (filters.status.length > 0 && !filters.status.includes(pdv.Status)) {
      return false
    }

    return true
  })

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }))
  }

  const handleStatusFilter = (value: string) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, status: [] }))
    } else {
      setFilters(prev => ({
        ...prev,
        status: [value as typeof prev.status[number]]
      }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar PDV, setor, categoria..."
              value={filters.searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filters.status[0] || 'all'} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Preparação">Em Preparação</SelectItem>
              <SelectItem value="Entregue">Entregue</SelectItem>
              <SelectItem value="Devolvido">Devolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('table')}>
            Tabela
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('cards')}>
            Cards
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo PDV
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {viewMode === 'table' ? (
        <PDVTable data={filteredData} isLoading={isLoading} />
      ) : (
        <PDVCards data={filteredData} isLoading={isLoading} />
      )}
    </div>
  )
}

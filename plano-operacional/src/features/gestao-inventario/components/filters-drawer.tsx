import * as React from 'react'
import { Filter as FilterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { AssetFilters } from '../types'

interface FiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: AssetFilters
  onApply: (filters: AssetFilters) => void
  filterOptions: {
    tipo: string[]
    modelo: string[]
    adquirencia: string[]
    alocacao: string[]
    categoria_parque: string[]
    subcategoria_parque: string[]
    situacao: string[]
    detalhamento: string[]
  }
}

export function FiltersDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
  filterOptions,
}: FiltersDrawerProps) {
  const [localFilters, setLocalFilters] = React.useState<AssetFilters>(filters)

  // Safe defaults for filterOptions
  const safeFilterOptions = React.useMemo(() => ({
    tipo: filterOptions?.tipo || [],
    modelo: filterOptions?.modelo || [],
    adquirencia: filterOptions?.adquirencia || [],
    alocacao: filterOptions?.alocacao || [],
    categoria_parque: filterOptions?.categoria_parque || [],
    subcategoria_parque: filterOptions?.subcategoria_parque || [],
    situacao: filterOptions?.situacao || [],
    detalhamento: filterOptions?.detalhamento || [],
  }), [filterOptions])

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  const handleApply = () => {
    onApply(localFilters)
    onOpenChange(false)
  }

  const handleClear = () => {
    const clearedFilters: AssetFilters = {
      q: '',
      where: {},
      incompleteOnly: false,
      osOnly: false,
      osId: undefined,
      transitOnly: false,
      transitFrom: undefined,
      transitTo: undefined,
      range: undefined,
    }
    setLocalFilters(clearedFilters)
    onApply(clearedFilters)
    onOpenChange(false)
  }

  const updateFilter = (field: string, value: string | undefined) => {
    setLocalFilters(prev => {
      const newWhere = { ...prev.where }

      if (value && value !== '') {
        newWhere[field] = [value]
      } else {
        delete newWhere[field]
      }

      return {
        ...prev,
        where: newWhere,
      }
    })
  }

  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (localFilters.where) {
      Object.values(localFilters.where).forEach(value => {
        if (Array.isArray(value) && value.length > 0) count++
      })
    }
    if (localFilters.incompleteOnly) count++
    if (localFilters.osOnly) count++
    if (localFilters.transitOnly) count++
    if (localFilters.range) count++
    return count
  }, [localFilters])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto filters-drawer-animate">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <FilterIcon className="h-5 w-5 text-blue-600" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Configure filtros detalhados para refinar sua busca
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Equipamento Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Equipamento</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={localFilters.where?.tipo?.[0]}
                onValueChange={value => updateFilter('tipo', value === 'ALL' ? undefined : value)}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.tipo.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select
                value={localFilters.where?.modelo?.[0]}
                onValueChange={value => updateFilter('modelo', value)}
              >
                <SelectTrigger id="modelo">
                  <SelectValue placeholder="Todos os modelos" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.modelo.map(modelo => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adquirencia">Adquirência</Label>
              <Select
                value={localFilters.where?.adquirencia?.[0]}
                onValueChange={value => updateFilter('adquirencia', value)}
              >
                <SelectTrigger id="adquirencia">
                  <SelectValue placeholder="Todas as adquirências" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.adquirencia.map(adq => (
                    <SelectItem key={adq} value={adq}>
                      {adq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialMaquina">Serial Máquina</Label>
              <Input
                id="serialMaquina"
                placeholder="Digite o serial da máquina"
                value={localFilters.where?.serialMaquina?.[0] || ''}
                onChange={e => updateFilter('serialMaquina', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialN">Serial N</Label>
              <Input
                id="serialN"
                placeholder="Digite o serial N"
                value={localFilters.where?.serialN?.[0] || ''}
                onChange={e => updateFilter('serialN', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Status</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select
                value={localFilters.where?.situacao?.[0]}
                onValueChange={value => updateFilter('situacao', value)}
              >
                <SelectTrigger id="situacao">
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.situacao.map(sit => (
                    <SelectItem key={sit} value={sit}>
                      {sit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria Parque</Label>
              <Select
                value={localFilters.where?.categoria_parque?.[0]}
                onValueChange={value => updateFilter('categoria_parque', value)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.categoria_parque.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria">Subcategoria Parque</Label>
              <Select
                value={localFilters.where?.subcategoria_parque?.[0]}
                onValueChange={value => updateFilter('subcategoria_parque', value)}
              >
                <SelectTrigger id="subcategoria">
                  <SelectValue placeholder="Todas as subcategorias" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.subcategoria_parque.map(sub => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalhamento">Detalhamento</Label>
              <Select
                value={localFilters.where?.detalhamento?.[0]}
                onValueChange={value => updateFilter('detalhamento', value)}
              >
                <SelectTrigger id="detalhamento">
                  <SelectValue placeholder="Todos os detalhamentos" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.detalhamento.map(det => (
                    <SelectItem key={det} value={det}>
                      {det}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Localização Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Localização</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alocacao">Alocação / Filial</Label>
              <Select
                value={localFilters.where?.alocacao?.[0]}
                onValueChange={value => updateFilter('alocacao', value)}
              >
                <SelectTrigger id="alocacao">
                  <SelectValue placeholder="Todas as alocações" />
                </SelectTrigger>
                <SelectContent>
                  {safeFilterOptions.alocacao.map(aloc => (
                    <SelectItem key={aloc} value={aloc}>
                      {aloc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Tickets Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Tickets</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tickets">Máquina Tickets</Label>
              <Select
                value={localFilters.where?.tickets?.[0]}
                onValueChange={value => updateFilter('tickets', value)}
              >
                <SelectTrigger id="tickets">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Ordem de Serviço (OS) Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Ordem de Serviço (OS)</h3>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="osOnly"
                checked={localFilters.osOnly}
                onChange={e => setLocalFilters(prev => ({ ...prev, osOnly: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="osOnly" className="cursor-pointer">
                Filtrar apenas terminais em OS
              </Label>
            </div>

            {localFilters.osOnly && (
              <div className="space-y-2">
                <Label htmlFor="osId">ID da OS</Label>
                <Input
                  id="osId"
                  placeholder="Ex: ECC, ebb3acab..."
                  value={localFilters.osId || ''}
                  onChange={e => setLocalFilters(prev => ({ ...prev, osId: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Trânsito Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Trânsito</h3>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="transitOnly"
                checked={localFilters.transitOnly}
                onChange={e => setLocalFilters(prev => ({ ...prev, transitOnly: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="transitOnly" className="cursor-pointer">
                Filtrar apenas terminais em trânsito
              </Label>
            </div>

            {localFilters.transitOnly && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="transitFrom">De (Origem)</Label>
                  <Select
                    value={localFilters.transitFrom}
                    onValueChange={value => setLocalFilters(prev => ({ ...prev, transitFrom: value }))}
                  >
                    <SelectTrigger id="transitFrom">
                      <SelectValue placeholder="Selecione origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeFilterOptions.alocacao.map(filial => (
                        <SelectItem key={filial} value={filial}>
                          {filial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transitTo">Para (Destino)</Label>
                  <Select
                    value={localFilters.transitTo}
                    onValueChange={value => setLocalFilters(prev => ({ ...prev, transitTo: value }))}
                  >
                    <SelectTrigger id="transitTo">
                      <SelectValue placeholder="Selecione destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeFilterOptions.alocacao.map(filial => (
                        <SelectItem key={filial} value={filial}>
                          {filial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Datas Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Datas</h3>
            </div>

            <div className="space-y-2">
              <Label>Última Modificação</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dateStart" className="text-xs text-muted-foreground">
                    Data inicial
                  </Label>
                  <Input
                    type="date"
                    id="dateStart"
                    value={
                      localFilters.range?.start
                        ? new Date(localFilters.range.start).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => {
                      const value = e.target.value
                      setLocalFilters(prev => ({
                        ...prev,
                        range: value
                          ? {
                              field: 'ultimaModificacaoAt',
                              start: new Date(value),
                              end: prev.range?.end || new Date(),
                            }
                          : undefined,
                      }))
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateEnd" className="text-xs text-muted-foreground">
                    Data final
                  </Label>
                  <Input
                    type="date"
                    id="dateEnd"
                    value={
                      localFilters.range?.end
                        ? new Date(localFilters.range.end).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => {
                      const value = e.target.value
                      setLocalFilters(prev => ({
                        ...prev,
                        range: value
                          ? {
                              field: 'ultimaModificacaoAt',
                              start: prev.range?.start || new Date(),
                              end: new Date(value),
                            }
                          : prev.range?.start
                          ? prev.range
                          : undefined,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Qualidade do Cadastro Section */}
          <div className="space-y-4">
            <div className="filter-section-title">
              <h3 className="text-sm font-semibold text-foreground">Qualidade do Cadastro</h3>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="incompleteOnly"
                checked={localFilters.incompleteOnly}
                onChange={e => setLocalFilters(prev => ({ ...prev, incompleteOnly: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="incompleteOnly" className="cursor-pointer">
                Apenas cadastros incompletos
              </Label>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar Tudo
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

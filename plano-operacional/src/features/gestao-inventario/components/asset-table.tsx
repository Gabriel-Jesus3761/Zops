import * as React from 'react'
import { toast } from 'sonner'
import {
  History,
  MoreHorizontal,
  Edit3,
  Save,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'

import type { Asset, TablePreferences } from '../types'
import { MOTIVOS_INATIVIDADE } from '../types'

export interface AssetTableColumn {
  key: keyof Asset | 'actions'
  label: string
  width?: number
  editable?: boolean
  editType?: 'text' | 'select'
  editOptions?: string[]
  render?: (value: unknown, asset: Asset) => React.ReactNode
}

export interface AssetTableProps {
  data: Asset[]
  loading?: boolean
  selectedKeys: string[]
  onSelectionChange: (keys: string[], rows: Asset[]) => void
  onShowHistory?: (asset: Asset) => void
  onAssetUpdate?: (asset: Asset, field: keyof Asset, value: string) => Promise<void>
  columns?: AssetTableColumn[]
  preferences?: TablePreferences
  filterOptions?: {
    categoria_parque?: string[]
    subcategoria_parque?: string[]
    alocacao?: string[]
  }
}

const DEFAULT_COLUMNS: AssetTableColumn[] = [
  { key: 'tipo', label: 'Tipo', width: 100 },
  { key: 'modelo', label: 'Modelo', width: 140 },
  { key: 'adquirencia', label: 'Adquirência', width: 120 },
  { key: 'serialMaquina', label: 'Serial Máquina', width: 150 },
  { key: 'serialN', label: 'Serial N', width: 150, editable: true, editType: 'text' },
  { key: 'deviceZ', label: 'Device Z', width: 130, editable: true, editType: 'text' },
  { key: 'situacao', label: 'Situação', width: 100, editable: true, editType: 'select', editOptions: ['Good', 'Bad'] },
  { key: 'categoria_parque', label: 'Categoria', width: 140, editable: true, editType: 'select' },
  { key: 'subcategoria_parque', label: 'Subcategoria', width: 160, editable: true, editType: 'select' },
  { key: 'alocacao', label: 'Alocação', width: 200, editable: true, editType: 'select' },
  { key: 'detalhamento', label: 'Detalhamento', width: 180, editable: true, editType: 'select' },
  { key: 'actions', label: '', width: 60 },
]

interface EditingCell {
  rowId: string
  field: keyof Asset
  value: string
  originalValue: string
}

type SortConfig = {
  key: keyof Asset
  direction: 'asc' | 'desc'
} | null

export function AssetTable({
  data,
  loading = false,
  selectedKeys,
  onSelectionChange,
  onShowHistory,
  onAssetUpdate,
  columns = DEFAULT_COLUMNS,
  preferences = { density: 'middle', visibleColumns: [], pageSize: 50 },
  filterOptions = {},
}: AssetTableProps) {
  // Editing state
  const [editingCell, setEditingCell] = React.useState<EditingCell | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sorting state
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null)

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Sorted data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  // Visible columns
  const visibleColumns = React.useMemo(() => {
    if (preferences.visibleColumns.length === 0) return columns
    return columns.filter(
      col => col.key === 'actions' || preferences.visibleColumns.includes(col.key as string)
    )
  }, [columns, preferences.visibleColumns])

  // Row density classes
  const densityClasses = {
    compact: 'py-1 px-2 text-xs',
    middle: 'py-2 px-3 text-sm',
    large: 'py-3 px-4 text-base',
  }

  const cellClass = densityClasses[preferences.density]

  // Selection handlers
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
    if (selectedKeys.length === sortedData.length) {
      onSelectionChange([], [])
    } else {
      onSelectionChange(
        sortedData.map(a => a.firestoreId),
        sortedData
      )
    }
  }

  // Sorting handler
  const handleSort = (key: keyof Asset) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' }
        }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  // Edit handlers
  const startEditing = (asset: Asset, field: keyof Asset) => {
    const value = (asset[field] as string) || ''
    setEditingCell({
      rowId: asset.firestoreId,
      field,
      value,
      originalValue: value,
    })
  }

  const cancelEditing = () => {
    setEditingCell(null)
  }

  const handleEditChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value })
    }
  }

  const saveEdit = async () => {
    if (!editingCell || !onAssetUpdate) return

    const asset = sortedData.find(a => a.firestoreId === editingCell.rowId)
    if (!asset) return

    if (editingCell.value === editingCell.originalValue) {
      cancelEditing()
      return
    }

    setIsSaving(true)
    try {
      await onAssetUpdate(asset, editingCell.field, editingCell.value)
      toast.success('Ativo atualizado com sucesso!')
      cancelEditing()
    } catch (error) {
      toast.error('Erro ao atualizar ativo')
      console.error('Error updating asset:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard handler for editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para área de transferência')
  }

  // Get edit options for a field
  const getEditOptions = (column: AssetTableColumn): string[] => {
    if (column.editOptions) return column.editOptions

    switch (column.key) {
      case 'categoria_parque':
        return filterOptions.categoria_parque || []
      case 'subcategoria_parque':
        return filterOptions.subcategoria_parque || []
      case 'alocacao':
        return filterOptions.alocacao || []
      case 'detalhamento':
        return [...MOTIVOS_INATIVIDADE]
      default:
        return []
    }
  }

  // Render cell value
  const renderCellValue = (column: AssetTableColumn, asset: Asset) => {
    const isEditing =
      editingCell?.rowId === asset.firestoreId && editingCell?.field === column.key

    if (isEditing) {
      if (column.editType === 'select') {
        const options = getEditOptions(column)
        return (
          <div className="flex items-center gap-1">
            <Select
              value={editingCell.value || '__NONE__'}
              onValueChange={(value) => handleEditChange(value === '__NONE__' ? '' : value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Nenhum</SelectItem>
                {options.map(opt => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={saveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={cancelEditing}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={editingCell.value}
            onChange={e => handleEditChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={saveEdit}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={cancelEditing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    const value = asset[column.key as keyof Asset]

    // Custom render
    if (column.render) {
      return column.render(value, asset)
    }

    // Situação badge
    if (column.key === 'situacao') {
      return (
        <Badge variant={value === 'Good' ? 'default' : 'destructive'}>
          {value as string}
        </Badge>
      )
    }

    // Serial fields with monospace
    if (['serialMaquina', 'serialN', 'deviceZ'].includes(column.key as string)) {
      return (
        <span className="font-mono text-xs">{(value as string) || '-'}</span>
      )
    }

    // Editable cell with hover indicator
    if (column.editable && onAssetUpdate) {
      return (
        <div
          className="group/cell flex items-center gap-1 cursor-pointer hover:bg-muted/50 -m-1 p-1 rounded"
          onClick={() => startEditing(asset, column.key as keyof Asset)}
        >
          <span className="truncate">{(value as string) || '-'}</span>
          <Edit3 className="h-3 w-3 opacity-0 group-hover/cell:opacity-50 shrink-0" />
        </div>
      )
    }

    return <span className="truncate">{(value as string) || '-'}</span>
  }

  // Render actions menu
  const renderActions = (asset: Asset) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onShowHistory && (
          <DropdownMenuItem onClick={() => onShowHistory(asset)}>
            <History className="mr-2 h-4 w-4" />
            Ver Histórico
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => copyToClipboard(asset.serialMaquina)}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar Serial
        </DropdownMenuItem>
        {onAssetUpdate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => startEditing(asset, 'serialN')}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Serial N
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => startEditing(asset, 'deviceZ')}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Device Z
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Render sort indicator
  const renderSortIndicator = (key: keyof Asset) => {
    if (sortConfig?.key !== key) {
      return <ChevronDown className="h-3 w-3 opacity-0 group-hover/th:opacity-30" />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12" style={{ padding: cellClass.includes('py-1') ? '0.25rem 0.5rem' : '0.5rem 0.75rem' }}>
                <input
                  type="checkbox"
                  checked={selectedKeys.length === sortedData.length && sortedData.length > 0}
                  onChange={toggleAll}
                  className="rounded border-input"
                  aria-label="Selecionar todos"
                />
              </TableHead>
              {visibleColumns.map(column => (
                <TableHead
                  key={column.key}
                  className={`${cellClass} ${column.key !== 'actions' ? 'group/th cursor-pointer hover:bg-muted/70' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.key !== 'actions' && handleSort(column.key as keyof Asset)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.key !== 'actions' && renderSortIndicator(column.key as keyof Asset)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(asset => (
              <TableRow
                key={asset.firestoreId}
                className={`transition-colors ${
                  selectedKeys.includes(asset.firestoreId)
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <TableCell className={cellClass}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(asset.firestoreId)}
                    onChange={() => toggleSelection(asset)}
                    className="rounded border-input"
                    aria-label={`Selecionar ${asset.serialMaquina}`}
                  />
                </TableCell>
                {visibleColumns.map(column => (
                  <TableCell
                    key={column.key}
                    className={cellClass}
                    style={{ maxWidth: column.width }}
                  >
                    {column.key === 'actions'
                      ? renderActions(asset)
                      : renderCellValue(column, asset)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center p-4 border-t">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedData.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <p>Nenhum ativo encontrado</p>
        </div>
      )}
    </div>
  )
}

// Quick edit cell for batch operations
interface QuickEditCellProps {
  value: string
  options: string[]
  onSave: (value: string) => Promise<void>
}

export function QuickEditCell({ value, options, onSave }: QuickEditCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <SimpleTooltip content="Clique para editar">
        <button
          className="text-left w-full hover:bg-muted/50 p-1 -m-1 rounded cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {value || '-'}
        </button>
      </SimpleTooltip>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={editValue || '__NONE__'}
        onValueChange={(val) => setEditValue(val === '__NONE__' ? '' : val)}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Selecionar..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__NONE__">Nenhum</SelectItem>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => {
          setEditValue(value)
          setIsEditing(false)
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

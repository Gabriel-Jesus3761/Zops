import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimpleTooltip } from '@/components/ui/tooltip'

import type { Asset } from '../types'

interface VirtualizedAssetTableProps {
  data: Asset[]
  selectedKeys: string[]
  onSelectionChange: (keys: string[], rows: Asset[]) => void
  onShowHistory: (asset: Asset) => void
}

// Memoized row component para evitar re-renders desnecessários
const TableRow = React.memo<{
  asset: Asset
  index: number
  isSelected: boolean
  onToggle: (asset: Asset) => void
  onShowHistory: (asset: Asset) => void
}>(({ asset, index, isSelected, onToggle, onShowHistory }) => {
  return (
    <div
      className={`inventory-table-row flex items-center border-b ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      data-selected={isSelected}
      style={{
        animationDelay: `${index * 0.03}s`,
        height: '60px',
      }}
    >
      <div className="w-12 flex-shrink-0 px-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(asset)}
          className="rounded border-input cursor-pointer"
          aria-label={`Selecionar ${asset.serialMaquina}`}
        />
      </div>
      <div className="flex-1 min-w-0 px-3 inventory-text font-medium truncate">
        {asset.tipo}
      </div>
      <div className="flex-1 min-w-0 px-3 inventory-text truncate">
        {asset.modelo}
      </div>
      <div className="flex-1 min-w-0 px-3 font-mono text-xs inventory-number text-foreground truncate">
        {asset.serialMaquina}
      </div>
      <div className="flex-1 min-w-0 px-3 font-mono text-xs inventory-number text-foreground truncate">
        {asset.serialN || '-'}
      </div>
      <div className="flex-1 min-w-0 px-3 font-mono text-xs inventory-number text-foreground truncate">
        {asset.deviceZ || '-'}
      </div>
      <div className="w-28 flex-shrink-0 px-3">
        <Badge
          className={`
            ${asset.situacao === 'Good' ? 'status-badge-good' : 'status-badge-bad'}
            font-medium px-2.5 py-0.5 inventory-text
          `}
        >
          {asset.situacao}
        </Badge>
      </div>
      <div className="flex-1 min-w-0 px-3 inventory-text text-sm truncate">
        {asset.alocacao || 'Estoque'}
      </div>
      <div className="w-16 flex-shrink-0 px-3">
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
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison para otimizar re-renders
  return (
    prevProps.asset.firestoreId === nextProps.asset.firestoreId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.index === nextProps.index
  )
})

TableRow.displayName = 'TableRow'

export const VirtualizedAssetTable = React.memo<VirtualizedAssetTableProps>(({
  data,
  selectedKeys,
  onSelectionChange,
  onShowHistory,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Virtualizer para renderizar apenas linhas visíveis
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // altura estimada de cada linha
    overscan: 10, // linhas extras para renderizar fora da viewport
  })

  // Callbacks memoizados
  const handleToggleSelection = React.useCallback((asset: Asset) => {
    const key = asset.firestoreId
    const newSelectedKeys = selectedKeys.includes(key)
      ? selectedKeys.filter(k => k !== key)
      : [...selectedKeys, key]

    const newSelectedRows = data.filter(a => newSelectedKeys.includes(a.firestoreId))
    onSelectionChange(newSelectedKeys, newSelectedRows)
  }, [selectedKeys, data, onSelectionChange])

  const handleToggleAll = React.useCallback(() => {
    if (selectedKeys.length === data.length) {
      onSelectionChange([], [])
    } else {
      onSelectionChange(
        data.map(a => a.firestoreId),
        data
      )
    }
  }, [selectedKeys.length, data, onSelectionChange])

  // Memoizar dados visíveis
  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b bg-muted/50 sticky top-0 z-10">
        <div className="w-12 flex-shrink-0 p-3">
          <input
            type="checkbox"
            checked={selectedKeys.length === data.length && data.length > 0}
            onChange={handleToggleAll}
            className="rounded border-input cursor-pointer"
            aria-label="Selecionar todos"
          />
        </div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Tipo</div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Modelo</div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Serial Máquina</div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Serial N</div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Device Z</div>
        <div className="w-28 flex-shrink-0 p-3 text-left font-medium text-sm">Situação</div>
        <div className="flex-1 min-w-0 p-3 text-left font-medium text-sm">Alocação</div>
        <div className="w-16 flex-shrink-0 p-3"></div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: '600px',
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const asset = data[virtualRow.index]
            const isSelected = selectedKeys.includes(asset.firestoreId)

            return (
              <div
                key={asset.firestoreId}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TableRow
                  asset={asset}
                  index={virtualRow.index}
                  isSelected={isSelected}
                  onToggle={handleToggleSelection}
                  onShowHistory={onShowHistory}
                />
              </div>
            )
          })}
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          Nenhum ativo encontrado
        </div>
      )}
    </div>
  )
})

VirtualizedAssetTable.displayName = 'VirtualizedAssetTable'

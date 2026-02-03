import * as React from 'react'
import { toast } from 'sonner'
import {
  Edit3,
  Trash2,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { SimpleTooltip } from '@/components/ui/tooltip'

import type { Asset, BulkUpdatePayload } from '../types'
import { MOTIVOS_INATIVIDADE } from '../types'

interface BulkActionsProps {
  selectedAssets: Asset[]
  onClearSelection: () => void
  onBulkUpdate: (payload: BulkUpdatePayload) => Promise<void>
  onExport: (assets: Asset[]) => void
  filterOptions?: {
    categoria_parque?: string[]
    subcategoria_parque?: string[]
    alocacao?: string[]
  }
}

interface BulkUpdateDialogState {
  open: boolean
  field: keyof Asset | null
  fieldLabel: string
  options: string[]
}

export function BulkActions({
  selectedAssets,
  onClearSelection,
  onBulkUpdate,
  onExport,
  filterOptions = {},
}: BulkActionsProps) {
  // Dialog state
  const [dialogState, setDialogState] = React.useState<BulkUpdateDialogState>({
    open: false,
    field: null,
    fieldLabel: '',
    options: [],
  })
  const [selectedValue, setSelectedValue] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [updateProgress, setUpdateProgress] = React.useState({ current: 0, total: 0 })
  const [updateResult, setUpdateResult] = React.useState<{ success: number; failed: number } | null>(null)

  // Bulk update field options
  const bulkUpdateOptions: Array<{
    field: keyof Asset
    label: string
    options: string[]
  }> = [
    {
      field: 'situacao',
      label: 'Situação',
      options: ['Good', 'Bad'],
    },
    {
      field: 'categoria_parque',
      label: 'Categoria Parque',
      options: filterOptions.categoria_parque || [],
    },
    {
      field: 'subcategoria_parque',
      label: 'Subcategoria Parque',
      options: filterOptions.subcategoria_parque || [],
    },
    {
      field: 'alocacao',
      label: 'Alocação',
      options: filterOptions.alocacao || [],
    },
    {
      field: 'detalhamento',
      label: 'Detalhamento/Motivo',
      options: [...MOTIVOS_INATIVIDADE],
    },
  ]

  // Open bulk update dialog
  const openBulkUpdateDialog = (field: keyof Asset, label: string, options: string[]) => {
    setDialogState({
      open: true,
      field,
      fieldLabel: label,
      options,
    })
    setSelectedValue('')
    setUpdateResult(null)
  }

  // Close dialog
  const closeDialog = () => {
    setDialogState({
      open: false,
      field: null,
      fieldLabel: '',
      options: [],
    })
    setSelectedValue('')
    setUpdateResult(null)
    setUpdateProgress({ current: 0, total: 0 })
  }

  // Execute bulk update
  const handleBulkUpdate = async () => {
    if (!dialogState.field || !selectedValue) {
      toast.error('Por favor, selecione um valor')
      return
    }

    setIsUpdating(true)
    setUpdateProgress({ current: 0, total: selectedAssets.length })
    setUpdateResult(null)

    try {
      await onBulkUpdate({
        field: dialogState.field,
        value: selectedValue,
        assets: selectedAssets,
      })

      setUpdateResult({ success: selectedAssets.length, failed: 0 })
      toast.success(`${selectedAssets.length} ativos atualizados!`)

      // Close after brief delay to show success
      setTimeout(() => {
        closeDialog()
        onClearSelection()
      }, 1500)
    } catch (error) {
      console.error('Bulk update error:', error)
      setUpdateResult({ success: 0, failed: selectedAssets.length })
      toast.error('Erro ao atualizar ativos')
    } finally {
      setIsUpdating(false)
    }
  }

  // Export selected
  const handleExport = () => {
    onExport(selectedAssets)
    toast.success(`${selectedAssets.length} ativos exportados!`)
  }

  if (selectedAssets.length === 0) {
    return null
  }

  return (
    <>
      {/* Floating action bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur shadow-lg px-4 py-3">
          {/* Selection count */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm font-medium">
              {selectedAssets.length}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ativo(s) selecionado(s)
            </span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border" />

          {/* Bulk update dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit3 className="mr-2 h-4 w-4" />
                Alterar em Massa
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuLabel>Alterar campo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bulkUpdateOptions.map(option => (
                <DropdownMenuItem
                  key={option.field}
                  onClick={() =>
                    openBulkUpdateDialog(option.field, option.label, option.options)
                  }
                  disabled={option.options.length === 0}
                >
                  {option.label}
                  {option.options.length === 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      (sem opções)
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export button */}
          <SimpleTooltip content="Exportar selecionados">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </SimpleTooltip>

          {/* Clear selection button */}
          <SimpleTooltip content="Limpar seleção">
            <Button variant="ghost" size="icon" onClick={onClearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
        </div>
      </div>

      {/* Bulk update dialog */}
      <Dialog open={dialogState.open} onOpenChange={open => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alteração em Massa</DialogTitle>
            <DialogDescription>
              Alterar {dialogState.fieldLabel} de {selectedAssets.length} ativo(s)
              selecionado(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Value selection */}
            {!isUpdating && !updateResult && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Novo valor para {dialogState.fieldLabel}
                </label>
                <Select
                  value={selectedValue || '__CLEAR__'}
                  onValueChange={(val) => setSelectedValue(val === '__CLEAR__' ? '' : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__CLEAR__">Limpar (remover valor)</SelectItem>
                    {dialogState.options.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview of affected assets */}
            {!isUpdating && !updateResult && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Ativos que serão alterados:
                </label>
                <div className="rounded-md border p-3 bg-muted/50 max-h-[200px] overflow-y-auto">
                  <div className="space-y-1">
                    {selectedAssets.slice(0, 10).map(asset => (
                      <div
                        key={asset.firestoreId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-mono text-xs">
                          {asset.serialMaquina}
                        </span>
                        <span className="text-muted-foreground">
                          {asset[dialogState.field as keyof Asset] as string || '-'}
                        </span>
                      </div>
                    ))}
                    {selectedAssets.length > 10 && (
                      <p className="text-xs text-muted-foreground pt-2">
                        ... e mais {selectedAssets.length - 10} ativo(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            {isUpdating && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Atualizando ativos...</span>
                </div>
                <Progress
                  value={(updateProgress.current / updateProgress.total) * 100}
                />
                <p className="text-center text-sm text-muted-foreground">
                  {updateProgress.current} de {updateProgress.total}
                </p>
              </div>
            )}

            {/* Result */}
            {updateResult && (
              <div className="flex flex-col items-center justify-center py-4">
                {updateResult.failed === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-lg font-medium text-green-600">
                      Atualização concluída!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {updateResult.success} ativo(s) atualizado(s)
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
                    <p className="text-lg font-medium text-yellow-600">
                      Atualização parcial
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {updateResult.success} sucesso(s), {updateResult.failed} falha(s)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Warning message */}
            {!isUpdating && !updateResult && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Esta ação alterará permanentemente os dados de{' '}
                    <strong>{selectedAssets.length}</strong> ativo(s). Esta ação não
                    pode ser desfeita.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {!updateResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={isUpdating || !selectedValue}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Edit3 className="mr-2 h-4 w-4" />
                  )}
                  Alterar {selectedAssets.length} Ativo(s)
                </Button>
              </>
            ) : (
              <Button onClick={closeDialog}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Bulk delete confirmation dialog (optional, for destructive actions)
interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAssets: Asset[]
  onConfirm: () => Promise<void>
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedAssets,
  onConfirm,
}: BulkDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      toast.success(`${selectedAssets.length} ativos removidos!`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao remover ativos')
    } finally {
      setIsDeleting(false)
    }
  }

  const expectedText = `REMOVER ${selectedAssets.length}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Remover Ativos
          </DialogTitle>
          <DialogDescription>
            Você está prestes a remover permanentemente{' '}
            <strong>{selectedAssets.length}</strong> ativo(s) do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/10 p-3 text-sm">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-destructive">
                <p className="font-medium mb-1">Atenção: Esta ação é irreversível!</p>
                <p>
                  Os ativos serão permanentemente removidos do banco de dados e não
                  poderão ser recuperados.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Digite <code className="bg-muted px-1 rounded">{expectedText}</code> para
              confirmar:
            </label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={expectedText}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== expectedText}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Remover Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

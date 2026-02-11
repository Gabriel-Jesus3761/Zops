import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Settings,
  GripVertical,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { clustersService, clusterTamanhosService } from '../../services/mco-parametros.service'
import type { Cluster, ClusterFormData, ClusterTamanhoConfig, ClusterTamanhoConfigFormData } from '../../types/mco-parametros'
import { CLUSTER_LABELS_DEFAULT } from '../../types/mco-parametros'
import { toast } from 'sonner'

const emptyFormData: ClusterFormData = {
  tamanho: 'M' as any,
  nome: '',
  faturamento_piso: 0,
  faturamento_teto: 0,
  ite: 70,
  dias_setup: 0,
}

const emptyTamanhoFormData: Omit<ClusterTamanhoConfigFormData, 'ordem'> = {
  sigla: '',
  nome: '',
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formata número para exibição como moeda (input)
const formatCurrencyInput = (value: number) => {
  if (value === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formata enquanto digita
const handleCurrencyChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (value: number) => void
) => {
  const rawValue = e.target.value
  // Remove caracteres não numéricos, mantendo apenas números
  const numericValue = rawValue.replace(/\D/g, '')
  // Converte para centavos
  const cents = parseInt(numericValue, 10) || 0
  // Converte para reais
  const reais = cents / 100
  onChange(reais)
}

// Sortable row component for tamanhos
interface SortableTamanhoRowProps {
  tamanho: ClusterTamanhoConfig
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (checked: boolean) => void
}

function SortableTamanhoRow({ tamanho, onEdit, onDelete, onToggleActive }: SortableTamanhoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tamanho.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono font-bold">
          {tamanho.sigla}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{tamanho.nome}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={tamanho.ativo}
          onCheckedChange={onToggleActive}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            style={{ cursor: 'pointer' }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
            style={{ cursor: 'pointer' }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ManageClusters() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null)
  const [deletingCluster, setDeletingCluster] = useState<Cluster | null>(null)
  const [formData, setFormData] = useState<ClusterFormData>(emptyFormData)

  // Config modal state
  const [editingTamanho, setEditingTamanho] = useState<ClusterTamanhoConfig | null>(null)
  const [deletingTamanho, setDeletingTamanho] = useState<ClusterTamanhoConfig | null>(null)
  const [tamanhoFormData, setTamanhoFormData] = useState<Omit<ClusterTamanhoConfigFormData, 'ordem'>>(emptyTamanhoFormData)
  const [isAddingTamanho, setIsAddingTamanho] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const queryClient = useQueryClient()

  // Query clusters
  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['mco-clusters'],
    queryFn: () => clustersService.getClusters(),
  })

  // Query tamanhos
  const { data: tamanhos, isLoading: isLoadingTamanhos } = useQuery({
    queryKey: ['mco-cluster-tamanhos'],
    queryFn: () => clusterTamanhosService.getTamanhos(),
  })

  // Sorted tamanhos for dropdown
  const sortedTamanhos = tamanhos?.filter(t => t.ativo).sort((a, b) => a.ordem - b.ordem) || []

  // Cluster mutations
  const createMutation = useMutation({
    mutationFn: clustersService.createCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-clusters'] })
      handleClose()
      toast.success('Cluster criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cluster')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClusterFormData> }) =>
      clustersService.updateCluster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-clusters'] })
      handleClose()
      toast.success('Cluster atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cluster')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: clustersService.deleteCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-clusters'] })
      setDeletingCluster(null)
      toast.success('Cluster excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir cluster')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      clustersService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-clusters'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  // Tamanho mutations
  const createTamanhoMutation = useMutation({
    mutationFn: clusterTamanhosService.createTamanho,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cluster-tamanhos'] })
      setIsAddingTamanho(false)
      setTamanhoFormData(emptyTamanhoFormData)
      toast.success('Tamanho criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tamanho')
    },
  })

  const updateTamanhoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClusterTamanhoConfigFormData> }) =>
      clusterTamanhosService.updateTamanho(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cluster-tamanhos'] })
      setEditingTamanho(null)
      setTamanhoFormData(emptyTamanhoFormData)
      toast.success('Tamanho atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tamanho')
    },
  })

  const deleteTamanhoMutation = useMutation({
    mutationFn: clusterTamanhosService.deleteTamanho,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cluster-tamanhos'] })
      setDeletingTamanho(null)
      toast.success('Tamanho excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir tamanho')
    },
  })

  const toggleTamanhoActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      clusterTamanhosService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cluster-tamanhos'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  const reorderTamanhosMutation = useMutation({
    mutationFn: clusterTamanhosService.reorderTamanhos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cluster-tamanhos'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao reordenar')
    },
  })

  useEffect(() => {
    if (editingCluster) {
      setFormData({
        tamanho: editingCluster.tamanho,
        nome: editingCluster.nome,
        faturamento_piso: editingCluster.faturamento_piso,
        faturamento_teto: editingCluster.faturamento_teto,
        ite: editingCluster.ite,
        dias_setup: editingCluster.dias_setup,
      })
    }
  }, [editingCluster])

  useEffect(() => {
    if (editingTamanho) {
      setTamanhoFormData({
        sigla: editingTamanho.sigla,
        nome: editingTamanho.nome,
      })
    }
  }, [editingTamanho])

  const handleOpen = (cluster?: Cluster) => {
    if (cluster) {
      setEditingCluster(cluster)
    } else {
      // When creating new cluster, set default nome based on default tamanho
      const defaultTamanho = sortedTamanhos.find(t => t.sigla === emptyFormData.tamanho)
      const defaultNome = defaultTamanho?.nome || CLUSTER_LABELS_DEFAULT[emptyFormData.tamanho] || emptyFormData.tamanho
      setFormData({ ...emptyFormData, nome: defaultNome })
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingCluster(null)
    setFormData(emptyFormData)
  }

  const handleSave = () => {
    if (editingCluster) {
      updateMutation.mutate({ id: editingCluster.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (deletingCluster) {
      deleteMutation.mutate(deletingCluster.id)
    }
  }

  const handleSaveTamanho = () => {
    if (editingTamanho) {
      updateTamanhoMutation.mutate({ id: editingTamanho.id, data: tamanhoFormData })
    } else {
      // Calculate the next order number
      const maxOrdem = tamanhos?.reduce((max, t) => Math.max(max, t.ordem), 0) || 0
      createTamanhoMutation.mutate({ ...tamanhoFormData, ordem: maxOrdem + 1 })
    }
  }

  const handleDeleteTamanho = () => {
    if (deletingTamanho) {
      deleteTamanhoMutation.mutate(deletingTamanho.id)
    }
  }

  const handleCloseConfig = () => {
    setIsConfigOpen(false)
    setEditingTamanho(null)
    setIsAddingTamanho(false)
    setTamanhoFormData(emptyTamanhoFormData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sortedItems = tamanhos?.sort((a, b) => a.ordem - b.ordem) || []
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
      const newIndex = sortedItems.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sortedItems, oldIndex, newIndex)
        const reorderData = newItems.map((item, index) => ({
          id: item.id,
          ordem: index + 1,
        }))
        reorderTamanhosMutation.mutate(reorderData)
      }
    }
  }

  const sortedClusters = clusters?.sort((a, b) => {
    // Sort by order from tamanhos config
    const orderMap = sortedTamanhos.reduce((acc, t, idx) => {
      acc[t.sigla] = idx
      return acc
    }, {} as Record<string, number>)

    const orderA = orderMap[a.tamanho] ?? 999
    const orderB = orderMap[b.tamanho] ?? 999
    return orderA - orderB
  })

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Clusters de Eventos</h3>
          <p className="text-sm text-muted-foreground">
            Categorias de tamanho baseadas no faturamento por sessão
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsConfigOpen(true)} style={{ cursor: 'pointer' }}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar Tamanhos
          </Button>
          <Button onClick={() => handleOpen()} style={{ cursor: 'pointer' }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cluster
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erro ao carregar clusters'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && sortedClusters && (
        <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tamanho</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Faturamento Mín.</TableHead>
                <TableHead className="text-right">Faturamento Máx.</TableHead>
                <TableHead className="text-center">ITE</TableHead>
                <TableHead className="text-center">Dias Setup</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClusters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum cluster cadastrado. Clique em "Novo Cluster" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                sortedClusters.map((cluster, index) => (
                  <TableRow
                    key={cluster.id}
                    className={index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
                  >
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold">
                        {cluster.tamanho}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{cluster.nome}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(cluster.faturamento_piso)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(cluster.faturamento_teto)}
                    </TableCell>
                    <TableCell className="text-center">{cluster.ite}</TableCell>
                    <TableCell className="text-center">
                      {cluster.dias_setup > 0 ? (
                        <Badge variant="secondary">{cluster.dias_setup} dias</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={cluster.ativo}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: cluster.id, ativo: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpen(cluster)} style={{ cursor: 'pointer' }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingCluster(cluster)}
                          className="text-destructive hover:text-destructive"
                          style={{ cursor: 'pointer' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Cluster Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              {editingCluster ? 'Editar Cluster' : 'Novo Cluster'}
            </DialogTitle>
            <DialogDescription>
              {editingCluster
                ? 'Atualize as informações do cluster'
                : 'Preencha os dados para criar um novo cluster'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={formData.tamanho}
                onValueChange={(value) => {
                  const selectedTamanho = sortedTamanhos.find(t => t.sigla === value)
                  const nome = selectedTamanho?.nome || CLUSTER_LABELS_DEFAULT[value] || value
                  setFormData({ ...formData, tamanho: value as any, nome })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {sortedTamanhos.length > 0 ? (
                    sortedTamanhos.map((tamanho) => (
                      <SelectItem key={tamanho.id} value={tamanho.sigla}>
                        {tamanho.nome} ({tamanho.sigla})
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback to default if no tamanhos configured
                    Object.entries(CLUSTER_LABELS_DEFAULT).map(([sigla, nome]) => (
                      <SelectItem key={sigla} value={sigla}>
                        {nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Faturamento Mínimo</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(formData.faturamento_piso)}
                  onChange={(e) => handleCurrencyChange(e, (value) =>
                    setFormData({ ...formData, faturamento_piso: value })
                  )}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Faturamento Máximo</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(formData.faturamento_teto)}
                  onChange={(e) => handleCurrencyChange(e, (value) =>
                    setFormData({ ...formData, faturamento_teto: value })
                  )}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ITE (Índice Técnico)</Label>
                <Input
                  type="number"
                  value={formData.ite}
                  onChange={(e) => setFormData({ ...formData, ite: Number(e.target.value) })}
                  placeholder="70"
                />
                <p className="text-xs text-muted-foreground">Terminais por técnico</p>
              </div>

              <div className="space-y-2">
                <Label>Dias de Setup</Label>
                <Input
                  type="number"
                  value={formData.dias_setup}
                  onChange={(e) => setFormData({ ...formData, dias_setup: Number(e.target.value) })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Dias antes do Go Live</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} style={{ cursor: 'pointer' }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              style={{ cursor: 'pointer' }}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingCluster ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Tamanhos Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={handleCloseConfig}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              Configurar Tamanhos de Cluster
            </DialogTitle>
            <DialogDescription>
              Gerencie as opções disponíveis no dropdown de tamanho
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {tamanhos?.length || 0} tamanho(s) configurado(s)
              </p>
              <Button size="sm" onClick={() => setIsAddingTamanho(true)} style={{ cursor: 'pointer' }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tamanho
              </Button>
            </div>

            {/* Add/Edit Form */}
            {(isAddingTamanho || editingTamanho) && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sigla</Label>
                      <Input
                        value={tamanhoFormData.sigla}
                        onChange={(e) => setTamanhoFormData({ ...tamanhoFormData, sigla: e.target.value.toUpperCase() })}
                        placeholder="PP"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={tamanhoFormData.nome}
                        onChange={(e) => setTamanhoFormData({ ...tamanhoFormData, nome: e.target.value })}
                        placeholder="Pequeno Porte"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingTamanho(false)
                        setEditingTamanho(null)
                        setTamanhoFormData(emptyTamanhoFormData)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTamanho}
                      disabled={createTamanhoMutation.isPending || updateTamanhoMutation.isPending}
                      style={{ cursor: 'pointer' }}
                    >
                      {(createTamanhoMutation.isPending || updateTamanhoMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingTamanho ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tamanhos List */}
            {isLoadingTamanhos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tamanhos && tamanhos.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Sigla</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center w-20">Ativo</TableHead>
                      <TableHead className="text-right w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tamanhos.sort((a, b) => a.ordem - b.ordem).map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>
                        {tamanhos.sort((a, b) => a.ordem - b.ordem).map((tamanho) => (
                          <SortableTamanhoRow
                            key={tamanho.id}
                            tamanho={tamanho}
                            onEdit={() => setEditingTamanho(tamanho)}
                            onDelete={() => setDeletingTamanho(tamanho)}
                            onToggleActive={(checked) =>
                              toggleTamanhoActiveMutation.mutate({ id: tamanho.id, ativo: checked })
                            }
                          />
                        ))}
                      </TableBody>
                    </SortableContext>
                  </DndContext>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum tamanho configurado.</p>
                <p className="text-sm">Clique em "Novo Tamanho" para adicionar.</p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleCloseConfig} style={{ cursor: 'pointer' }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cluster Confirmation */}
      <AlertDialog open={!!deletingCluster} onOpenChange={() => setDeletingCluster(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cluster "{deletingCluster?.nome}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ cursor: 'pointer' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              style={{ cursor: 'pointer' }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tamanho Confirmation */}
      <AlertDialog open={!!deletingTamanho} onOpenChange={() => setDeletingTamanho(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tamanho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tamanho "{deletingTamanho?.sigla} - {deletingTamanho?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ cursor: 'pointer' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTamanho}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              style={{ cursor: 'pointer' }}
            >
              {deleteTamanhoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

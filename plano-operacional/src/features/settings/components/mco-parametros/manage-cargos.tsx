import { useState, useEffect, useMemo } from 'react'
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
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  Settings,
  GripVertical,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { cargosService, cargoTimesService, cargoCalculoParametrosService } from '../../services/mco-parametros.service'
import type { Cargo, CargoFormData, CargoTimeConfig, CargoTimeConfigFormData, CargoCalculoParametros, CargoCalculoParametrosFormData } from '../../types/mco-parametros'
import { CARGO_TIME_LABELS } from '../../types/mco-parametros'
import { toast } from 'sonner'

const emptyFormData: CargoFormData = {
  nome: '',
  sigla: '',
  time: 'tecnico',
  descricao: '',
  valor_diaria: 0,
  ordem: 0,
}

const emptyTimeFormData: Omit<CargoTimeConfigFormData, 'ordem'> = {
  sigla: '',
  nome: '',
}

// Gera sigla automaticamente a partir do nome
const generateSigla = (nome: string): string => {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

const getTimeBadgeVariant = (time: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (time) {
    case 'lideranca':
      return 'default'
    case 'tecnico':
      return 'secondary'
    case 'comercial':
      return 'outline'
    default:
      return 'outline'
  }
}

// Sortable row component for times
interface SortableTimeRowProps {
  time: CargoTimeConfig
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (checked: boolean) => void
}

function SortableTimeRow({ time, onEdit, onDelete, onToggleActive }: SortableTimeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: time.id })

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
      <TableCell className="font-medium">{time.nome}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={time.ativo}
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

// Sortable row component for cargos
interface SortableCargoRowProps {
  cargo: Cargo
  index: number
  getTimeLabel: (timeSigla: string) => string
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (checked: boolean) => void
}

function SortableCargoRow({ cargo, index, getTimeLabel, onEdit, onDelete, onToggleActive }: SortableCargoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cargo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
    >
      <TableCell className="text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono font-bold">
          {cargo.sigla}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{cargo.nome}</TableCell>
      <TableCell>
        <Badge variant={getTimeBadgeVariant(cargo.time)}>
          {getTimeLabel(cargo.time)}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={cargo.ativo}
          onCheckedChange={onToggleActive}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} style={{ cursor: 'pointer' }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
            style={{ cursor: 'pointer' }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ManageCargos() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)
  const [deletingCargo, setDeletingCargo] = useState<Cargo | null>(null)
  const [formData, setFormData] = useState<CargoFormData>(emptyFormData)

  // Config modal state
  const [editingTime, setEditingTime] = useState<CargoTimeConfig | null>(null)
  const [deletingTime, setDeletingTime] = useState<CargoTimeConfig | null>(null)
  const [timeFormData, setTimeFormData] = useState<Omit<CargoTimeConfigFormData, 'ordem'>>(emptyTimeFormData)
  const [isAddingTime, setIsAddingTime] = useState(false)

  // Calculation parameters state
  const [maximoTecnicosPorLider, setMaximoTecnicosPorLider] = useState<number>(10)
  const [cargoTecnicoId, setCargoTecnicoId] = useState<string>('')
  const [cargoLiderId, setCargoLiderId] = useState<string>('')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const queryClient = useQueryClient()

  const { data: cargos, isLoading, error } = useQuery({
    queryKey: ['mco-cargos'],
    queryFn: () => cargosService.getCargos(),
  })

  // Query times
  const { data: times, isLoading: isLoadingTimes } = useQuery({
    queryKey: ['mco-cargo-times'],
    queryFn: () => cargoTimesService.getTimes(),
  })

  // Sorted times for dropdown
  const sortedTimes = times?.filter(t => t.ativo).sort((a, b) => a.ordem - b.ordem) || []

  // Query calculation parameters
  const { data: calculoParametros } = useQuery({
    queryKey: ['mco-cargo-calculo-parametros'],
    queryFn: () => cargoCalculoParametrosService.getParametros(),
  })

  // Update local state when parameters are loaded
  useEffect(() => {
    if (calculoParametros) {
      setMaximoTecnicosPorLider(calculoParametros.maximo_tecnicos_por_lider)
      setCargoTecnicoId(calculoParametros.cargo_tecnico_id || '')
      setCargoLiderId(calculoParametros.cargo_lider_id || '')
    }
  }, [calculoParametros])

  const createMutation = useMutation({
    mutationFn: cargosService.createCargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
      handleClose()
      toast.success('Cargo criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cargo')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CargoFormData> }) =>
      cargosService.updateCargo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
      handleClose()
      toast.success('Cargo atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cargo')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: cargosService.deleteCargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
      setDeletingCargo(null)
      toast.success('Cargo excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir cargo')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      cargosService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  // Time mutations
  const createTimeMutation = useMutation({
    mutationFn: cargoTimesService.createTime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-times'] })
      setIsAddingTime(false)
      setTimeFormData(emptyTimeFormData)
      toast.success('Time criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar time')
    },
  })

  const updateTimeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CargoTimeConfigFormData> }) =>
      cargoTimesService.updateTime(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-times'] })
      setEditingTime(null)
      setTimeFormData(emptyTimeFormData)
      toast.success('Time atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar time')
    },
  })

  const deleteTimeMutation = useMutation({
    mutationFn: cargoTimesService.deleteTime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-times'] })
      setDeletingTime(null)
      toast.success('Time excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir time')
    },
  })

  const toggleTimeActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      cargoTimesService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-times'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  const reorderTimesMutation = useMutation({
    mutationFn: cargoTimesService.reorderTimes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-times'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao reordenar')
    },
  })

  const reorderCargosMutation = useMutation({
    mutationFn: cargosService.reorderCargos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao reordenar cargos')
    },
  })

  const saveCalculoParametrosMutation = useMutation({
    mutationFn: cargoCalculoParametrosService.saveParametros,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-calculo-parametros'] })
      toast.success('Parâmetros de cálculo salvos com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar parâmetros')
    },
  })

  useEffect(() => {
    if (editingCargo) {
      setFormData({
        nome: editingCargo.nome,
        sigla: editingCargo.sigla,
        time: editingCargo.time,
        descricao: editingCargo.descricao || '',
        valor_diaria: editingCargo.valor_diaria,
        ordem: editingCargo.ordem,
      })
    }
  }, [editingCargo])

  useEffect(() => {
    if (editingTime) {
      setTimeFormData({
        sigla: editingTime.sigla,
        nome: editingTime.nome,
      })
    }
  }, [editingTime])

  // Dynamic calculation preview
  const exemploCalculo = useMemo(() => {
    const tcas = 30
    const lideres = Math.ceil(tcas / maximoTecnicosPorLider)
    const tecnicosCampo = tcas
    const totalColaboradores = lideres + tcas
    return { tcas, lideres, tecnicosCampo, totalColaboradores }
  }, [maximoTecnicosPorLider])

  const handleSaveCalculoParametros = () => {
    const data: CargoCalculoParametrosFormData = {
      maximo_tecnicos_por_lider: maximoTecnicosPorLider,
      cargo_tecnico_id: cargoTecnicoId || null,
      cargo_lider_id: cargoLiderId || null,
    }
    saveCalculoParametrosMutation.mutate(data)
  }

  const handleOpen = (cargo?: Cargo) => {
    if (cargo) {
      setEditingCargo(cargo)
    } else {
      setFormData(emptyFormData)
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingCargo(null)
    setFormData(emptyFormData)
  }

  const handleSave = () => {
    if (editingCargo) {
      updateMutation.mutate({ id: editingCargo.id, data: formData })
    } else {
      const maxOrdem = cargos?.reduce((max, c) => Math.max(max, c.ordem), 0) || 0
      createMutation.mutate({ ...formData, ordem: maxOrdem + 1 })
    }
  }

  const handleDelete = () => {
    if (deletingCargo) {
      deleteMutation.mutate(deletingCargo.id)
    }
  }

  const handleSaveTime = () => {
    const dataWithSigla = { ...timeFormData, sigla: generateSigla(timeFormData.nome) }
    if (editingTime) {
      updateTimeMutation.mutate({ id: editingTime.id, data: dataWithSigla })
    } else {
      const maxOrdem = times?.reduce((max, t) => Math.max(max, t.ordem), 0) || 0
      createTimeMutation.mutate({ ...dataWithSigla, ordem: maxOrdem + 1 })
    }
  }

  const handleDeleteTime = () => {
    if (deletingTime) {
      deleteTimeMutation.mutate(deletingTime.id)
    }
  }

  const handleCloseConfig = () => {
    setIsConfigOpen(false)
    setEditingTime(null)
    setIsAddingTime(false)
    setTimeFormData(emptyTimeFormData)
  }

  const handleTimeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sortedItems = times?.sort((a, b) => a.ordem - b.ordem) || []
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
      const newIndex = sortedItems.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sortedItems, oldIndex, newIndex)
        const reorderData = newItems.map((item, index) => ({
          id: item.id,
          ordem: index + 1,
        }))
        reorderTimesMutation.mutate(reorderData)
      }
    }
  }

  const handleCargoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sorted = cargos?.sort((a, b) => a.ordem - b.ordem) || []
      const oldIndex = sorted.findIndex((item) => item.id === active.id)
      const newIndex = sorted.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sorted, oldIndex, newIndex)
        const reorderData = newItems.map((item, index) => ({
          id: item.id,
          ordem: index + 1,
        }))
        reorderCargosMutation.mutate(reorderData)
      }
    }
  }

  // Helper to get time label - prefer dynamic times, fallback to static labels
  const getTimeLabel = (timeSigla: string): string => {
    const dynamicTime = times?.find(t => t.sigla === timeSigla)
    if (dynamicTime) return dynamicTime.nome
    return CARGO_TIME_LABELS[timeSigla as keyof typeof CARGO_TIME_LABELS] || timeSigla
  }

  const sortedCargos = cargos?.sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-6">
      {/* Parâmetros de Cálculo Card */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Parâmetros de Cálculo</CardTitle>
          </div>
          <CardDescription>
            Configure a proporção entre técnicos e líderes e defina quais cargos participam do cálculo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maximo-tecnicos">Máximo de Técnicos por Líder</Label>
              <Input
                id="maximo-tecnicos"
                type="number"
                min={1}
                max={50}
                value={maximoTecnicosPorLider}
                onChange={(e) => setMaximoTecnicosPorLider(parseInt(e.target.value) || 1)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Cada líder supervisiona até este número de técnicos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo-tecnico">Cargo Técnico</Label>
              <Select value={cargoTecnicoId} onValueChange={setCargoTecnicoId}>
                <SelectTrigger id="cargo-tecnico">
                  <SelectValue placeholder="Selecione o cargo técnico" />
                </SelectTrigger>
                <SelectContent>
                  {sortedCargos?.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.sigla} - {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cargo que representa o técnico de campo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo-lider">Cargo Líder</Label>
              <Select value={cargoLiderId} onValueChange={setCargoLiderId}>
                <SelectTrigger id="cargo-lider">
                  <SelectValue placeholder="Selecione o cargo líder" />
                </SelectTrigger>
                <SelectContent>
                  {sortedCargos?.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.sigla} - {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cargo que representa o líder da equipe
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveCalculoParametros}
              disabled={saveCalculoParametrosMutation.isPending}
              style={{ cursor: 'pointer' }}
            >
              {saveCalculoParametrosMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Parâmetro
            </Button>
          </div>

          {/* Preview do cálculo */}
          <div className="bg-background/60 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Exemplo de Cálculo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">TCAs Calculados</span>
                <p className="text-xl font-semibold">{exemploCalculo.tcas}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">
                  Líderes (⌈{exemploCalculo.tcas} ÷ {maximoTecnicosPorLider}⌉)
                </span>
                <p className="text-xl font-semibold text-primary">+{exemploCalculo.lideres}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Técnicos de Campo</span>
                <p className="text-xl font-semibold">{exemploCalculo.tecnicosCampo}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Total Colaboradores</span>
                <p className="text-xl font-semibold text-chart-1">{exemploCalculo.totalColaboradores}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Fórmula: TCAs = Terminais ÷ ITE | Líderes = ⌈TCAs ÷ {maximoTecnicosPorLider}⌉ | <strong>Total = TCAs + Líderes</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cargos Operacionais</h3>
          <p className="text-sm text-muted-foreground">
            Funções da equipe com valores de diária
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsConfigOpen(true)} style={{ cursor: 'pointer' }}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar Times
          </Button>
          <Button onClick={() => handleOpen()} style={{ cursor: 'pointer' }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cargo
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
            {error instanceof Error ? error.message : 'Erro ao carregar cargos'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && sortedCargos && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCargoDragEnd}
        >
          <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext
                items={sortedCargos.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {sortedCargos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum cargo cadastrado. Clique em "Novo Cargo" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCargos.map((cargo, index) => (
                      <SortableCargoRow
                        key={cargo.id}
                        cargo={cargo}
                        index={index}
                        getTimeLabel={getTimeLabel}
                        onEdit={() => handleOpen(cargo)}
                        onDelete={() => setDeletingCargo(cargo)}
                        onToggleActive={(checked) =>
                          toggleActiveMutation.mutate({ id: cargo.id, ativo: checked })
                        }
                      />
                    ))
                  )}
                </TableBody>
              </SortableContext>
            </Table>
          </div>
        </DndContext>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              {editingCargo ? 'Editar Cargo' : 'Novo Cargo'}
            </DialogTitle>
            <DialogDescription>
              {editingCargo
                ? 'Atualize as informações do cargo'
                : 'Preencha os dados para criar um novo cargo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sigla</Label>
                <Input
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                  placeholder="Ex: TCA"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData({ ...formData, time: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um time" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedTimes.length > 0 ? (
                      sortedTimes.map((time) => (
                        <SelectItem key={time.id} value={time.sigla}>
                          {time.nome}
                        </SelectItem>
                      ))
                    ) : (
                      Object.entries(CARGO_TIME_LABELS).map(([sigla, nome]) => (
                        <SelectItem key={sigla} value={sigla}>
                          {nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome do Cargo</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Técnico de Campo"
              />
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
              {editingCargo ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Times Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={handleCloseConfig}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              Configurar Times
            </DialogTitle>
            <DialogDescription>
              Gerencie as opções disponíveis no dropdown de time
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {times?.length || 0} time(s) configurado(s)
              </p>
              <Button size="sm" onClick={() => setIsAddingTime(true)} style={{ cursor: 'pointer' }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Time
              </Button>
            </div>

            {/* Add/Edit Form */}
            {(isAddingTime || editingTime) && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={timeFormData.nome}
                      onChange={(e) => setTimeFormData({ ...timeFormData, nome: e.target.value })}
                      placeholder="Time Alpha"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingTime(false)
                        setEditingTime(null)
                        setTimeFormData(emptyTimeFormData)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTime}
                      disabled={createTimeMutation.isPending || updateTimeMutation.isPending}
                      style={{ cursor: 'pointer' }}
                    >
                      {(createTimeMutation.isPending || updateTimeMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingTime ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Times List */}
            {isLoadingTimes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : times && times.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTimeDragEnd}
              >
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-center w-20">Ativo</TableHead>
                        <TableHead className="text-right w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <SortableContext
                      items={times.sort((a, b) => a.ordem - b.ordem).map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>
                        {times.sort((a, b) => a.ordem - b.ordem).map((time) => (
                          <SortableTimeRow
                            key={time.id}
                            time={time}
                            onEdit={() => setEditingTime(time)}
                            onDelete={() => setDeletingTime(time)}
                            onToggleActive={(checked) =>
                              toggleTimeActiveMutation.mutate({ id: time.id, ativo: checked })
                            }
                          />
                        ))}
                      </TableBody>
                    </SortableContext>
                  </Table>
                </div>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum time configurado.</p>
                <p className="text-sm">Clique em "Novo Time" para adicionar.</p>
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

      {/* Delete Cargo Confirmation */}
      <AlertDialog open={!!deletingCargo} onOpenChange={() => setDeletingCargo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cargo "{deletingCargo?.nome}"? Esta ação não pode
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

      {/* Delete Time Confirmation */}
      <AlertDialog open={!!deletingTime} onOpenChange={() => setDeletingTime(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Time</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o time "{deletingTime?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ cursor: 'pointer' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTime}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              style={{ cursor: 'pointer' }}
            >
              {deleteTimeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

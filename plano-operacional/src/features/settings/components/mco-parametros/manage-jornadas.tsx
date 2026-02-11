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
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Sun,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { jornadasService } from '../../services/mco-parametros.service'
import type { Jornada, JornadaFormData } from '../../types/mco-parametros'
import { toast } from 'sonner'

const emptyFormData: JornadaFormData = {
  nome: '',
  hora_inicio: '08:00',
  hora_fim: '18:00',
}

// Sortable row component for jornadas
interface SortableJornadaRowProps {
  jornada: Jornada
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (checked: boolean) => void
}

function SortableJornadaRow({ jornada, index, onEdit, onDelete, onToggleActive }: SortableJornadaRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: jornada.id })

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
      <TableCell className="font-medium">{jornada.nome}</TableCell>
      <TableCell className="text-center font-mono">{jornada.hora_inicio}</TableCell>
      <TableCell className="text-center font-mono">{jornada.hora_fim}</TableCell>
      <TableCell className="text-center">
        <Badge variant="outline">{Math.round(jornada.duracao_horas)}h</Badge>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={jornada.ativo}
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

export function ManageJornadas() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingJornada, setEditingJornada] = useState<Jornada | null>(null)
  const [deletingJornada, setDeletingJornada] = useState<Jornada | null>(null)
  const [formData, setFormData] = useState<JornadaFormData>(emptyFormData)

  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data: jornadas, isLoading, error } = useQuery({
    queryKey: ['mco-jornadas'],
    queryFn: () => jornadasService.getJornadas(),
  })

  const createMutation = useMutation({
    mutationFn: jornadasService.createJornada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
      handleClose()
      toast.success('Jornada criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar jornada')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JornadaFormData> }) =>
      jornadasService.updateJornada(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
      handleClose()
      toast.success('Jornada atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar jornada')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: jornadasService.deleteJornada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
      setDeletingJornada(null)
      toast.success('Jornada excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir jornada')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      jornadasService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  const reorderJornadasMutation = useMutation({
    mutationFn: jornadasService.reorderJornadas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao reordenar jornadas')
    },
  })

  useEffect(() => {
    if (editingJornada) {
      setFormData({
        nome: editingJornada.nome,
        hora_inicio: editingJornada.hora_inicio,
        hora_fim: editingJornada.hora_fim,
      })
    }
  }, [editingJornada])

  const handleOpen = (jornada?: Jornada) => {
    if (jornada) {
      setEditingJornada(jornada)
    } else {
      setFormData(emptyFormData)
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingJornada(null)
    setFormData(emptyFormData)
  }

  const handleSave = () => {
    if (editingJornada) {
      updateMutation.mutate({ id: editingJornada.id, data: formData })
    } else {
      const maxOrdem = jornadas?.reduce((max, j) => Math.max(max, j.ordem), 0) || 0
      createMutation.mutate({ ...formData, ordem: maxOrdem + 1 } as any)
    }
  }

  const handleDelete = () => {
    if (deletingJornada) {
      deleteMutation.mutate(deletingJornada.id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sorted = jornadas?.sort((a, b) => a.ordem - b.ordem) || []
      const oldIndex = sorted.findIndex((item) => item.id === active.id)
      const newIndex = sorted.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sorted, oldIndex, newIndex)
        const reorderData = newItems.map((item, index) => ({
          id: item.id,
          ordem: index + 1,
        }))
        reorderJornadasMutation.mutate(reorderData)
      }
    }
  }

  const sortedJornadas = jornadas?.sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Jornadas de Trabalho</h3>
          <p className="text-sm text-muted-foreground">
            Horários de trabalho com cálculo automático de duração
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Jornada
        </Button>
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
            {error instanceof Error ? error.message : 'Erro ao carregar jornadas'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && sortedJornadas && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Início</TableHead>
                  <TableHead className="text-center">Fim</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext
                items={sortedJornadas.map((j) => j.id)}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {sortedJornadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma jornada cadastrada. Clique em "Nova Jornada" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedJornadas.map((jornada, index) => (
                      <SortableJornadaRow
                        key={jornada.id}
                        jornada={jornada}
                        index={index}
                        onEdit={() => handleOpen(jornada)}
                        onDelete={() => setDeletingJornada(jornada)}
                        onToggleActive={(checked) =>
                          toggleActiveMutation.mutate({ id: jornada.id, ativo: checked })
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              {editingJornada ? 'Editar Jornada' : 'Nova Jornada'}
            </DialogTitle>
            <DialogDescription>
              {editingJornada
                ? 'Atualize as informações da jornada'
                : 'Preencha os dados para criar uma nova jornada'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Jornada</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Diurna"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
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
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingJornada ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingJornada} onOpenChange={() => setDeletingJornada(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Jornada</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a jornada "{deletingJornada?.nome}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

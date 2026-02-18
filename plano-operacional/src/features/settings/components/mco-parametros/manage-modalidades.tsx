import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Workflow,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import { modalidadesService } from '../../services/mco-parametros.service'
import type { Modalidade, ModalidadeFormData } from '../../types/mco-parametros'
import { toast } from 'sonner'

const emptyFormData: ModalidadeFormData = {
  nome: '',
  descricao: '',
  tpv_por_terminal: 0,
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function ManageModalidades() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingModalidade, setEditingModalidade] = useState<Modalidade | null>(null)
  const [deletingModalidade, setDeletingModalidade] = useState<Modalidade | null>(null)
  const [formData, setFormData] = useState<ModalidadeFormData>(emptyFormData)

  const queryClient = useQueryClient()

  const { data: modalidades, isLoading, error } = useQuery({
    queryKey: ['mco-modalidades'],
    queryFn: () => modalidadesService.getModalidades(),
  })

  const createMutation = useMutation({
    mutationFn: modalidadesService.createModalidade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-modalidades'] })
      handleClose()
      toast.success('Modalidade criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar modalidade')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModalidadeFormData> }) =>
      modalidadesService.updateModalidade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-modalidades'] })
      handleClose()
      toast.success('Modalidade atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar modalidade')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: modalidadesService.deleteModalidade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-modalidades'] })
      setDeletingModalidade(null)
      toast.success('Modalidade excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir modalidade')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      modalidadesService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-modalidades'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  useEffect(() => {
    if (editingModalidade) {
      setFormData({
        nome: editingModalidade.nome,
        descricao: editingModalidade.descricao || '',
        tpv_por_terminal: editingModalidade.tpv_por_terminal,
      })
    }
  }, [editingModalidade])

  const handleOpen = (modalidade?: Modalidade) => {
    if (modalidade) {
      setEditingModalidade(modalidade)
    } else {
      setFormData(emptyFormData)
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingModalidade(null)
    setFormData(emptyFormData)
  }

  const handleSave = () => {
    if (editingModalidade) {
      updateMutation.mutate({ id: editingModalidade.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (deletingModalidade) {
      deleteMutation.mutate(deletingModalidade.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modalidades Operacionais</h3>
          <p className="text-sm text-muted-foreground">
            Tipos de operação com TPV (Taxa por Volume) diferente
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Modalidade
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
            {error instanceof Error ? error.message : 'Erro ao carregar modalidades'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && modalidades && (
        <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">TPV por Terminal</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modalidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma modalidade cadastrada. Clique em "Nova Modalidade" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                modalidades.map((modalidade, index) => (
                  <TableRow
                    key={modalidade.id}
                    className={index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">{modalidade.nome}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {modalidade.descricao || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(modalidade.tpv_por_terminal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={modalidade.ativo}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: modalidade.id, ativo: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpen(modalidade)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingModalidade(modalidade)}
                          className="text-destructive hover:text-destructive"
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

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              {editingModalidade ? 'Editar Modalidade' : 'Nova Modalidade'}
            </DialogTitle>
            <DialogDescription>
              {editingModalidade
                ? 'Atualize as informações da modalidade'
                : 'Preencha os dados para criar uma nova modalidade'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Modalidade</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Self-Service"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da modalidade operacional"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>TPV por Terminal (R$)</Label>
              <Input
                type="number"
                value={formData.tpv_por_terminal}
                onChange={(e) =>
                  setFormData({ ...formData, tpv_por_terminal: Number(e.target.value) })
                }
                placeholder="15000"
              />
              <p className="text-xs text-muted-foreground">
                Taxa por Volume - valor médio transacionado por terminal
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingModalidade ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingModalidade} onOpenChange={() => setDeletingModalidade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modalidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a modalidade "{deletingModalidade?.nome}"? Esta ação
              não pode ser desfeita.
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

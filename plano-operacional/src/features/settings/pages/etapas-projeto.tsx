import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  Plane,
  Wrench,
  Zap,
  Coffee,
  SlidersHorizontal,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { categoriasRemuneracaoService, tipoCalculoConfigService } from '../services/mco-parametros.service'
import type {
  CategoriaRemuneracao,
  CategoriaRemuneracaoFormData,
  TipoCalculoCategoria,
  TipoCalculoConfig,
  TipoCalculoConfigFormData
} from '../types/mco-parametros'

// =============================================================================
// CONSTANTES
// =============================================================================

const TIPO_CALCULO_OPTIONS: { value: TipoCalculoCategoria; label: string; icon: typeof Plane; color: string }[] = [
  { value: 'viagem', label: 'Viagem', icon: Plane, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'setup', label: 'Setup', icon: Wrench, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'go_live', label: 'Go Live', icon: Zap, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'day_off', label: 'Day Off', icon: Coffee, color: 'bg-purple-100 text-purple-700 border-purple-200' },
]

// =============================================================================
// SORTABLE ROW
// =============================================================================

interface SortableEtapaRowProps {
  etapa: CategoriaRemuneracao
  index: number
  tiposConfig: TipoCalculoConfig[]
  onEdit: (etapa: CategoriaRemuneracao) => void
  onDelete: (etapa: CategoriaRemuneracao) => void
}

function SortableEtapaRow({ etapa, index, tiposConfig, onEdit, onDelete }: SortableEtapaRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const tipoConfig = tiposConfig.find(t => t.valor === etapa.tipo_calculo) || tiposConfig[0]

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </TableCell>
      <TableCell className="font-medium">{index + 1}</TableCell>
      <TableCell className="font-medium">{etapa.nome}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`${tipoConfig?.cor_fundo} ${tipoConfig?.cor_texto} ${tipoConfig?.cor_borda}`}>
          {tipoConfig?.label || etapa.tipo_calculo}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{etapa.descricao || '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(etapa)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(etapa)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// =============================================================================
// PAGE
// =============================================================================

export function EtapasProjetoPage() {
  const queryClient = useQueryClient()

  // Estado dos dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tiposDialogOpen, setTiposDialogOpen] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<CategoriaRemuneracao | null>(null)
  const [deletingEtapa, setDeletingEtapa] = useState<CategoriaRemuneracao | null>(null)

  // Estado do formulário
  const [formNome, setFormNome] = useState('')
  const [formTipoCalculo, setFormTipoCalculo] = useState<TipoCalculoCategoria>('viagem')
  const [formDescricao, setFormDescricao] = useState('')

  // Estado do formulário de tipos
  const [editingTipo, setEditingTipo] = useState<TipoCalculoConfig | null>(null)
  const [tipoDialogMode, setTipoDialogMode] = useState<'list' | 'edit'>('list')
  const [formTipoValor, setFormTipoValor] = useState('')
  const [formTipoLabel, setFormTipoLabel] = useState('')
  const [formTipoIcon, setFormTipoIcon] = useState('Circle')
  const [formTipoCorFundo, setFormTipoCorFundo] = useState('bg-gray-100')
  const [formTipoCorTexto, setFormTipoCorTexto] = useState('text-gray-700')
  const [formTipoCorBorda, setFormTipoCorBorda] = useState('border-gray-200')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // =========================================================================
  // QUERIES
  // =========================================================================

  const { data: etapas, isLoading, error } = useQuery({
    queryKey: ['categorias-remuneracao'],
    queryFn: () => categoriasRemuneracaoService.getCategorias(),
  })

  const { data: tiposConfig, isLoading: tiposLoading } = useQuery({
    queryKey: ['tipo-calculo-config'],
    queryFn: () => tipoCalculoConfigService.getTipos(),
  })

  // Ordenar
  const sortedEtapas = useMemo(() => {
    if (!etapas) return []
    return [...etapas].sort((a, b) => a.ordem - b.ordem)
  }, [etapas])

  // Tipos ordenados e ativos
  const sortedTiposConfig = useMemo(() => {
    if (!tiposConfig) return []
    return [...tiposConfig].filter(t => t.ativo).sort((a, b) => a.ordem - b.ordem)
  }, [tiposConfig])

  // Usar tipos dinâmicos ou fallback para os padrão
  const tipoOptions = useMemo(() => {
    if (sortedTiposConfig.length > 0) {
      return sortedTiposConfig
    }
    // Fallback para tipos padrão se não houver no banco
    return TIPO_CALCULO_OPTIONS.map((opt, index) => ({
      id: opt.value,
      valor: opt.value,
      label: opt.label,
      icon: opt.icon.name || 'Circle',
      cor_fundo: opt.color.split(' ')[0],
      cor_texto: opt.color.split(' ')[1],
      cor_borda: opt.color.split(' ')[2],
      is_sistema: true,
      ordem: index + 1,
      ativo: true,
      created_at: '',
      updated_at: '',
    }))
  }, [sortedTiposConfig])

  // =========================================================================
  // MUTATIONS
  // =========================================================================

  const createMutation = useMutation({
    mutationFn: (data: CategoriaRemuneracaoFormData) => categoriasRemuneracaoService.createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-remuneracao'] })
      toast.success('Etapa criada com sucesso')
      handleCloseDialog()
    },
    onError: () => toast.error('Erro ao criar etapa'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoriaRemuneracaoFormData> }) =>
      categoriasRemuneracaoService.updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-remuneracao'] })
      toast.success('Etapa atualizada com sucesso')
      handleCloseDialog()
    },
    onError: () => toast.error('Erro ao atualizar etapa'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriasRemuneracaoService.deleteCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-remuneracao'] })
      toast.success('Etapa excluída com sucesso')
      setDeleteDialogOpen(false)
      setDeletingEtapa(null)
    },
    onError: () => toast.error('Erro ao excluir etapa'),
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; ordem: number }[]) => categoriasRemuneracaoService.reorderCategorias(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias-remuneracao'] }),
    onError: () => toast.error('Erro ao reordenar etapas'),
  })

  // Mutations para tipos
  const createTipoMutation = useMutation({
    mutationFn: (data: TipoCalculoConfigFormData) => tipoCalculoConfigService.createTipo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipo-calculo-config'] })
      toast.success('Tipo criado com sucesso')
      setTipoDialogMode('list')
    },
    onError: () => toast.error('Erro ao criar tipo'),
  })

  const updateTipoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TipoCalculoConfigFormData> }) =>
      tipoCalculoConfigService.updateTipo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipo-calculo-config'] })
      toast.success('Tipo atualizado com sucesso')
      setTipoDialogMode('list')
    },
    onError: () => toast.error('Erro ao atualizar tipo'),
  })

  const deleteTipoMutation = useMutation({
    mutationFn: (id: string) => tipoCalculoConfigService.deleteTipo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipo-calculo-config'] })
      toast.success('Tipo excluído com sucesso')
    },
    onError: () => toast.error('Erro ao excluir tipo'),
  })

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleOpenCreate = () => {
    setEditingEtapa(null)
    setFormNome('')
    setFormTipoCalculo('viagem')
    setFormDescricao('')
    setDialogOpen(true)
  }

  const handleOpenEdit = (etapa: CategoriaRemuneracao) => {
    setEditingEtapa(etapa)
    setFormNome(etapa.nome)
    setFormTipoCalculo(etapa.tipo_calculo)
    setFormDescricao(etapa.descricao || '')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingEtapa(null)
  }

  const handleSave = () => {
    if (!formNome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    const data: CategoriaRemuneracaoFormData = {
      nome: formNome.trim(),
      tipo_calculo: formTipoCalculo,
      descricao: formDescricao.trim() || undefined,
      ordem: editingEtapa?.ordem ?? (sortedEtapas.length + 1),
    }

    if (editingEtapa) {
      updateMutation.mutate({ id: editingEtapa.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (etapa: CategoriaRemuneracao) => {
    setDeletingEtapa(etapa)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingEtapa) {
      deleteMutation.mutate(deletingEtapa.id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !sortedEtapas.length) return

    const oldIndex = sortedEtapas.findIndex((e) => e.id === active.id)
    const newIndex = sortedEtapas.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sortedEtapas, oldIndex, newIndex)
    const updates = reordered.map((e, i) => ({ id: e.id, ordem: i + 1 }))
    reorderMutation.mutate(updates)
  }

  // Handlers para tipos
  const handleOpenTipoEdit = (tipo?: TipoCalculoConfig) => {
    if (tipo) {
      setEditingTipo(tipo)
      setFormTipoValor(tipo.valor)
      setFormTipoLabel(tipo.label)
      setFormTipoIcon(tipo.icon)
      setFormTipoCorFundo(tipo.cor_fundo)
      setFormTipoCorTexto(tipo.cor_texto)
      setFormTipoCorBorda(tipo.cor_borda)
    } else {
      setEditingTipo(null)
      setFormTipoValor('')
      setFormTipoLabel('')
      setFormTipoIcon('Circle')
      setFormTipoCorFundo('bg-gray-100')
      setFormTipoCorTexto('text-gray-700')
      setFormTipoCorBorda('border-gray-200')
    }
    setTipoDialogMode('edit')
  }

  const handleSaveTipo = () => {
    if (!formTipoValor.trim() || !formTipoLabel.trim()) {
      toast.error('Valor e nome são obrigatórios')
      return
    }

    const data: TipoCalculoConfigFormData = {
      valor: formTipoValor.trim(),
      label: formTipoLabel.trim(),
      icon: formTipoIcon,
      cor_fundo: formTipoCorFundo,
      cor_texto: formTipoCorTexto,
      cor_borda: formTipoCorBorda,
      ordem: editingTipo?.ordem ?? (sortedTiposConfig.length + 1),
    }

    if (editingTipo) {
      updateTipoMutation.mutate({ id: editingTipo.id, data })
    } else {
      createTipoMutation.mutate(data)
    }
  }

  const handleDeleteTipo = (tipo: TipoCalculoConfig) => {
    if (tipo.is_sistema) {
      toast.error('Tipos do sistema não podem ser excluídos')
      return
    }
    deleteTipoMutation.mutate(tipo.id)
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Etapas do Projeto</h2>
        <p className="text-muted-foreground">Gerencie as etapas do projeto</p>
      </div>

      {/* Tabela de Etapas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Etapas do Projeto</CardTitle>
              <CardDescription>Gerencie as etapas e suas configurações</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTiposDialogOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Configurar Tipos de Etapas
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Etapa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-8 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar etapas</span>
            </div>
          ) : sortedEtapas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>Nenhuma etapa cadastrada</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira etapa
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]" />
                      <TableHead className="w-[60px]">Ordem</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={sortedEtapas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {sortedEtapas.map((etapa, index) => (
                        <SortableEtapaRow
                          key={etapa.id}
                          etapa={etapa}
                          index={index}
                          tiposConfig={tipoOptions}
                          onEdit={handleOpenEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </div>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEtapa ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
            <DialogDescription>
              {editingEtapa ? 'Edite os dados da etapa do projeto' : 'Preencha os dados da nova etapa'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Viagem, Setup, Go Live..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cálculo *</Label>
              <Select value={formTipoCalculo} onValueChange={(v) => setFormTipoCalculo(v as TipoCalculoCategoria)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    tipoOptions.map((opt) => (
                      <SelectItem key={opt.valor} value={opt.valor}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${opt.cor_fundo} ${opt.cor_texto} ${opt.cor_borda}`}>
                            {opt.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Descrição da etapa..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEtapa ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa "{deletingEtapa?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de configurar tipos de etapas */}
      <Dialog open={tiposDialogOpen} onOpenChange={(open) => { setTiposDialogOpen(open); if(!open) setTipoDialogMode('list') }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tipoDialogMode === 'edit' ? (editingTipo ? 'Editar Tipo' : 'Novo Tipo') : 'Configurar Tipos de Etapas'}</DialogTitle>
            <DialogDescription>
              {tipoDialogMode === 'edit' ? 'Preencha os dados do tipo de etapa' : 'Personalize os tipos de cálculo disponíveis'}
            </DialogDescription>
          </DialogHeader>

          {tipoDialogMode === 'list' ? (
            <div className="space-y-4 py-4">
              <div className="flex justify-end">
                <Button onClick={() => handleOpenTipoEdit()} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Tipo
                </Button>
              </div>
              {tiposLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Valor</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Sistema</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tipoOptions.map((tipo) => (
                        <TableRow key={tipo.id}>
                          <TableCell className="font-mono text-sm">{tipo.valor}</TableCell>
                          <TableCell>{tipo.label}</TableCell>
                          <TableCell>
                            <Badge className={`${tipo.cor_fundo} ${tipo.cor_texto} ${tipo.cor_borda}`}>
                              {tipo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tipo.is_sistema && <Badge variant="secondary">Sistema</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenTipoEdit(tipo)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!tipo.is_sistema && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTipo(tipo)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (identificador) *</Label>
                  <Input
                    value={formTipoValor}
                    onChange={(e) => setFormTipoValor(e.target.value)}
                    placeholder="ex: viagem, custom_type"
                    disabled={editingTipo?.is_sistema}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome de Exibição *</Label>
                  <Input
                    value={formTipoLabel}
                    onChange={(e) => setFormTipoLabel(e.target.value)}
                    placeholder="ex: Viagem"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <Select value={formTipoCorFundo} onValueChange={setFormTipoCorFundo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['bg-blue-100', 'bg-green-100', 'bg-orange-100', 'bg-purple-100', 'bg-pink-100', 'bg-yellow-100', 'bg-red-100', 'bg-gray-100'].map(c => (
                        <SelectItem key={c} value={c}><div className={`${c} px-2 py-1 rounded`}>{c}</div></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <Select value={formTipoCorTexto} onValueChange={setFormTipoCorTexto}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['text-blue-700', 'text-green-700', 'text-orange-700', 'text-purple-700', 'text-pink-700', 'text-yellow-700', 'text-red-700', 'text-gray-700'].map(c => (
                        <SelectItem key={c} value={c}><span className={c}>{c}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor da Borda</Label>
                  <Select value={formTipoCorBorda} onValueChange={setFormTipoCorBorda}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['border-blue-200', 'border-green-200', 'border-orange-200', 'border-purple-200', 'border-pink-200', 'border-yellow-200', 'border-red-200', 'border-gray-200'].map(c => (
                        <SelectItem key={c} value={c}><div className={`border-2 ${c} px-2 py-1 rounded`}>{c}</div></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <Label>Preview:</Label>
                <div className="mt-2">
                  <Badge className={`${formTipoCorFundo} ${formTipoCorTexto} ${formTipoCorBorda}`}>
                    {formTipoLabel || 'Preview'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {tipoDialogMode === 'edit' ? (
              <>
                <Button variant="outline" onClick={() => setTipoDialogMode('list')}>
                  Voltar
                </Button>
                <Button onClick={handleSaveTipo} disabled={createTipoMutation.isPending || updateTipoMutation.isPending}>
                  {(createTipoMutation.isPending || updateTipoMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTipo ? 'Salvar' : 'Criar'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setTiposDialogOpen(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

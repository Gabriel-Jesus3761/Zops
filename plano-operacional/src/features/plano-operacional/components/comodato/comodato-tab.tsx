import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  User,
  Package,
  Calendar,
  Phone,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Undo2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useComodato } from '../../hooks'
import type { CreateComodatoRequest, EquipmentType } from '../../types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ComodatoTab() {
  const {
    comodatos,
    isLoading,
    createComodato,
    devolverComodato,
    deleteComodato,
    comodatosEmprestados,
    comodatosAtrasados,
    comodatosDevolvidos,
    totalItensEmprestados,
    totalComodatos,
  } = useComodato()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDevolverDialogOpen, setIsDevolverDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedComodato, setSelectedComodato] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateComodatoRequest>>({
    tecnicoNome: '',
    tecnicoCpf: '',
    tecnicoContato: '',
    tecnicoSetor: '',
    itemTipo: 'INSUMO',
    itemModelo: '',
    itemSerial: '',
    itemQuantidade: 1,
    dataPrevistaRetorno: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
    observacoes: '',
  })

  const handleCreate = async () => {
    if (!formData.tecnicoNome?.trim() || !formData.tecnicoCpf?.trim() || !formData.itemModelo?.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setIsCreating(true)
      await createComodato(formData as CreateComodatoRequest)
      toast.success('Comodato registrado com sucesso!')
      setIsCreateDialogOpen(false)
      setFormData({
        tecnicoNome: '',
        tecnicoCpf: '',
        tecnicoContato: '',
        tecnicoSetor: '',
        itemTipo: 'INSUMO',
        itemModelo: '',
        itemSerial: '',
        itemQuantidade: 1,
        dataPrevistaRetorno: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        observacoes: '',
      })
    } catch (error) {
      toast.error('Erro ao registrar comodato')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDevolver = async () => {
    if (!selectedComodato) return

    try {
      await devolverComodato({
        comodatoId: selectedComodato,
        dataRetorno: new Date(),
        observacoes: '',
      })
      toast.success('Devolução registrada com sucesso!')
      setIsDevolverDialogOpen(false)
      setSelectedComodato(null)
    } catch (error) {
      toast.error('Erro ao registrar devolução')
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return

    try {
      await deleteComodato(id)
      toast.success('Comodato excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir comodato')
      console.error(error)
    }
  }

  const statusConfig = {
    Emprestado: {
      icon: Package,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'Emprestado',
    },
    Devolvido: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Devolvido',
    },
    Atrasado: {
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Atrasado',
    },
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Controle de Comodatos</h3>
          <p className="text-sm text-muted-foreground">
            Empréstimos individuais de equipamentos para técnicos
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Comodato
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComodatos}</div>
            <p className="text-xs text-muted-foreground">Todos os comodatos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emprestados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {comodatosEmprestados.length}
            </div>
            <p className="text-xs text-muted-foreground">{totalItensEmprestados} itens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {comodatosAtrasados.length}
            </div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {comodatosDevolvidos.length}
            </div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comodatos */}
      {comodatos.length === 0 ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum comodato registrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Registre empréstimos de equipamentos para técnicos
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Comodato
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registros de Comodato</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Data Empréstimo</TableHead>
                  <TableHead>Prev. Retorno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comodatos.map(com => {
                  const config = statusConfig[com.status]
                  const Icon = config.icon

                  return (
                    <TableRow key={com.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{com.tecnico.nome}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {com.tecnico.setor && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {com.tecnico.setor}
                              </span>
                            )}
                            {com.tecnico.contato && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {com.tecnico.contato}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{com.item.modelo}</div>
                          {com.item.serial && (
                            <div className="font-mono text-xs text-muted-foreground">
                              S/N: {com.item.serial}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{com.item.quantidade}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(com.dataEmprestimo, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(com.dataPrevistaRetorno, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1', config.color)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            {com.status !== 'Devolvido' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedComodato(com.id)
                                  setIsDevolverDialogOpen(true)
                                }}
                              >
                                <Undo2 className="mr-2 h-4 w-4" />
                                Registrar Devolução
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(com.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criar Comodato */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Comodato</DialogTitle>
            <DialogDescription>
              Registre um empréstimo de equipamento para um técnico
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tecnicoNome">
                  Nome do Técnico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tecnicoNome"
                  placeholder="Nome completo"
                  value={formData.tecnicoNome}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tecnicoNome: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnicoCpf">
                  CPF <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tecnicoCpf"
                  placeholder="000.000.000-00"
                  value={formData.tecnicoCpf}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tecnicoCpf: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tecnicoContato">Contato</Label>
                <Input
                  id="tecnicoContato"
                  placeholder="(00) 00000-0000"
                  value={formData.tecnicoContato}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tecnicoContato: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnicoSetor">Setor</Label>
                <Input
                  id="tecnicoSetor"
                  placeholder="Ex: Logística"
                  value={formData.tecnicoSetor}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tecnicoSetor: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="my-2 border-t" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemTipo">Tipo de Item</Label>
                <Select
                  value={formData.itemTipo}
                  onValueChange={(value: EquipmentType) =>
                    setFormData(prev => ({ ...prev, itemTipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERMINAL">Terminal</SelectItem>
                    <SelectItem value="INSUMO">Insumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemModelo">
                  Modelo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="itemModelo"
                  placeholder="Ex: Powerbank 10000mAh"
                  value={formData.itemModelo}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, itemModelo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemSerial">Serial (opcional)</Label>
                <Input
                  id="itemSerial"
                  placeholder="Número de série"
                  value={formData.itemSerial}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, itemSerial: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemQuantidade">Quantidade</Label>
                <Input
                  id="itemQuantidade"
                  type="number"
                  min="1"
                  value={formData.itemQuantidade}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      itemQuantidade: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPrevistaRetorno">Data Prevista de Retorno</Label>
              <Input
                id="dataPrevistaRetorno"
                type="date"
                value={
                  formData.dataPrevistaRetorno
                    ? format(formData.dataPrevistaRetorno, 'yyyy-MM-dd')
                    : ''
                }
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    dataPrevistaRetorno: new Date(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Informações adicionais"
                value={formData.observacoes}
                onChange={e =>
                  setFormData(prev => ({ ...prev, observacoes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Registrando...' : 'Registrar Comodato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Devolução */}
      <Dialog open={isDevolverDialogOpen} onOpenChange={setIsDevolverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
            <DialogDescription>
              Confirme a devolução do equipamento emprestado
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Ao confirmar, o status do comodato será alterado para "Devolvido" e o equipamento
              retornará ao estoque.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDevolverDialogOpen(false)
                setSelectedComodato(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleDevolver}>Confirmar Devolução</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

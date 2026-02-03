import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  MapPin,
  User,
  Package,
  MoreVertical,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCCOs } from '../../hooks'
import type { CreateCCORequest } from '../../types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function CCOTab() {
  const {
    ccos,
    isLoading,
    createCCO,
    toggleCCOStatus,
    deleteCCO,
    totalCCOs,
    ccosAtivos,
    totalEquipamentos,
    totalTerminais,
  } = useCCOs()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<CreateCCORequest>({
    nome: '',
    localizacao: '',
    responsavel: '',
    descricao: '',
  })

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do CCO é obrigatório')
      return
    }

    try {
      setIsCreating(true)
      await createCCO(formData)
      toast.success('CCO criado com sucesso!')
      setIsCreateDialogOpen(false)
      setFormData({ nome: '', localizacao: '', responsavel: '', descricao: '' })
    } catch (error) {
      toast.error('Erro ao criar CCO')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCCOStatus(id)
      toast.success(`CCO ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status do CCO')
      console.error(error)
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o CCO "${nome}"?`)) return

    try {
      await deleteCCO(id)
      toast.success('CCO excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir CCO')
      console.error(error)
    }
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
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Centros de Controle Operacional (CCO)</h3>
          <p className="text-sm text-muted-foreground">
            Estoques auxiliares para eventos de grande porte
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo CCO
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de CCOs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCCOs}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{ccosAtivos} ativos</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipamentos}</div>
            <p className="text-xs text-muted-foreground">Em todos os CCOs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Terminais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTerminais}</div>
            <p className="text-xs text-muted-foreground">Distribuídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipamentos - totalTerminais}</div>
            <p className="text-xs text-muted-foreground">Distribuídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de CCOs */}
      {ccos.length === 0 ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum CCO cadastrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie um Centro de Controle Operacional para começar
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro CCO
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {ccos.map(cco => {
            const totalItems = cco.equipamentos.reduce((acc, eq) => acc + eq.quantidade, 0)
            const terminais = cco.equipamentos.filter(eq => eq.tipo === 'TERMINAL')
            const insumos = cco.equipamentos.filter(eq => eq.tipo === 'INSUMO')

            return (
              <Card key={cco.id} className={cn(!cco.ativo && 'opacity-60')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{cco.nome}</CardTitle>
                        <Badge
                          variant={cco.ativo ? 'default' : 'secondary'}
                          className={cn(
                            cco.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {cco.ativo ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {cco.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {cco.descricao && (
                        <CardDescription className="mt-1">{cco.descricao}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Gerenciar Equipamentos</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(cco.id, cco.ativo)}>
                          {cco.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(cco.id, cco.nome)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    {cco.localizacao && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {cco.localizacao}
                      </div>
                    )}
                    {cco.responsavel && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {cco.responsavel}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      {totalItems} item(ns) no estoque
                    </div>
                  </div>

                  <Separator />

                  {/* Equipamentos */}
                  {cco.equipamentos.length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Equipamentos</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Modelo</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Disp.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cco.equipamentos.map(eq => (
                            <TableRow key={eq.key}>
                              <TableCell className="font-medium">{eq.modelo}</TableCell>
                              <TableCell className="text-right">{eq.quantidade}</TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    eq.disponivel === 0 && 'bg-red-100 text-red-800'
                                  )}
                                >
                                  {eq.disponivel}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="mt-3 flex gap-2">
                        <div className="flex-1 rounded-md bg-blue-50 p-2 text-center dark:bg-blue-950">
                          <div className="text-xs text-muted-foreground">Terminais</div>
                          <div className="text-sm font-semibold text-blue-600">
                            {terminais.reduce((acc, t) => acc + t.quantidade, 0)}
                          </div>
                        </div>
                        <div className="flex-1 rounded-md bg-gray-50 p-2 text-center dark:bg-gray-900">
                          <div className="text-xs text-muted-foreground">Insumos</div>
                          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {insumos.reduce((acc, i) => acc + i.quantidade, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-center">
                      <div>
                        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum equipamento alocado
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de Criar CCO */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo CCO</DialogTitle>
            <DialogDescription>
              Configure um novo Centro de Controle Operacional para o evento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do CCO <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: CCO Arena Principal"
                value={formData.nome}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                placeholder="Ex: Portão Sul - Arena"
                value={formData.localizacao}
                onChange={e => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                placeholder="Nome do responsável"
                value={formData.responsavel}
                onChange={e => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Descrição breve do CCO"
                value={formData.descricao}
                onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar CCO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

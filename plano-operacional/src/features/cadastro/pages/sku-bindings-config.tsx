import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useSkuEquipmentBindings } from '../hooks/use-sku-equipment-bindings'
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

export function SkuBindingsConfig() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bindingToDelete, setBindingToDelete] = useState<string | null>(null)

  const { bindings, deleteBinding } = useSkuEquipmentBindings()

  // Filtrar vinculações baseado na busca
  const filteredBindings = bindings.filter((binding) => {
    const search = searchTerm.toLowerCase()
    return (
      binding.sku.toLowerCase().includes(search) ||
      binding.modelo.toLowerCase().includes(search) ||
      binding.adquirencia.toLowerCase().includes(search) ||
      binding.tipo?.toLowerCase().includes(search)
    )
  })

  const handleDeleteClick = (bindingId: string) => {
    setBindingToDelete(bindingId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (bindingToDelete) {
      deleteBinding(bindingToDelete)
      toast.success('Vinculação removida com sucesso')
      setBindingToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/logistica/cadastro')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Vinculações SKU-Equipamento</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os SKUs vinculados a cada tipo de equipamento
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vinculações</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bindings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bindings.reduce((sum, b) => sum + b.quantidade, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo SKU</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bindings.length === 0
                ? 'ATS001'
                : `ATS${String(
                    Math.max(
                      ...bindings.map((b) => {
                        const match = b.sku.match(/ATS(\d+)/)
                        return match ? parseInt(match[1], 10) : 0
                      })
                    ) + 1
                  ).padStart(3, '0')}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vinculações Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as vinculações entre SKUs e equipamentos
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU, modelo ou adquirência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBindings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {bindings.length === 0
                ? 'Nenhuma vinculação cadastrada. As vinculações serão criadas automaticamente ao cadastrar equipamentos.'
                : 'Nenhuma vinculação encontrada com os filtros aplicados.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Adquirência</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBindings.map((binding) => (
                  <TableRow key={binding.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {binding.sku}
                      </Badge>
                    </TableCell>
                    <TableCell>{binding.tipo || '-'}</TableCell>
                    <TableCell className="font-medium">{binding.modelo}</TableCell>
                    <TableCell>{binding.adquirencia}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{binding.quantidade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(binding.id!)}
                        disabled={binding.quantidade > 0}
                        title={
                          binding.quantidade > 0
                            ? 'Não é possível remover vinculação com unidades cadastradas'
                            : 'Remover vinculação'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta vinculação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

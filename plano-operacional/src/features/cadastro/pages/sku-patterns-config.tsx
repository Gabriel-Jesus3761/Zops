import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_ITEM_TYPE_CONFIGS } from '../constants/default-patterns'
import { useSkuPatterns } from '../hooks/use-sku-patterns'
import { SkuPatternDialog } from '../components/sku-pattern-dialog'
import type { SkuPattern } from '../types/sku-pattern'
import { toast } from 'sonner'

export function SkuPatternsConfig() {
  const navigate = useNavigate()
  const {
    patterns,
    loading,
    addPattern,
    updatePattern,
    deletePattern,
    toggleActive,
  } = useSkuPatterns()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<SkuPattern | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patternToDelete, setPatternToDelete] = useState<string | null>(null)

  const getItemTypeLabel = (itemType: string) => {
    const config = DEFAULT_ITEM_TYPE_CONFIGS.find(c => c.itemType === itemType)
    return config?.label || itemType
  }

  const getItemTypeConfig = (itemType: string) => {
    return DEFAULT_ITEM_TYPE_CONFIGS.find(c => c.itemType === itemType)
  }

  const handleNewPattern = () => {
    setEditingPattern(null)
    setDialogOpen(true)
  }

  const handleEditPattern = (pattern: SkuPattern) => {
    setEditingPattern(pattern)
    setDialogOpen(true)
  }

  const handleDeletePattern = (id: string) => {
    setPatternToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (patternToDelete) {
      try {
        await deletePattern(patternToDelete)
        toast.success('Padrão deletado com sucesso!')
        setPatternToDelete(null)
        setDeleteDialogOpen(false)
      } catch (error) {
        // Erro já tratado no hook
      }
    }
  }

  const handleSavePattern = async (data: Omit<SkuPattern, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addPattern(data)
      toast.success('Padrão criado com sucesso!')
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleUpdatePattern = async (id: string, data: Partial<SkuPattern>) => {
    try {
      await updatePattern(id, data)
      toast.success('Padrão atualizado com sucesso!')
    } catch (error) {
      // Erro já tratado no hook
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
          <h1 className="text-3xl font-bold text-foreground">Padrões de SKU</h1>
          <p className="mt-2 text-muted-foreground">
            Configure os padrões de geração automática de SKU
          </p>
        </div>
        <Button onClick={handleNewPattern}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Padrão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sequência do SKU</CardTitle>
          <CardDescription>
            O SKU é gerado automaticamente com o código do tipo + número sequencial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold text-primary">CÓDIGO</code>
              <p className="mt-1 text-sm text-muted-foreground">
                Código do tipo (até 4 letras)
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold text-primary">SEQUENCIAL</code>
              <p className="mt-1 text-sm text-muted-foreground">
                Número sequencial (padrão 3 zeros à esquerda)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Padrões Configurados</CardTitle>
          <CardDescription>
            Gerencie os padrões de SKU para cada tipo de item. Clique no status para ativar/desativar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Carregando padrões...</p>
            </div>
          ) : patterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum padrão configurado ainda
              </p>
              <Button onClick={handleNewPattern}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Padrão
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo de Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.map((pattern) => {
                  const typeConfig = getItemTypeConfig(pattern.itemType)
                  // Usar customCode se disponível, senão usar o código padrão do tipo
                  const codeToUse = pattern.customCode || typeConfig?.code || ''
                  const preview = codeToUse
                    ? `${codeToUse}001`
                    : '-'

                  return (
                    <TableRow key={pattern.id}>
                      <TableCell className="font-medium">{pattern.name}</TableCell>
                      <TableCell>{getItemTypeLabel(pattern.itemType)}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                          {preview}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pattern.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => pattern.id && toggleActive(pattern.id)}
                        >
                          {pattern.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPattern(pattern)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => pattern.id && handleDeletePattern(pattern.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar padrão */}
      <SkuPatternDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pattern={editingPattern}
        onSave={handleSavePattern}
        onUpdate={handleUpdatePattern}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O padrão será permanentemente deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

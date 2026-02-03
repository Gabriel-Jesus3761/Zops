import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Plus, Edit, Trash2, Scan, CheckCircle, AlertCircle } from 'lucide-react'
import { useSerialPatterns } from '../hooks/use-serial-patterns'
import { SerialPatternDialog } from '../components/serial-pattern-dialog'
import type { SerialPattern } from '../types/serial-pattern'
import { toast } from 'sonner'

export function SerialPatternsConfig() {
  const navigate = useNavigate()
  const {
    patterns,
    customOptions,
    loading,
    addPattern,
    updatePattern,
    deletePattern,
    toggleActive,
    addCustomOption,
    reloadCustomOptions,
  } = useSerialPatterns()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<SerialPattern | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patternToDelete, setPatternToDelete] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    prefixo: '',
    tipo: '',
    modelo: '',
    adquirencia: '',
  })

  const handleNewPattern = () => {
    setEditingPattern(null)
    setDialogOpen(true)
  }

  const handleEditPattern = (pattern: SerialPattern) => {
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
        toast.error('Erro ao deletar padrão')
      }
    }
  }

  const handleSavePattern = async (data: Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addPattern(data)
      toast.success('Padrão criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar padrão')
    }
  }

  const handleUpdatePattern = async (id: string, data: Partial<SerialPattern>) => {
    try {
      await updatePattern(id, data)
      toast.success('Padrão atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar padrão')
    }
  }

  // Filtrar dados
  const dadosFiltrados = patterns.filter(pattern => {
    return (
      (!filters.prefixo || pattern.prefixo.toLowerCase().includes(filters.prefixo.toLowerCase())) &&
      (!filters.tipo || pattern.tipo.toLowerCase().includes(filters.tipo.toLowerCase())) &&
      (!filters.modelo || pattern.modelo.toLowerCase().includes(filters.modelo.toLowerCase())) &&
      (!filters.adquirencia || pattern.adquirencia.toLowerCase().includes(filters.adquirencia.toLowerCase()))
    )
  })

  const activePatterns = patterns.filter(p => p.ativo).length

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
          <h1 className="text-3xl font-bold text-foreground">Padrões de Serial</h1>
          <p className="mt-2 text-muted-foreground">
            Configure os prefixos para identificação automática de equipamentos
          </p>
        </div>
        <Button onClick={handleNewPattern}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Padrão
        </Button>
      </div>

      <Alert>
        <Scan className="h-4 w-4" />
        <AlertTitle>Identificação Automática</AlertTitle>
        <AlertDescription>
          Configure os prefixos para que o sistema identifique automaticamente o tipo, modelo e adquirência
          baseado nos primeiros caracteres do número de série. Por exemplo: serial "PB3123456" com prefixo "PB3"
          pode identificar automaticamente como "SMARTPOS - SUNMI P2 - PagSeguro".
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Filtrar por prefixo..."
                value={filters.prefixo}
                onChange={(e) => setFilters(prev => ({ ...prev, prefixo: e.target.value }))}
              />
            </div>
            <div>
              <Select
                value={filters.tipo || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {customOptions.tipos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.modelo || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, modelo: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {customOptions.modelos.map(modelo => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.adquirencia || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, adquirencia: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por adquirência..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as adquirências</SelectItem>
                  {customOptions.adquirencias.map(adq => (
                    <SelectItem key={adq} value={adq}>{adq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Padrões */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões Configurados</CardTitle>
          <CardDescription>
            Gerencie os padrões de identificação. Clique no status para ativar/desativar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Carregando padrões...</p>
            </div>
          ) : dadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scan className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {patterns.length === 0
                  ? 'Nenhum padrão configurado ainda'
                  : 'Nenhum padrão encontrado com os filtros aplicados'}
              </p>
              {patterns.length === 0 && (
                <Button onClick={handleNewPattern}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Padrão
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Adquirência</TableHead>
                  <TableHead className="w-32">Validação</TableHead>
                  <TableHead className="text-right w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((pattern) => (
                  <TableRow key={pattern.id}>
                    <TableCell>
                      <Switch
                        checked={pattern.ativo}
                        onCheckedChange={async () => {
                          if (pattern.id) {
                            try {
                              await toggleActive(pattern.id)
                            } catch (error) {
                              toast.error('Erro ao alterar status')
                            }
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono font-semibold">
                        {pattern.prefixo}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pattern.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{pattern.modelo}</TableCell>
                    <TableCell>{pattern.adquirencia}</TableCell>
                    <TableCell>
                      <Badge variant={pattern.needsValidation ? 'secondary' : 'default'}>
                        {pattern.needsValidation ? 'Manual' : 'Auto'}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Padrões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              <div className="text-2xl font-bold">{patterns.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Padrões Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{activePatterns}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Opções Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="text-sm">
                <div><strong>{customOptions.tipos.length}</strong> tipos</div>
                <div><strong>{customOptions.modelos.length}</strong> modelos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de criar/editar */}
      <SerialPatternDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pattern={editingPattern}
        customOptions={customOptions}
        onSave={handleSavePattern}
        onUpdate={handleUpdatePattern}
        onAddCustomOption={addCustomOption}
        onReloadOptions={reloadCustomOptions}
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

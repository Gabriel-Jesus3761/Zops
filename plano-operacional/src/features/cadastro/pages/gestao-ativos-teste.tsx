import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Package,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { ativosSerializadosService } from '../services/ativos-serializados.service'
import type { AtivoSerializado } from '../types'

export function GestaoAtivosTeste() {
  const navigate = useNavigate()
  const [ativos, setAtivos] = useState<AtivoSerializado[]>([])
  const [filteredAtivos, setFilteredAtivos] = useState<AtivoSerializado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ativoToDelete, setAtivoToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Carregar ativos do Firebase
  const loadAtivos = async () => {
    setLoading(true)
    try {
      const data = await ativosSerializadosService.getAll()
      setAtivos(data)
      setFilteredAtivos(data)
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
      toast.error('Erro ao carregar ativos serializados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAtivos()
  }, [])

  // Filtrar ativos baseado na busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAtivos(ativos)
      return
    }

    const search = searchTerm.toLowerCase()
    const filtered = ativos.filter(
      (ativo) =>
        ativo.sku.toLowerCase().includes(search) ||
        ativo.tipo.toLowerCase().includes(search) ||
        ativo.modelo.toLowerCase().includes(search) ||
        ativo.adquirencia.toLowerCase().includes(search) ||
        ativo.numeroSerie?.toLowerCase().includes(search)
    )
    setFilteredAtivos(filtered)
  }, [searchTerm, ativos])

  // Abrir dialog de exclusão
  const handleDeleteClick = (id: string) => {
    setAtivoToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!ativoToDelete) return

    setDeleting(true)
    try {
      await ativosSerializadosService.delete(ativoToDelete)
      toast.success('Ativo removido com sucesso')
      await loadAtivos()
      setDeleteDialogOpen(false)
      setAtivoToDelete(null)
    } catch (error) {
      console.error('Erro ao remover ativo:', error)
      toast.error('Erro ao remover ativo')
    } finally {
      setDeleting(false)
    }
  }

  // Exportar para Excel
  const handleExport = async () => {
    try {
      const { utils, writeFile } = await import('xlsx')

      const exportData = filteredAtivos.map((ativo) => ({
        SKU: ativo.sku,
        Tipo: ativo.tipo,
        Modelo: ativo.modelo,
        Adquirência: ativo.adquirencia,
        'Número de Série': ativo.numeroSerie || '',
        'Data de Cadastro': ativo.createdAt
          ? new Date(ativo.createdAt).toLocaleString('pt-BR')
          : '',
      }))

      const wb = utils.book_new()
      const ws = utils.json_to_sheet(exportData)
      utils.book_append_sheet(wb, ws, 'Ativos')
      writeFile(wb, `ativos_serializados_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success(`${filteredAtivos.length} ativos exportados!`)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar ativos')
    }
  }

  // Estatísticas
  const stats = {
    total: ativos.length,
    porSKU: [...new Set(ativos.map((a) => a.sku))].length,
    porModelo: [...new Set(ativos.map((a) => a.modelo))].length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/logistica/cadastro')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Gestão de Ativos - Teste</h1>
          <p className="mt-2 text-muted-foreground">
            Visualize e gerencie os ativos serializados cadastrados no Firebase
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKUs Únicos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porSKU}</div>
            <p className="text-xs text-muted-foreground">Tipos de equipamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos Únicos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porModelo}</div>
            <p className="text-xs text-muted-foreground">Modelos diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Ativos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os ativos serializados salvos no Firebase
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU, tipo, modelo, adquirência ou serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              onClick={loadAtivos}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredAtivos.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Carregando ativos...</p>
            </div>
          ) : filteredAtivos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {ativos.length === 0
                  ? 'Nenhum ativo cadastrado ainda'
                  : 'Nenhum ativo encontrado com os filtros aplicados'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Adquirência</TableHead>
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtivos.map((ativo) => (
                  <TableRow key={ativo.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {ativo.sku}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{ativo.tipo}</TableCell>
                    <TableCell>{ativo.modelo}</TableCell>
                    <TableCell>{ativo.adquirencia}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {ativo.numeroSerie || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ativo.createdAt
                        ? new Date(ativo.createdAt).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(ativo.id!)}
                        title="Remover ativo"
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
              Tem certeza que deseja remover este ativo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Removendo...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

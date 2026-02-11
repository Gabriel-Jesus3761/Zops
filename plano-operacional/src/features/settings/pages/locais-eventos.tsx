import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  MapPin,
  Building2,
  Map,
  CheckCircle2,
  Search,
  Pencil,
  Trash2,
  Landmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocaisEventos } from '../hooks/use-locais-eventos'
import { LocalEventoModal, LocalEventoDeleteModal } from '../components/locais-eventos'
import { getTipoLabel, formatCapacidade, TIPOS_LOCAL, type LocalEvento } from '../types/local-evento'

export function LocaisEventosPage() {
  const navigate = useNavigate()
  const { locais, isLoading, refetch } = useLocaisEventos()

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterUf, setFilterUf] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingLocal, setEditingLocal] = useState<LocalEvento | null>(null)
  const [localToDelete, setLocalToDelete] = useState<LocalEvento | null>(null)

  // Lista de UFs únicas
  const ufsDisponiveis = useMemo(() => {
    const ufs = [...new Set(locais.map((l) => l.uf))].sort()
    return ufs
  }, [locais])

  // Filtrar
  const locaisFiltrados = useMemo(() => {
    let filtered = locais

    // Busca por texto
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.nome.toLowerCase().includes(searchLower) ||
          l.cidade.toLowerCase().includes(searchLower) ||
          l.cep?.includes(search.replace(/\D/g, ''))
      )
    }

    // Filtro por tipo
    if (filterTipo !== 'todos') {
      filtered = filtered.filter((l) => l.tipo === filterTipo)
    }

    // Filtro por UF
    if (filterUf !== 'todos') {
      filtered = filtered.filter((l) => l.uf === filterUf)
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      filtered = filtered.filter((l) => (filterStatus === 'ativos' ? l.ativo : !l.ativo))
    }

    return filtered
  }, [locais, search, filterTipo, filterUf, filterStatus])

  // Indicadores
  const totalLocais = locais.length
  const cidadesDistintas = new Set(locais.map((l) => `${l.cidade}-${l.uf}`)).size
  const estadosDistintos = new Set(locais.map((l) => l.uf)).size
  const locaisAtivos = locais.filter((l) => l.ativo).length

  const handleOpenNew = () => {
    setEditingLocal(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (local: LocalEvento) => {
    setEditingLocal(local)
    setModalOpen(true)
  }

  const handleDelete = (local: LocalEvento) => {
    setLocalToDelete(local)
    setDeleteModalOpen(true)
  }

  const handleSuccess = () => {
    refetch()
    setModalOpen(false)
    setEditingLocal(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/configuracoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Landmark className="h-6 w-6" />
              Locais de Eventos
            </h1>
            <p className="text-muted-foreground">Gerencie os locais onde os eventos acontecem</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Local
          </Button>
        </div>
      </div>

      {/* Cards Indicadores */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocais}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cidadesDistintas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estados</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadosDistintos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locaisAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade ou CEP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_LOCAL.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUf} onValueChange={setFilterUf}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos UFs</SelectItem>
            {ufsDisponiveis.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-medium">Nome</TableCell>
                <TableCell className="font-medium">Cidade/UF</TableCell>
                <TableCell className="font-medium">Tipo</TableCell>
                <TableCell className="font-medium">Capacidade</TableCell>
                <TableCell className="w-[100px] font-medium">Ações</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : locaisFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {search || filterTipo !== 'todos' || filterUf !== 'todos'
                      ? 'Nenhum local encontrado com os filtros aplicados'
                      : 'Nenhum local cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                locaisFiltrados.map((local) => (
                  <TableRow key={local.id} className={!local.ativo ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="font-medium">{local.nome}</div>
                      {local.apelido && <div className="text-xs text-muted-foreground">{local.apelido}</div>}
                    </TableCell>
                    <TableCell>
                      {local.cidade}/{local.uf}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTipoLabel(local.tipo)}</Badge>
                    </TableCell>
                    <TableCell>{formatCapacidade(local.capacidade_maxima)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(local)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(local)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modais */}
      <LocalEventoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingLocal={editingLocal}
        onSuccess={handleSuccess}
      />

      <LocalEventoDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        local={localToDelete}
        onSuccess={() => refetch()}
      />
    </div>
  )
}

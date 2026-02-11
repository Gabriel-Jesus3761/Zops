import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  Navigation,
  Search,
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
import { filiaisService } from '../../services/mco-parametros.service'
import type { FilialZig, FilialZigFormData, ClusterTamanho } from '../../types/mco-parametros'
import { CLUSTER_LABELS } from '../../types/mco-parametros'
import { toast } from 'sonner'
import { searchNominatim, extractUF } from '@/features/planejamento/services/geocoding.service'
import type { NominatimResult } from '@/features/planejamento/services/geocoding.service'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const BRAZILIAN_REGIONS = [
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
  'Amazônia',
  'Centro-Sul',
]

const CLUSTER_SIZES: ClusterTamanho[] = ['PP', 'P', 'M', 'G', 'MEGA']

const emptyFormData: FilialZigFormData = {
  nome: '',
  cidade: '',
  uf: '',
  regiao: '',
  latitude: 0,
  longitude: 0,
  endereco: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  raio_atuacao_km: 100,
  cluster_limite: 'G',
  is_matriz: false,
}

export function ManageFiliais() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingFilial, setEditingFilial] = useState<FilialZig | null>(null)
  const [deletingFilial, setDeletingFilial] = useState<FilialZig | null>(null)
  const [formData, setFormData] = useState<FilialZigFormData>(emptyFormData)

  // Estados para busca de endereço
  const [openEnderecoPopover, setOpenEnderecoPopover] = useState(false)
  const [enderecoSearchTerm, setEnderecoSearchTerm] = useState('')
  const [enderecosEncontrados, setEnderecosEncontrados] = useState<NominatimResult[]>([])
  const [buscandoEndereco, setBuscandoEndereco] = useState(false)

  const queryClient = useQueryClient()

  const { data: filiais, isLoading, error } = useQuery({
    queryKey: ['mco-filiais'],
    queryFn: () => filiaisService.getFiliais(),
  })

  const createMutation = useMutation({
    mutationFn: filiaisService.createFilial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-filiais'] })
      handleClose()
      toast.success('Filial criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar filial')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FilialZigFormData> }) =>
      filiaisService.updateFilial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-filiais'] })
      handleClose()
      toast.success('Filial atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar filial')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: filiaisService.deleteFilial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-filiais'] })
      setDeletingFilial(null)
      toast.success('Filial excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir filial')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      filiaisService.toggleActive(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-filiais'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    },
  })

  useEffect(() => {
    if (editingFilial) {
      setFormData({
        nome: editingFilial.nome,
        cidade: editingFilial.cidade,
        uf: editingFilial.uf,
        regiao: editingFilial.regiao || '',
        latitude: editingFilial.latitude,
        longitude: editingFilial.longitude,
        endereco: editingFilial.endereco || '',
        cep: editingFilial.cep || '',
        logradouro: editingFilial.logradouro || '',
        numero: editingFilial.numero || '',
        complemento: editingFilial.complemento || '',
        bairro: editingFilial.bairro || '',
        raio_atuacao_km: editingFilial.raio_atuacao_km,
        cluster_limite: editingFilial.cluster_limite,
        is_matriz: editingFilial.is_matriz,
      })
    }
  }, [editingFilial])

  // Buscar endereços via Nominatim
  useEffect(() => {
    if (!enderecoSearchTerm || enderecoSearchTerm.length < 3) {
      setEnderecosEncontrados([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoEndereco(true)
        const results = await searchNominatim(enderecoSearchTerm + ', Brasil')
        setEnderecosEncontrados(results)
      } catch (error) {
        console.error('Erro ao buscar endereços:', error)
        toast.error('Erro ao buscar endereços')
      } finally {
        setBuscandoEndereco(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [enderecoSearchTerm])

  const handleOpen = (filial?: FilialZig) => {
    if (filial) {
      setEditingFilial(filial)
    } else {
      setFormData(emptyFormData)
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingFilial(null)
    setFormData(emptyFormData)
  }

  const handleSave = () => {
    // Auto-set nome to cidade (filial name is the city itself)
    // Auto-set is_matriz to true if UF is SP
    const dataToSave = {
      ...formData,
      nome: formData.cidade,
      is_matriz: formData.uf === 'SP',
    }

    if (editingFilial) {
      updateMutation.mutate({ id: editingFilial.id, data: dataToSave })
    } else {
      createMutation.mutate(dataToSave)
    }
  }

  const handleDelete = () => {
    if (deletingFilial) {
      deleteMutation.mutate(deletingFilial.id)
    }
  }

  const activeCount = filiais?.filter((f) => f.ativo).length || 0
  const matrizCount = filiais?.filter((f) => f.is_matriz).length || 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Filiais</p>
                <p className="text-3xl font-bold">{filiais?.length || 0}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filiais Ativas</p>
                <p className="text-3xl font-bold">{activeCount}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matriz</p>
                <p className="text-3xl font-bold">{matrizCount}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Filiais Zig</h3>
          <p className="text-sm text-muted-foreground">
            Pontos de atendimento com raio de atuação
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Filial
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
            {error instanceof Error ? error.message : 'Erro ao carregar filiais'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && filiais && (
        <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="text-center">Raio (km)</TableHead>
                <TableHead className="text-center">Cluster Limite</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filiais.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma filial cadastrada. Clique em "Nova Filial" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                filiais.map((filial, index) => (
                  <TableRow
                    key={filial.id}
                    className={index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {filial.is_matriz && <Navigation className="h-4 w-4 text-blue-600" />}
                        {filial.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {filial.cidade}/{filial.uf}
                    </TableCell>
                    <TableCell className="text-center">{filial.raio_atuacao_km} km</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{filial.cluster_limite}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={filial.ativo}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: filial.id, ativo: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpen(filial)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingFilial(filial)}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              {editingFilial ? 'Editar Filial' : 'Nova Filial'}
            </DialogTitle>
            <DialogDescription>
              {editingFilial
                ? 'Atualize as informações da filial'
                : 'Preencha os dados para criar uma nova filial (o nome será a cidade)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Busca de Endereço */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar Endereço
              </Label>
              <Popover open={openEnderecoPopover} onOpenChange={setOpenEnderecoPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                    style={{ cursor: 'pointer' }}
                  >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Digite para buscar endereço automaticamente...
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="border-b p-2">
                      <Input
                        placeholder="Ex: Av. Paulista 1000, São Paulo"
                        value={enderecoSearchTerm}
                        onChange={(e) => setEnderecoSearchTerm(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {buscandoEndereco && (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                        </div>
                      )}
                      {!buscandoEndereco && enderecosEncontrados.length === 0 && enderecoSearchTerm.length >= 3 && (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          Nenhum endereço encontrado.
                        </div>
                      )}
                      {!buscandoEndereco && enderecoSearchTerm.length > 0 && enderecoSearchTerm.length < 3 && (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          Digite pelo menos 3 caracteres para buscar.
                        </div>
                      )}
                      {!buscandoEndereco && enderecosEncontrados.length > 0 && (
                        <div className="py-1">
                          {enderecosEncontrados.map((endereco) => (
                            <button
                              key={endereco.place_id}
                              type="button"
                              onClick={() => {
                                const cidade =
                                  endereco.address?.city ||
                                  endereco.address?.town ||
                                  endereco.address?.village ||
                                  endereco.address?.municipality ||
                                  ''
                                const uf = extractUF(endereco.address)
                                const lat = parseFloat(endereco.lat)
                                const lon = parseFloat(endereco.lon)

                                setFormData({
                                  ...formData,
                                  cidade,
                                  uf,
                                  latitude: lat,
                                  longitude: lon,
                                  cep: endereco.address?.postcode?.replace(/\D/g, '') || '',
                                  logradouro: endereco.address?.road || '',
                                  numero: endereco.address?.house_number || '',
                                  bairro: endereco.address?.suburb || endereco.address?.quarter || '',
                                  is_matriz: uf === 'SP',
                                })

                                setOpenEnderecoPopover(false)
                                setEnderecoSearchTerm('')
                                toast.success('Endereço preenchido automaticamente!')
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="font-medium truncate">{endereco.display_name}</div>
                              {endereco.address && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {endereco.address.road && `${endereco.address.road} `}
                                  {endereco.address.house_number && `${endereco.address.house_number}, `}
                                  {endereco.address.suburb && `${endereco.address.suburb}, `}
                                  {endereco.address.postcode && `CEP ${endereco.address.postcode}`}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Ou preencha os campos manualmente abaixo
              </p>
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Cidade *</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: Rio de Janeiro"
                />
              </div>

              <div className="space-y-2">
                <Label>UF *</Label>
                <Select
                  value={formData.uf}
                  onValueChange={(value) =>
                    setFormData({ ...formData, uf: value, is_matriz: value === 'SP' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Região */}
            <div className="space-y-2">
              <Label>Região</Label>
              <Select
                value={formData.regiao}
                onValueChange={(value) => setFormData({ ...formData, regiao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Raio de Atuação e Cluster Limite */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raio de Atuação (km)</Label>
                <Input
                  type="number"
                  value={formData.raio_atuacao_km}
                  onChange={(e) =>
                    setFormData({ ...formData, raio_atuacao_km: Number(e.target.value) })
                  }
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">Distância máxima para atendimento local</p>
              </div>

              <div className="space-y-2">
                <Label>Cluster Limite</Label>
                <Select
                  value={formData.cluster_limite}
                  onValueChange={(value: ClusterTamanho) =>
                    setFormData({ ...formData, cluster_limite: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLUSTER_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {CLUSTER_LABELS[size]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Tamanho máximo de evento que pode atender</p>
              </div>
            </div>

            {/* Seção de Endereço */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">Endereço (opcional)</Label>
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="70610-410"
                  maxLength={9}
                />
              </div>

              {/* Logradouro e Número */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    placeholder="Ex: Quadra SIG Quadra 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="495/515"
                  />
                </div>
              </div>

              {/* Complemento e Bairro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Ex: Salas 115/116"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Ex: Zona Industrial"
                  />
                </div>
              </div>
            </div>

            {/* Coordenadas (mantém para geocoding) */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  placeholder="-22.9068"
                />
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  placeholder="-43.1729"
                />
              </div>
            </div>

            {/* Info sobre Matriz */}
            {formData.uf === 'SP' && (
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                <Navigation className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Esta filial será automaticamente definida como Matriz (São Paulo)
                </AlertDescription>
              </Alert>
            )}
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
              {editingFilial ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingFilial} onOpenChange={() => setDeletingFilial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Filial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a filial "{deletingFilial?.nome}"? Esta ação não pode
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

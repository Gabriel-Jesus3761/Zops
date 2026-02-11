import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  AlertCircle,
  Save,
  Calculator,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  clustersService,
  cargosService,
  cargoClusterService,
  cargoCalculoParametrosService,
  cargoTimesService,
  clusterTamanhosService,
} from '../../services/mco-parametros.service'
import { toast } from 'sonner'

interface MatrixCell {
  cargoClusterId?: string
  quantidade: number
}

type MatrixData = Record<string, Record<string, MatrixCell>>

export function ManageDimensionamento() {
  const [matrixData, setMatrixData] = useState<MatrixData>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Queries
  const { data: clusters, isLoading: loadingClusters } = useQuery({
    queryKey: ['mco-clusters'],
    queryFn: () => clustersService.getClusters(),
  })

  const { data: cargos, isLoading: loadingCargos } = useQuery({
    queryKey: ['mco-cargos'],
    queryFn: () => cargosService.getCargos(),
  })

  const { data: cargoClusters, isLoading: loadingMatrix, error } = useQuery({
    queryKey: ['mco-cargo-cluster'],
    queryFn: () => cargoClusterService.getCargosClusters(),
  })

  const { data: parametrosCalculo } = useQuery({
    queryKey: ['mco-cargo-calculo-parametros'],
    queryFn: () => cargoCalculoParametrosService.getParametros(),
  })

  const { data: times } = useQuery({
    queryKey: ['mco-cargo-times'],
    queryFn: () => cargoTimesService.getTimes(),
  })

  const { data: clusterTamanhos } = useQuery({
    queryKey: ['mco-cluster-tamanhos'],
    queryFn: () => clusterTamanhosService.getTamanhos(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: cargoClusterService.createCargoCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-cluster'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantidade: number } }) =>
      cargoClusterService.updateCargoCluster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-cluster'] })
    },
  })

  // Build matrix data from cargo_cluster relationships
  useEffect(() => {
    if (!cargoClusters || !clusters || !cargos) return

    const matrix: MatrixData = {}

    // Initialize all cells with 0
    clusters.forEach((cluster) => {
      matrix[cluster.id] = {}
      cargos.forEach((cargo) => {
        matrix[cluster.id][cargo.id] = {
          quantidade: 0,
        }
      })
    })

    // Fill with existing data
    cargoClusters.forEach((cc) => {
      if (matrix[cc.cluster_id] && matrix[cc.cluster_id][cc.cargo_id]) {
        matrix[cc.cluster_id][cc.cargo_id] = {
          cargoClusterId: cc.id,
          quantidade: cc.quantidade,
        }
      }
    })

    setMatrixData(matrix)
  }, [cargoClusters, clusters, cargos])

  // Sorted lists
  const sortedClusters = useMemo(() => {
    if (!clusters) return []

    // Ordenar clusters baseado na ordem configurada em clusterTamanhos
    return [...clusters]
      .filter((c) => c.ativo)
      .sort((a, b) => {
        if (!clusterTamanhos || clusterTamanhos.length === 0) {
          // Fallback para ordem hardcoded se não houver configuração
          const order = ['PP', 'P', 'M', 'G', 'MEGA']
          return order.indexOf(a.tamanho) - order.indexOf(b.tamanho)
        }

        // Buscar ordem configurada
        const ordemA = clusterTamanhos.find(t => t.sigla === a.tamanho)?.ordem ?? 999
        const ordemB = clusterTamanhos.find(t => t.sigla === b.tamanho)?.ordem ?? 999
        return ordemA - ordemB
      })
  }, [clusters, clusterTamanhos])

  const sortedCargos = useMemo(() => {
    if (!cargos) return []
    return [...cargos].filter((c) => c.ativo).sort((a, b) => a.ordem - b.ordem)
  }, [cargos])

  // Verificar se um cargo é calculado automaticamente (baseado nos parâmetros de cálculo)
  const isCargoCalculado = useCallback((cargoId: string): boolean => {
    if (!parametrosCalculo) return false
    return (
      cargoId === parametrosCalculo.cargo_tecnico_id ||
      cargoId === parametrosCalculo.cargo_lider_id
    )
  }, [parametrosCalculo])

  // Obter nome legível do time a partir da sigla
  const getTimeNome = useCallback((timeSigla: string): string => {
    if (!times || times.length === 0) {
      // Fallback para labels hardcoded
      const labels: Record<string, string> = {
        tecnico: 'Técnico',
        comercial: 'Comercial',
        suporte: 'Suporte',
        lideranca: 'Liderança',
      }
      return labels[timeSigla] || timeSigla
    }
    const time = times.find(t => t.sigla === timeSigla)
    return time?.nome || timeSigla
  }, [times])

  // Separar cargos calculados vs configuráveis
  const cargosConfiguráveis = useMemo(() => {
    return sortedCargos.filter((cargo) => !isCargoCalculado(cargo.id))
  }, [sortedCargos, isCargoCalculado])

  const cargosCalculadosAuto = useMemo(() => {
    return sortedCargos.filter((cargo) => isCargoCalculado(cargo.id))
  }, [sortedCargos, isCargoCalculado])

  const handleCellChange = (clusterId: string, cargoId: string, value: string) => {
    const quantidade = parseInt(value, 10) || 0
    setMatrixData((prev) => ({
      ...prev,
      [clusterId]: {
        ...prev[clusterId],
        [cargoId]: {
          ...prev[clusterId][cargoId],
          quantidade,
        },
      },
    }))
    setHasChanges(true)
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleSave = async () => {
    if (!hasChanges) return

    try {
      const promises: Promise<any>[] = []

      // Percorrer todas as células da matriz
      Object.keys(matrixData).forEach((clusterId) => {
        Object.keys(matrixData[clusterId]).forEach((cargoId) => {
          const cell = matrixData[clusterId][cargoId]

          if (cell.cargoClusterId) {
            // Update existing
            promises.push(
              updateMutation.mutateAsync({
                id: cell.cargoClusterId,
                data: { quantidade: cell.quantidade },
              })
            )
          } else if (cell.quantidade > 0) {
            // Create new
            promises.push(
              createMutation.mutateAsync({
                cluster_id: clusterId,
                cargo_id: cargoId,
                quantidade: cell.quantidade,
              }).then((newId) => {
                // Update local state with new ID
                setMatrixData((prev) => ({
                  ...prev,
                  [clusterId]: {
                    ...prev[clusterId],
                    [cargoId]: {
                      ...prev[clusterId][cargoId],
                      cargoClusterId: newId,
                    },
                  },
                }))
              })
            )
          }
        })
      })

      await Promise.all(promises)
      setHasChanges(false)
      toast.success('Dimensionamentos salvos com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar dimensionamentos')
    }
  }

  const isLoading = loadingClusters || loadingCargos || loadingMatrix

  return (
    <div className="space-y-6">
      {/* Header com Parâmetros */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Cargos x Clusters</h3>
          <p className="text-sm text-muted-foreground">
            Configure a quantidade de cada cargo por cluster. Os cargos marcados como "Calculado" têm suas quantidades determinadas automaticamente pela medida @divisao_time baseada no faturamento, modalidade e ITE do cluster.
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="gap-2"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erro ao carregar dimensionamento'}
          </AlertDescription>
        </Alert>
      )}

      {/* Seção: Cargos Configuráveis Manualmente */}
      {!isLoading && !error && sortedClusters.length > 0 && cargosConfiguráveis.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-md font-semibold">Cargos Configuráveis Manualmente</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Cargos cujas quantidades você define manualmente para cada cluster.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="rounded-md border bg-white dark:bg-card overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Cargo</TableHead>
                  <TableHead className="text-center font-bold">Time</TableHead>
                  {sortedClusters.map((cluster) => (
                    <TableHead key={cluster.id} className="text-center min-w-[80px]">
                      <Badge variant="outline" className="font-mono font-bold">
                        {cluster.tamanho}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosConfiguráveis.map((cargo, idx) => (
                  <TableRow
                    key={cargo.id}
                    className={idx % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {cargo.sigla && (
                            <Badge variant="secondary" className="font-mono font-bold">
                              {cargo.sigla}
                            </Badge>
                          )}
                          <span>{cargo.nome}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {cargo.time ? getTimeNome(cargo.time) : '-'}
                      </Badge>
                    </TableCell>
                    {sortedClusters.map((cluster) => {
                      const cellKey = `${cluster.id}-${cargo.id}`
                      const cell = matrixData[cluster.id]?.[cargo.id]
                      const isEditing = editingCell === cellKey

                      return (
                        <TableCell key={cluster.id} className="text-center p-2">
                          <Input
                            type="number"
                            min="0"
                            value={cell?.quantidade > 0 ? cell.quantidade : ''}
                            placeholder="0"
                            onChange={(e) => handleCellChange(cluster.id, cargo.id, e.target.value)}
                            onFocus={() => setEditingCell(cellKey)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            className={`text-center h-9 ${
                              isEditing ? 'ring-2 ring-primary' : ''
                            } ${
                              cell?.quantidade > 0
                                ? 'font-semibold bg-primary/5'
                                : 'text-muted-foreground'
                            }`}
                            style={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Seção: Cargos Calculados Automaticamente */}
      {!isLoading && !error && sortedClusters.length > 0 && cargosCalculadosAuto.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-md font-semibold">Cargos Calculados Automaticamente</h4>
            <Badge variant="secondary" className="gap-1">
              <Calculator className="h-3 w-3" />
              @divisao_time
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Quantidades calculadas automaticamente pela medida @divisao_time baseada no faturamento, modalidade e ITE do cluster. Esses valores não podem ser editados manualmente.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="rounded-md border bg-muted/30 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Cargo</TableHead>
                  <TableHead className="text-center font-bold">Time</TableHead>
                  {sortedClusters.map((cluster) => (
                    <TableHead key={cluster.id} className="text-center min-w-[80px]">
                      <Badge variant="outline" className="font-mono font-bold">
                        {cluster.tamanho}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosCalculadosAuto.map((cargo, idx) => (
                  <TableRow
                    key={cargo.id}
                    className={idx % 2 === 0 ? 'bg-muted/20' : 'bg-muted/40'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {cargo.sigla && (
                            <Badge variant="default" className="font-mono font-bold bg-green-600">
                              {cargo.sigla}
                            </Badge>
                          )}
                          <span>{cargo.nome}</span>
                          <Badge variant="secondary" className="gap-1 ml-2">
                            <Calculator className="h-3 w-3" />
                            Calculado
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {cargo.time ? getTimeNome(cargo.time) : '-'}
                      </Badge>
                    </TableCell>
                    {sortedClusters.map((cluster) => (
                      <TableCell key={cluster.id} className="text-center p-2">
                        <div className="text-muted-foreground italic text-sm font-medium">
                          -
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Nota:</strong> Os valores de {cargosCalculadosAuto.map(c => c.sigla || c.nome).join(' e ')} são determinados automaticamente durante a criação de cada MCO, baseados no faturamento, modalidade, ITE do cluster e no parâmetro "Máximo de Técnicos por Líder". Esses cargos não precisam ser configurados manualmente nesta matriz.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      {!isLoading && sortedClusters.length > 0 && sortedCargos.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Como usar a Matriz de Cargos x Clusters:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Cargos Configuráveis:</strong> Defina manualmente as quantidades para cada combinação de cargo e cluster</li>
                  {cargosCalculadosAuto.length > 0 && (
                    <li>
                      <strong>Cargos Calculados:</strong> {cargosCalculadosAuto.map(c => c.sigla || c.nome).join(' e ')} são calculados automaticamente durante a criação do MCO
                    </li>
                  )}
                  <li>Clique em qualquer célula editável e digite a quantidade desejada</li>
                  <li>Após fazer as alterações, clique no botão "Salvar Alterações" no topo da página</li>
                  <li>As quantidades configuradas aqui são usadas nos cálculos de MCO para determinar custos de mão de obra</li>
                  <li>Configure primeiro os clusters e cargos antes de preencher a matriz</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

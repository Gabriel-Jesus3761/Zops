import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, MapPin, Save, Loader2, Info, AlertCircle, Trash2, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NumberInput } from '@/components/ui/number-input'
import {
  parametrosFreteService,
  filiaisService,
  clustersService,
} from '../../services/mco-parametros.service'
import { mcoCalculatorService } from '@/features/planejamento/services/mco-calculator.service'
import { toast } from 'sonner'
import type { Cluster, FilialZig } from '../../types/mco-parametros'

const REGIAO_ORDER = ['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste', 'Norte']

export function ManageFrete() {
  const queryClient = useQueryClient()

  // Global distance parameters (shared across all records)
  const [raioMaximo, setRaioMaximo] = useState<number>(40)
  const [valorKmAdicional, setValorKmAdicional] = useState<number>(5.0)

  // Matrix: key = `${filial_id}_${cluster_id}` → valor_base
  const [matrizValues, setMatrizValues] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch data
  const {
    data: filiais,
    isLoading: loadingFiliais,
    error: errorFiliais,
  } = useQuery({
    queryKey: ['mco-filiais'],
    queryFn: () => filiaisService.getFiliais(),
  })

  const {
    data: clusters,
    isLoading: loadingClusters,
    error: errorClusters,
  } = useQuery({
    queryKey: ['mco-clusters'],
    queryFn: () => clustersService.getClusters(),
  })

  const {
    data: parametrosFrete,
    isLoading: loadingFrete,
    error: errorFrete,
  } = useQuery({
    queryKey: ['mco-parametros-frete'],
    queryFn: () => parametrosFreteService.getParametros(),
  })

  // Initialize values from existing records
  useEffect(() => {
    if (!parametrosFrete || parametrosFrete.length === 0) return

    // Use first record for global params
    const primeiro = parametrosFrete[0]
    setRaioMaximo(primeiro.raio_maximo_km)
    setValorKmAdicional(primeiro.valor_km_adicional)

    // Build matrix map
    const map: Record<string, number> = {}
    parametrosFrete.forEach((p) => {
      map[`${p.filial_id}_${p.cluster_id}`] = p.valor_base
    })
    setMatrizValues(map)
  }, [parametrosFrete])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!filiais || !clusters) return

      const saves: Promise<unknown>[] = []

      filiais
        .filter((f) => f.ativo)
        .forEach((filial) => {
          clusters
            .filter((c) => c.ativo)
            .forEach((cluster) => {
              const key = `${filial.id}_${cluster.id}`
              const valorBase = matrizValues[key] ?? 0
              const existing = parametrosFrete?.find(
                (p) => p.filial_id === filial.id && p.cluster_id === cluster.id
              )

              if (existing) {
                saves.push(
                  parametrosFreteService.updateParametro(existing.id, {
                    valor_base: valorBase,
                    raio_maximo_km: raioMaximo,
                    valor_km_adicional: valorKmAdicional,
                  })
                )
              } else {
                saves.push(
                  parametrosFreteService.createParametro({
                    filial_id: filial.id,
                    cluster_id: cluster.id,
                    valor_base: valorBase,
                    raio_maximo_km: raioMaximo,
                    valor_km_adicional: valorKmAdicional,
                  })
                )
              }
            })
        })

      await Promise.all(saves)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-frete'] })
      setHasChanges(false)
      mcoCalculatorService.clearCache()
      toast.success('Parâmetros de frete salvos com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao salvar parâmetros de frete:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar parâmetros')
    },
  })

  const deletarMutation = useMutation({
    mutationFn: () => parametrosFreteService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-frete'] })
      mcoCalculatorService.clearCache()
      setMatrizValues({})
      setHasChanges(false)
      toast.success('Valores de frete deletados do banco com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar valores')
    },
  })

  const handleResetar = () => {
    setMatrizValues({})
    setHasChanges(true)
    toast.info('Matriz zerada. Clique em "Salvar Alterações" para confirmar no banco.')
  }

  const handleMatrizChange = (filialId: string, clusterId: string, valor: number) => {
    setMatrizValues((prev) => ({ ...prev, [`${filialId}_${clusterId}`]: valor }))
    setHasChanges(true)
  }

  // Group active filiais by region
  const filiaisAgrupadas = useMemo(() => {
    const ativas = filiais?.filter((f) => f.ativo) ?? []
    return ativas.reduce<Record<string, FilialZig[]>>((acc, filial) => {
      const regiao = filial.regiao || 'Outros'
      if (!acc[regiao]) acc[regiao] = []
      acc[regiao].push(filial)
      return acc
    }, {})
  }, [filiais])

  const clustersAtivos = useMemo(
    () => clusters?.filter((c) => c.ativo).sort((a, b) => {
      const order: Record<string, number> = { PP: 0, P: 1, M: 2, G: 3, MEGA: 4 }
      return (order[a.tamanho] ?? 99) - (order[b.tamanho] ?? 99)
    }) ?? [],
    [clusters]
  )

  const regioesOrdenadas = useMemo(() => {
    const todas = Object.keys(filiaisAgrupadas)
    return [
      ...REGIAO_ORDER.filter((r) => todas.includes(r)),
      ...todas.filter((r) => !REGIAO_ORDER.includes(r)),
    ]
  }, [filiaisAgrupadas])

  const isLoading = loadingFiliais || loadingClusters || loadingFrete
  const error = errorFiliais || errorClusters || errorFrete

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Erro ao carregar parâmetros de frete'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleResetar}
          disabled={deletarMutation.isPending || saveMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetar Valores
        </Button>
        <Button
          variant="destructive"
          onClick={() => deletarMutation.mutate()}
          disabled={deletarMutation.isPending || saveMutation.isPending}
        >
          {deletarMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Deletar Valores
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Card 1: Parâmetros de Distância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Parâmetros de Distância
          </CardTitle>
          <CardDescription>
            Configure os valores para cálculo de frete baseado em distância
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Raio Máximo da Filial (X)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={raioMaximo}
                  onChange={(e) => {
                    setRaioMaximo(Number(e.target.value))
                    setHasChanges(true)
                  }}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">km</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Distância máxima para aplicar valor base da matriz
              </p>
            </div>
            <div className="space-y-2">
              <Label>Valor por Km Adicional (Y)</Label>
              <NumberInput
                value={valorKmAdicional}
                onChange={(v) => {
                  setValorKmAdicional(v)
                  setHasChanges(true)
                }}
                currency
                placeholder="R$ 0,00"
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Valor cobrado por km excedente além do raio máximo
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <strong>Lógica de cálculo:</strong> Eventos dentro de {raioMaximo} km do organizador
              usam o valor da matriz. Eventos além dessa distância adicionam R${' '}
              {valorKmAdicional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × (distância
              - {raioMaximo}) ao valor base.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Matriz de Fretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-primary" />
            Matriz de Fretes
          </CardTitle>
          <CardDescription>
            Defina os valores de frete por organizador e tamanho de evento (cluster)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regioesOrdenadas.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma filial cadastrada. Cadastre filiais em{' '}
                <strong>Motores de Cálculo → Filiais</strong> para configurar a matriz de fretes.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 min-w-[180px] bg-muted/50 px-3 py-2 text-left font-medium">
                      Organizador
                    </th>
                    {clustersAtivos.map((cluster: Cluster) => (
                      <th
                        key={cluster.id}
                        className="min-w-[120px] px-2 py-2 text-center font-medium"
                      >
                        {cluster.tamanho}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regioesOrdenadas.map((regiao) => {
                    const filiaisRegiao = filiaisAgrupadas[regiao]
                    if (!filiaisRegiao?.length) return null
                    return (
                      <>
                        {/* Region header row */}
                        <tr key={`regiao-${regiao}`} style={{ backgroundColor: '#C2D6F7' }}>
                          <td
                            colSpan={clustersAtivos.length + 1}
                            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {regiao}
                          </td>
                        </tr>

                        {/* Filial rows */}
                        {filiaisRegiao.map((filial: FilialZig, idx: number) => (
                          <tr
                            key={filial.id}
                            className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                          >
                            <td className="sticky left-0 bg-inherit px-3 py-1.5">
                              {filial.cidade}/{filial.uf}
                            </td>
                            {clustersAtivos.map((cluster: Cluster) => (
                              <td key={cluster.id} className="px-1 py-1 text-center">
                                <NumberInput
                                  value={
                                    matrizValues[`${filial.id}_${cluster.id}`] ?? 0
                                  }
                                  onChange={(v) =>
                                    handleMatrizChange(filial.id, cluster.id, v)
                                  }
                                  currency
                                  placeholder="R$ 0,00"
                                  className="h-8 w-full text-center text-xs"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

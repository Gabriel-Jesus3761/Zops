import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, Info, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  etapaTimesService,
  cargoTimesService,
  categoriasRemuneracaoService,
} from '../../services/mco-parametros.service'
import { toast } from 'sonner'

export function ManageEtapaTimes() {
  const [localConfig, setLocalConfig] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const queryClient = useQueryClient()

  // Queries
  const { data: configuracoes, isLoading: loadingConfiguracoes } = useQuery({
    queryKey: ['mco-etapa-times'],
    queryFn: () => etapaTimesService.getConfiguracoes(),
  })

  const { data: times, isLoading: loadingTimes } = useQuery({
    queryKey: ['mco-cargo-times'],
    queryFn: () => cargoTimesService.getTimes(),
  })

  const { data: etapas, isLoading: loadingEtapas } = useQuery({
    queryKey: ['mco-categorias-remuneracao'],
    queryFn: () => categoriasRemuneracaoService.getCategorias(),
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      etapaTimesService.toggleAtivo(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-etapa-times'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: etapaTimesService.createConfiguracao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-etapa-times'] })
    },
  })

  // Sorted lists
  const sortedTimes = useMemo(() => {
    if (!times) return []
    return [...times].filter((t) => t.ativo).sort((a, b) => a.ordem - b.ordem)
  }, [times])

  const sortedEtapas = useMemo(() => {
    if (!etapas) return []
    return [...etapas]
      .filter((e) => e.ativo)
      .sort((a, b) => a.ordem - b.ordem)
  }, [etapas])

  // Initialize local config from server data
  useEffect(() => {
    if (!configuracoes || !times || !etapas) return

    const config: Record<string, boolean> = {}
    configuracoes.forEach((c) => {
      const key = `${c.etapa_id}___${c.time_id}`
      config[key] = c.ativo
    })
    setLocalConfig(config)
    setHasChanges(false)
  }, [configuracoes, times, etapas])

  // Get config value for a specific etapa-time combination
  const getConfigValue = (etapaId: string, timeId: string): boolean => {
    const key = `${etapaId}___${timeId}`
    return localConfig[key] ?? true // Default: ativo
  }

  // Get configuration ID
  const getConfigId = (etapaId: string, timeId: string): string | undefined => {
    return configuracoes?.find((c) => c.etapa_id === etapaId && c.time_id === timeId)?.id
  }

  // Toggle checkbox
  const toggleConfig = (etapaId: string, timeId: string) => {
    const key = `${etapaId}___${timeId}`
    setLocalConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  // Count active times per etapa
  const getTimesAtivos = (etapaId: string): number => {
    return sortedTimes.filter((time) => getConfigValue(etapaId, time.id)).length
  }

  // Save all changes
  const handleSave = async () => {
    if (!hasChanges) return

    try {
      const promises: Promise<any>[] = []

      sortedEtapas.forEach((etapa) => {
        sortedTimes.forEach((time) => {
          const key = `${etapa.id}___${time.id}`
          const ativo = localConfig[key] ?? true
          const configId = getConfigId(etapa.id, time.id)

          if (configId) {
            // Update existing
            promises.push(updateMutation.mutateAsync({ id: configId, ativo }))
          } else {
            // Create new
            promises.push(
              createMutation.mutateAsync({
                etapa_id: etapa.id,
                time_id: time.id,
                ativo,
              })
            )
          }
        })
      })

      await Promise.all(promises)
      setHasChanges(false)
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    }
  }

  const isLoading = loadingConfiguracoes || loadingTimes || loadingEtapas
  const isSaving = updateMutation.isPending || createMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Times por Etapa</h3>
          <p className="text-sm text-muted-foreground">
            Configure quais times participam de cada etapa do evento
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
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

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta configuração determina quais times são alocados em cada etapa do evento. Times
          desativados em uma etapa não receberão diárias, alimentação ou hospedagem para aquela
          fase específica.
        </AlertDescription>
      </Alert>

      {/* Matrix Table */}
      {sortedEtapas.length === 0 || sortedTimes.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {sortedEtapas.length === 0
              ? 'Nenhuma etapa configurada. Configure as etapas primeiro.'
              : 'Nenhum time configurado. Configure os times primeiro.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold min-w-[150px]">Etapa</TableHead>
                    {sortedTimes.map((time) => (
                      <TableHead key={time.id} className="text-center min-w-[120px]">
                        <Badge variant="outline" className="font-medium">
                          {time.nome}
                        </Badge>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold min-w-[100px]">
                      Times Ativos
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEtapas.map((etapa, idx) => (
                    <TableRow
                      key={etapa.id}
                      className={idx % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{etapa.nome}</Badge>
                        </div>
                      </TableCell>
                      {sortedTimes.map((time) => {
                        const isChecked = getConfigValue(etapa.id, time.id)
                        return (
                          <TableCell key={time.id} className="text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleConfig(etapa.id, time.id)}
                                className="h-5 w-5"
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono font-bold">
                          {getTimesAtivos(etapa.id)} / {sortedTimes.length}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {sortedEtapas.length > 0 && sortedTimes.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Como usar:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Marque os checkboxes para ativar a participação do time na etapa</li>
                  <li>Desmarque para desativar (o time não será alocado naquela etapa)</li>
                  <li>
                    A coluna "Times Ativos" mostra quantos times estão participando de cada etapa
                  </li>
                  <li>Após fazer as alterações, clique em "Salvar Alterações" no topo</li>
                  <li>
                    Esta configuração afeta diretamente os cálculos de MCO (diárias, alimentação,
                    hospedagem)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

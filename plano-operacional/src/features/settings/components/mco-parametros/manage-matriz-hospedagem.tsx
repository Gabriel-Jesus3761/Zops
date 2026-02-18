import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, BedDouble, Info, Loader2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import {
  cargosService,
  clustersService,
  hospedagemElegibilidadeService,
} from '../../services/mco-parametros.service'
import { toast } from 'sonner'

// Ordem dos clusters por tamanho
const CLUSTER_ORDER: Record<string, number> = { PP: 0, P: 1, M: 2, G: 3, MEGA: 4 }

// Ordem dos times — suporta tanto valores legacy (Time Alpha) quanto novos (lideranca)
const TIME_ORDER: Record<string, number> = {
  // Valores Firebase (underscore)
  time_alpha: 0,
  time_beta: 1,
  time_gama: 2,
  time_controle: 3,
  // Valores legacy (espaço)
  'Time Alpha': 0,
  'Time Beta': 1,
  'Time Gama': 2,
  'Time Controle': 3,
  // Valores novos
  lideranca: 0,
  tecnico: 1,
  comercial: 2,
  suporte: 3,
}

const formatTimeLabel = (time: string): string => {
  // "time_alpha" → "Time Alpha"
  return time
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const TIME_COLOR: Record<string, { color: string; border: string }> = {
  // Firebase (underscore)
  time_alpha: {
    color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
  },
  time_beta: {
    color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  time_gama: {
    color: 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  time_controle: {
    color: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
  // Legacy (espaço)
  'Time Alpha': {
    color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
  },
  'Time Beta': {
    color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'Time Gama': {
    color: 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  'Time Controle': {
    color: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
  // Novos
  lideranca: {
    color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
  },
  tecnico: {
    color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  comercial: {
    color: 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  suporte: {
    color: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
}

const TIME_COLOR_FALLBACK = {
  color: 'text-muted-foreground bg-muted',
  border: 'border-muted',
}

export function ManageMatrizHospedagem() {
  const queryClient = useQueryClient()
  const [editedValues, setEditedValues] = useState<Record<string, boolean>>({})

  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ['mco-cargos'],
    queryFn: () => cargosService.getCargos(),
  })

  const { data: clusters = [], isLoading: loadingClusters } = useQuery({
    queryKey: ['mco-clusters'],
    queryFn: () => clustersService.getClusters(),
  })

  const { data: elegibilidade = [], isLoading: loadingElegibilidade } = useQuery({
    queryKey: ['hospedagem-elegibilidade'],
    queryFn: () => hospedagemElegibilidadeService.getAll(),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      hospedagemElegibilidadeService.salvarAlteracoes(editedValues, elegibilidade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospedagem-elegibilidade'] })
      setEditedValues({})
      toast.success('Matriz de hospedagem atualizada!')
    },
    onError: () => {
      toast.error('Erro ao salvar alterações')
    },
  })

  // Cargos ativos ordenados: por time (liderança primeiro) depois por ordem
  const cargosSorted = useMemo(() => {
    return [...cargos]
      .filter((c) => c.ativo)
      .sort((a, b) => {
        const timeA = TIME_ORDER[a.time] ?? 99
        const timeB = TIME_ORDER[b.time] ?? 99
        if (timeA !== timeB) return timeA - timeB
        return (a.ordem ?? 0) - (b.ordem ?? 0)
      })
  }, [cargos])

  // Clusters ativos ordenados por tamanho (PP → MEGA)
  const clustersSorted = useMemo(() => {
    return [...clusters]
      .filter((c) => c.ativo)
      .sort((a, b) => (CLUSTER_ORDER[a.tamanho] ?? 99) - (CLUSTER_ORDER[b.tamanho] ?? 99))
  }, [clusters])

  const getElegibilidade = (cargoId: string, clusterId: string): boolean => {
    const key = `${cargoId}__${clusterId}`
    if (key in editedValues) return editedValues[key]
    return (
      elegibilidade.find((e) => e.cargo_id === cargoId && e.cluster_id === clusterId)
        ?.elegivel ?? false
    )
  }

  const toggleElegibilidade = (cargoId: string, clusterId: string) => {
    const key = `${cargoId}__${clusterId}`
    const current = getElegibilidade(cargoId, clusterId)
    // Se está revertendo ao valor original, remove da lista de pendentes
    const original =
      elegibilidade.find((e) => e.cargo_id === cargoId && e.cluster_id === clusterId)
        ?.elegivel ?? false
    const newValue = !current
    if (newValue === original) {
      setEditedValues((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } else {
      setEditedValues((prev) => ({ ...prev, [key]: newValue }))
    }
  }

  const isLoading = loadingCargos || loadingClusters || loadingElegibilidade
  const hasChanges = Object.keys(editedValues).length > 0
  const changesCount = Object.keys(editedValues).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BedDouble className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Elegibilidade por Cargo × Cluster</p>
            <p className="text-xs text-muted-foreground">
              {cargosSorted.length} cargos · {clustersSorted.length} clusters
            </p>
          </div>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar ({changesCount})
          </Button>
        )}
      </div>

      {/* Info */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Marque os cargos que têm direito à hospedagem para cada tamanho de evento.
          O valor da diária é definido pela cidade do evento na{' '}
          <span className="font-medium">Base de Custo</span>.
        </AlertDescription>
      </Alert>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-md border bg-white dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/50 font-semibold">
                Cargo
              </TableHead>
              <TableHead className="sticky left-[200px] z-20 w-28 bg-muted/50 text-center font-semibold">
                Time
              </TableHead>
              {clustersSorted.map((cluster) => (
                <TableHead
                  key={cluster.id}
                  className="min-w-[80px] text-center font-semibold"
                >
                  {cluster.tamanho}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargosSorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2 + clustersSorted.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  Nenhum cargo ativo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              cargosSorted.map((cargo, index) => {
                const timeColor = TIME_COLOR[cargo.time] ?? TIME_COLOR_FALLBACK
                const rowBg =
                  index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'
                return (
                  <TableRow key={cargo.id} className={rowBg}>
                    {/* Cargo */}
                    <TableCell className={cn('sticky left-0 z-10 font-medium', rowBg)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {cargo.sigla}
                        </span>
                        <span className="text-sm">{cargo.nome}</span>
                      </div>
                    </TableCell>

                    {/* Time badge */}
                    <TableCell
                      className={cn('sticky left-[200px] z-10 text-center', rowBg)}
                    >
                      <Badge
                        variant="outline"
                        className={cn('text-xs', timeColor.color, timeColor.border)}
                      >
                        {cargo.time ? formatTimeLabel(cargo.time) : '—'}
                      </Badge>
                    </TableCell>

                    {/* Checkboxes por cluster */}
                    {clustersSorted.map((cluster) => {
                      const elegivel = getElegibilidade(cargo.id, cluster.id)
                      const key = `${cargo.id}__${cluster.id}`
                      const isPending = key in editedValues
                      return (
                        <TableCell key={cluster.id} className="text-center">
                          <Checkbox
                            checked={elegivel}
                            onCheckedChange={() =>
                              toggleElegibilidade(cargo.id, cluster.id)
                            }
                            className={cn(
                              'mx-auto',
                              isPending && 'ring-2 ring-primary ring-offset-1'
                            )}
                          />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

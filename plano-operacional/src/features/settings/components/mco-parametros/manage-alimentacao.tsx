import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, AlertCircle, Save, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NumberInput } from '@/components/ui/number-input'
import {
  alimentacaoValoresService,
  categoriasRemuneracaoService,
  jornadasService,
  tipoCalculoConfigService,
} from '../../services/mco-parametros.service'
import type { AlimentacaoValorFormData } from '../../types/mco-parametros'
import { getIconByName } from '../../pages/etapas-projeto'
import { toast } from 'sonner'

export function ManageAlimentacao() {
  const [valores, setValores] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const queryClient = useQueryClient()

  // Buscar categorias de remuneração (viagem, setup, day_off, go_live)
  const {
    data: todasCategorias,
    isLoading: isLoadingCategorias,
    error: errorCategorias,
  } = useQuery({
    queryKey: ['mco-categorias-remuneracao'],
    queryFn: () => categoriasRemuneracaoService.getCategorias(),
  })

  // Buscar jornadas ativas
  const {
    data: todasJornadas,
    isLoading: isLoadingJornadas,
    error: errorJornadas,
  } = useQuery({
    queryKey: ['mco-jornadas'],
    queryFn: () => jornadasService.getJornadas(),
  })

  // Buscar valores existentes
  const {
    data: valoresExistentes,
    isLoading: isLoadingValores,
    error: errorValores,
  } = useQuery({
    queryKey: ['mco-alimentacao-valores'],
    queryFn: () => alimentacaoValoresService.getValores(),
  })

  // Buscar configuração de tipos (para ícones dinâmicos)
  const { data: tiposConfig } = useQuery({
    queryKey: ['tipo-calculo-config'],
    queryFn: () => tipoCalculoConfigService.getTipos(),
  })

  // Filtrar categorias ativas e jornadas ativas (memoizado para evitar loops)
  const categorias = useMemo(
    () => todasCategorias?.filter((c) => c.ativo).sort((a, b) => a.ordem - b.ordem),
    [todasCategorias]
  )

  const jornadas = useMemo(
    () => todasJornadas?.filter((j) => j.ativo).sort((a, b) => a.ordem - b.ordem),
    [todasJornadas]
  )

  const categoriasSimples = useMemo(
    () => categorias?.filter((c) => c.tipo_calculo !== 'go_live'),
    [categorias]
  )
  const categoriaGoLive = useMemo(
    () => categorias?.find((c) => c.tipo_calculo === 'go_live'),
    [categorias]
  )

  // Inicializar valores quando dados carregarem
  useEffect(() => {
    if (valoresExistentes && categorias && jornadas) {
      const initialValues: Record<string, number> = {}

      categorias.forEach((categoria) => {
        if (categoria.tipo_calculo === 'go_live') {
          jornadas.forEach((jornada) => {
            const key = `${categoria.id}-${jornada.id}`
            const existente = valoresExistentes.find(
              (v) => v.categoria_id === categoria.id && v.jornada_id === jornada.id
            )
            initialValues[key] = existente?.valor || 0
          })
        } else {
          const key = `${categoria.id}-null`
          const existente = valoresExistentes.find(
            (v) => v.categoria_id === categoria.id && v.jornada_id === null
          )
          initialValues[key] = existente?.valor || 0
        }
      })

      setValores(initialValues)
    }
  }, [valoresExistentes, categorias, jornadas])

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!categorias || !jornadas) return

      const valoresParaSalvar: AlimentacaoValorFormData[] = []

      categorias.forEach((categoria) => {
        if (categoria.tipo_calculo === 'go_live') {
          jornadas.forEach((jornada) => {
            const key = `${categoria.id}-${jornada.id}`
            valoresParaSalvar.push({
              categoria_id: categoria.id,
              jornada_id: jornada.id,
              valor: valores[key] || 0,
            })
          })
        } else {
          const key = `${categoria.id}-null`
          valoresParaSalvar.push({
            categoria_id: categoria.id,
            jornada_id: null,
            valor: valores[key] || 0,
          })
        }
      })

      await alimentacaoValoresService.saveValores(valoresParaSalvar)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-alimentacao-valores'] })
      setHasChanges(false)
      toast.success('Valores de alimentação salvos com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao salvar valores de alimentação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar valores')
    },
  })

  const handleValorChange = (key: string, value: number) => {
    setValores((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const isLoading = isLoadingCategorias || isLoadingJornadas || isLoadingValores
  const error = errorCategorias || errorJornadas || errorValores

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
          {error instanceof Error ? error.message : 'Erro ao carregar dados'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!categorias?.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma categoria de remuneração encontrada. Configure primeiro as categorias (Viagem,
          Setup, Day Off, Go Live) em Parâmetros de Diárias.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Fases com Valor Único */}
      {categoriasSimples && categoriasSimples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Fases com Valor Único
            </CardTitle>
            <CardDescription>Configure um valor único por dia para cada fase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoriasSimples.map((categoria) => {
                const tipoConfig = tiposConfig?.find((t) => t.valor === categoria.tipo_calculo)
                const Icon = getIconByName(tipoConfig?.icon || 'Circle')
                const key = `${categoria.id}-null`
                return (
                  <div key={categoria.id} className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{categoria.nome}</span>
                    </div>
                    <NumberInput
                      value={valores[key] || 0}
                      onChange={(value) => handleValorChange(key, value)}
                      currency
                      placeholder="R$ 0,00"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Go Live (por Jornada) */}
      {categoriaGoLive && jornadas && jornadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Go Live (por Jornada)
            </CardTitle>
            <CardDescription>
              Configure o valor de alimentação para cada tipo de jornada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jornadas.map((jornada) => {
                const key = `${categoriaGoLive.id}-${jornada.id}`
                return (
                  <div key={jornada.id} className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{jornada.nome}</span>
                    </div>
                    <NumberInput
                      value={valores[key] || 0}
                      onChange={(value) => handleValorChange(key, value)}
                      currency
                      placeholder="R$ 0,00"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

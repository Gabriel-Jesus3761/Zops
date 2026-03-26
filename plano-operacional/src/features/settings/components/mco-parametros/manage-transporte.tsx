import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, Bus, Plane, MapPin, Save, Loader2, Info, AlertCircle, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NumberInput } from '@/components/ui/number-input'
import {
  parametrosTransporteService,
  parametrosGeraisService,
} from '../../services/mco-parametros.service'
import { mcoCalculatorService } from '@/features/planejamento/services/mco-calculator.service'
import { toast } from 'sonner'

export function ManageTransporte() {
  const queryClient = useQueryClient()

  // Form state
  const [carroMax, setCarroMax] = useState<number>(100)
  const [onibusMax, setOnibusMax] = useState<number>(500)
  const [custoCarro, setCustoCarro] = useState<number>(2.0)
  const [custoOnibus, setCustoOnibus] = useState<number>(1.0)
  const [custoAereo, setCustoAereo] = useState<number>(2.5)
  const [transporteLocalDiario, setTransporteLocalDiario] = useState<number>(50)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch modal parameters (carro, onibus, aereo)
  const {
    data: parametros,
    isLoading: loadingParametros,
    error: errorParametros,
  } = useQuery({
    queryKey: ['mco-parametros-transporte'],
    queryFn: () => parametrosTransporteService.getParametros(),
  })

  // Fetch general parameters (for transporte_local_diario)
  const {
    data: parametrosGerais,
    isLoading: loadingGerais,
    error: errorGerais,
  } = useQuery({
    queryKey: ['mco-parametros-gerais'],
    queryFn: () => parametrosGeraisService.getParametros(),
  })

  // Initialize form values when data loads
  useEffect(() => {
    if (parametros) {
      const carro = parametros.find((p) => p.modal === 'carro')
      const onibus = parametros.find((p) => p.modal === 'onibus')
      const aereo = parametros.find((p) => p.modal === 'aereo')
      if (carro) {
        setCarroMax(carro.distancia_maxima_km)
        setCustoCarro(carro.custo_por_km)
      }
      if (onibus) {
        setOnibusMax(onibus.distancia_maxima_km)
        setCustoOnibus(onibus.custo_por_km)
      }
      if (aereo) {
        setCustoAereo(aereo.custo_por_km)
      }
    }
  }, [parametros])

  useEffect(() => {
    if (parametrosGerais) {
      setTransporteLocalDiario(parametrosGerais.valor_transporte_local_diario)
    }
  }, [parametrosGerais])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const carro = parametros?.find((p) => p.modal === 'carro')
      const onibus = parametros?.find((p) => p.modal === 'onibus')
      const aereo = parametros?.find((p) => p.modal === 'aereo')

      const updates: Promise<any>[] = []

      // Upsert: atualiza se já existe, cria se ainda não foi salvo no Firebase
      if (carro) {
        updates.push(
          parametrosTransporteService.updateParametro(carro.id, {
            distancia_minima_km: 0,
            distancia_maxima_km: carroMax,
            custo_por_km: custoCarro,
          })
        )
      } else {
        updates.push(
          parametrosTransporteService.createParametro({
            modal: 'carro',
            distancia_minima_km: 0,
            distancia_maxima_km: carroMax,
            custo_por_km: custoCarro,
            custo_fixo: 0,
          })
        )
      }

      if (onibus) {
        updates.push(
          parametrosTransporteService.updateParametro(onibus.id, {
            distancia_minima_km: carroMax,
            distancia_maxima_km: onibusMax,
            custo_por_km: custoOnibus,
          })
        )
      } else {
        updates.push(
          parametrosTransporteService.createParametro({
            modal: 'onibus',
            distancia_minima_km: carroMax,
            distancia_maxima_km: onibusMax,
            custo_por_km: custoOnibus,
            custo_fixo: 0,
          })
        )
      }

      if (aereo) {
        updates.push(
          parametrosTransporteService.updateParametro(aereo.id, {
            distancia_minima_km: onibusMax,
            distancia_maxima_km: 99999,
            custo_por_km: custoAereo,
          })
        )
      } else {
        updates.push(
          parametrosTransporteService.createParametro({
            modal: 'aereo',
            distancia_minima_km: onibusMax,
            distancia_maxima_km: 99999,
            custo_por_km: custoAereo,
            custo_fixo: 0,
          })
        )
      }

      // Sempre salva parametrosGerais (cria se não existir, atualiza se já existir)
      updates.push(
        parametrosGeraisService.saveParametros({
          max_tecnicos_por_lider: parametrosGerais?.max_tecnicos_por_lider ?? 4,
          valor_transporte_local_diario: transporteLocalDiario,
          valor_day_off_diario: parametrosGerais?.valor_day_off_diario ?? 0,
          distancia_evento_local_km: parametrosGerais?.distancia_evento_local_km ?? 40,
        })
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-transporte'] })
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-gerais'] })
      mcoCalculatorService.clearCache()
      setHasChanges(false)
      toast.success('Parâmetros de transporte salvos com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao salvar parâmetros de transporte:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar parâmetros')
    },
  })

  const handleResetar = () => {
    // Recarrega os valores do Firebase
    if (parametros) {
      const carro = parametros.find((p) => p.modal === 'carro')
      const onibus = parametros.find((p) => p.modal === 'onibus')
      const aereo = parametros.find((p) => p.modal === 'aereo')
      if (carro) { setCarroMax(carro.distancia_maxima_km); setCustoCarro(carro.custo_por_km) }
      if (onibus) { setOnibusMax(onibus.distancia_maxima_km); setCustoOnibus(onibus.custo_por_km) }
      if (aereo) { setCustoAereo(aereo.custo_por_km) }
    }
    if (parametrosGerais) setTransporteLocalDiario(parametrosGerais.valor_transporte_local_diario)
    setHasChanges(false)
    toast.info('Valores restaurados do banco.')
  }

  const handleChange = () => setHasChanges(true)

  // Habilita salvar se houve mudança OU se ainda não há dados no Firebase (primeiro save)
  const semDadosNoFirebase = !loadingParametros && parametros !== undefined && parametros.length === 0
  const podesSalvar = hasChanges || semDadosNoFirebase

  const isLoading = loadingParametros || loadingGerais
  const error = errorParametros || errorGerais

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
          {error instanceof Error ? error.message : 'Erro ao carregar parâmetros de transporte'}
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
          disabled={saveMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetar Valores
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!podesSalvar || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Card 1: Modal por Distância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5 text-primary" />
            Parâmetros de Modal por Distância
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            O sistema escolhe o modal automaticamente com base na distância até o evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carro */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Carro</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Distância Máxima (km)</Label>
                <Input
                  type="number"
                  value={carroMax}
                  min={1}
                  onChange={(e) => {
                    setCarroMax(Number(e.target.value))
                    handleChange()
                  }}
                />
                <p className="text-xs text-muted-foreground">Até essa distância usa carro</p>
              </div>
              <div className="space-y-2">
                <Label>Custo por Km</Label>
                <NumberInput
                  value={custoCarro}
                  onChange={(v) => {
                    setCustoCarro(v)
                    handleChange()
                  }}
                  currency
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </div>

          {/* Ônibus */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Bus className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Ônibus</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Faixa de Distância (km)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={carroMax}
                    disabled
                    className="bg-muted"
                  />
                  <span className="whitespace-nowrap text-muted-foreground">até</span>
                  <Input
                    type="number"
                    value={onibusMax}
                    min={carroMax + 1}
                    onChange={(e) => {
                      setOnibusMax(Number(e.target.value))
                      handleChange()
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Limite inferior = máximo do carro</p>
              </div>
              <div className="space-y-2">
                <Label>Custo por Km</Label>
                <NumberInput
                  value={custoOnibus}
                  onChange={(v) => {
                    setCustoOnibus(v)
                    handleChange()
                  }}
                  currency
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </div>

          {/* Aéreo */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Aéreo</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Distância Mínima (km)</Label>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-muted-foreground">Acima de</span>
                  <Input
                    type="number"
                    value={onibusMax}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Limite = máximo do ônibus</p>
              </div>
              <div className="space-y-2">
                <Label>Custo por Km</Label>
                <NumberInput
                  value={custoAereo}
                  onChange={(v) => {
                    setCustoAereo(v)
                    handleChange()
                  }}
                  currency
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              O sistema escolhe automaticamente o modal com base na distância entre a filial de
              origem e o local do evento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Transporte Local Diário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5 text-primary" />
            Transporte Local Diário
          </CardTitle>
          <CardDescription>
            Custo de transporte local por pessoa durante todos os dias do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Valor Diário por Pessoa</Label>
            <NumberInput
              value={transporteLocalDiario}
              onChange={(v) => {
                setTransporteLocalDiario(v)
                handleChange()
              }}
              currency
              placeholder="R$ 0,00"
            />
            <p className="text-xs text-muted-foreground">
              Custo de transporte local (vans, Uber, etc.) por dia por pessoa
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Este valor × colaboradores × dias do evento = custo total de transporte local
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

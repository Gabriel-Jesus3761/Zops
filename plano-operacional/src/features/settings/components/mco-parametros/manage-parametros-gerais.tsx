import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings2,
  Loader2,
  AlertCircle,
  Save,
  Users,
  Car,
  Calendar,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { parametrosGeraisService, mcoSeedService } from '../../services/mco-parametros.service'
import type { ParametrosGeraisMCOFormData } from '../../types/mco-parametros'
import { toast } from 'sonner'

export function ManageParametrosGerais() {
  const [formData, setFormData] = useState<ParametrosGeraisMCOFormData>({
    max_tecnicos_por_lider: 8,
    valor_transporte_local_diario: 150,
    valor_day_off_diario: 200,
    distancia_evento_local_km: 50,
  })
  const [hasChanges, setHasChanges] = useState(false)

  const queryClient = useQueryClient()

  const { data: parametros, isLoading, error } = useQuery({
    queryKey: ['mco-parametros-gerais'],
    queryFn: () => parametrosGeraisService.getParametros(),
  })

  const saveMutation = useMutation({
    mutationFn: parametrosGeraisService.saveParametros,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-gerais'] })
      setHasChanges(false)
      toast.success('Parâmetros salvos com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar parâmetros')
    },
  })

  const seedMutation = useMutation({
    mutationFn: mcoSeedService.seedAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-clusters'] })
      queryClient.invalidateQueries({ queryKey: ['mco-filiais'] })
      queryClient.invalidateQueries({ queryKey: ['mco-cargos'] })
      queryClient.invalidateQueries({ queryKey: ['mco-modalidades'] })
      queryClient.invalidateQueries({ queryKey: ['mco-jornadas'] })
      queryClient.invalidateQueries({ queryKey: ['mco-parametros-gerais'] })
      toast.success('Dados iniciais populados com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao popular dados')
    },
  })

  useEffect(() => {
    if (parametros) {
      setFormData({
        max_tecnicos_por_lider: parametros.max_tecnicos_por_lider,
        valor_transporte_local_diario: parametros.valor_transporte_local_diario,
        valor_day_off_diario: parametros.valor_day_off_diario,
        distancia_evento_local_km: parametros.distancia_evento_local_km,
      })
    }
  }, [parametros])

  const handleChange = (field: keyof ParametrosGeraisMCOFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Parâmetros Gerais do MCO</h3>
          <p className="text-sm text-muted-foreground">
            Configurações globais utilizadas nos cálculos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Popular Dados Iniciais
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
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
            {error instanceof Error ? error.message : 'Erro ao carregar parâmetros'}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Mão de Obra */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Mão de Obra
              </CardTitle>
              <CardDescription>
                Parâmetros de dimensionamento da equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Máximo de Técnicos por Líder</Label>
                <Input
                  type="number"
                  value={formData.max_tecnicos_por_lider}
                  onChange={(e) => handleChange('max_tecnicos_por_lider', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Quantos TCAs um LTT pode coordenar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transporte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-5 w-5 text-primary" />
                Transporte Local
              </CardTitle>
              <CardDescription>
                Custos de deslocamento diário no local do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valor do Transporte Local Diário (R$)</Label>
                <Input
                  type="number"
                  value={formData.valor_transporte_local_diario}
                  onChange={(e) =>
                    handleChange('valor_transporte_local_diario', Number(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Custo diário de transporte local (taxi/uber)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Day Off */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                Day Off
              </CardTitle>
              <CardDescription>
                Valores de folga entre sessões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valor do Day Off Diário (R$)</Label>
                <Input
                  type="number"
                  value={formData.valor_day_off_diario}
                  onChange={(e) => handleChange('valor_day_off_diario', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Custo diário quando equipe fica no local entre sessões
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Viagem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" />
                Classificação de Viagem
              </CardTitle>
              <CardDescription>
                Parâmetros para determinar se evento é local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Distância Máxima para Evento Local (km)</Label>
                <Input
                  type="number"
                  value={formData.distancia_evento_local_km}
                  onChange={(e) =>
                    handleChange('distancia_evento_local_km', Number(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Abaixo dessa distância, considera evento local (sem viagem)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-5 w-5" />
            Como esses parâmetros são usados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="font-medium">Cálculo de Mão de Obra:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>LTT = TCA / Máx. Técnicos por Líder</li>
                <li>Se equipe pequena, apenas 1 LTT</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Cálculo de Transporte:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Transporte Local = Dias × Valor Diário</li>
                <li>Aplicado apenas para dias de Go Live</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Cálculo de Day Off:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Compara custo "ficar" vs "voltar"</li>
                <li>Day Off = Dias entre sessões × Valor</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Classificação de Evento Local:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Distância &lt; Limite = Evento Local</li>
                <li>Não inclui custos de viagem/hospedagem</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

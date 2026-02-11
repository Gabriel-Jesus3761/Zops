import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plane, Wrench, Coffee, Zap, Loader2, AlertCircle, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NumberInput } from '@/components/ui/number-input'
import {
  cargosService,
  categoriasRemuneracaoService,
  cargoCategoriaValorService,
  jornadasService,
  cargoJornadaCategoriaService
} from '../services/mco-parametros.service'
import { toast } from 'sonner'

const ICON_MAP = {
  viagem: Plane,
  setup: Wrench,
  day_off: Coffee,
  go_live: Zap,
}

export function ParametrosDiariasPage() {
  const [valores, setValores] = useState<Record<string, number>>({})
  const [valoresGoLive, setValoresGoLive] = useState<Record<string, number>>({})
  const [hasChangesGoLive, setHasChangesGoLive] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('viagem')

  const queryClient = useQueryClient()

  const { data: cargos, isLoading: isLoadingCargos } = useQuery({
    queryKey: ['mco-cargos'],
    queryFn: () => cargosService.getCargos(),
  })

  const { data: jornadas, isLoading: isLoadingJornadas } = useQuery({
    queryKey: ['mco-jornadas'],
    queryFn: () => jornadasService.getJornadas(),
  })

  const { data: categorias, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['mco-categorias-remuneracao'],
    queryFn: () => categoriasRemuneracaoService.getCategorias(),
  })

  const { data: valoresExistentes, isLoading: isLoadingValores } = useQuery({
    queryKey: ['mco-cargo-categoria-valores'],
    queryFn: () => cargoCategoriaValorService.getValores(),
  })

  const { data: valoresGoLiveExistentes, isLoading: isLoadingValoresGoLive } = useQuery({
    queryKey: ['mco-cargo-jornada-categoria-valores'],
    queryFn: () => cargoJornadaCategoriaService.getValores(),
  })

  const salvarMutation = useMutation({
    mutationFn: async ({ categoriaId }: { categoriaId: string }) => {
      // Delete existing values for this category
      await cargoCategoriaValorService.deleteByCategoria(categoriaId)

      // Prepare new values
      const novosValores = Object.entries(valores)
        .filter(([key]) => key.includes(categoriaId))
        .map(([key, valor]) => {
          const [cargoId, catId] = key.split('___')
          return {
            cargo_id: cargoId,
            categoria_id: catId,
            valor,
          }
        })

      // Save new values
      if (novosValores.length > 0) {
        await cargoCategoriaValorService.saveValores(novosValores)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-categoria-valores'] })
      toast.success('Valores salvos com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar valores')
    },
  })

  const salvarGoLiveMutation = useMutation({
    mutationFn: async () => {
      const categoriaGoLive = categorias?.find((c) => c.tipo_calculo === 'go_live')
      if (!categoriaGoLive) throw new Error('Categoria Go Live não encontrada')

      // Delete all existing Go Live values
      await cargoJornadaCategoriaService.deleteByCategoria(categoriaGoLive.id)

      // Prepare new values (only save values > 0)
      const novosValores = Object.entries(valoresGoLive)
        .filter(([, valor]) => valor > 0)
        .map(([key, valor]) => {
          const [cargoId, jornadaId] = key.split('___')
          return {
            cargo_id: cargoId,
            jornada_id: jornadaId,
            categoria_id: categoriaGoLive.id,
            valor,
          }
        })

      // Save new values
      if (novosValores.length > 0) {
        await cargoJornadaCategoriaService.saveValores(novosValores)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mco-cargo-jornada-categoria-valores'] })
      setHasChangesGoLive(false)
      toast.success('Valores de Go Live salvos com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar valores de Go Live')
    },
  })

  // Load existing values into state
  useEffect(() => {
    if (valoresExistentes && cargos && categorias) {
      const initialValues: Record<string, number> = {}

      cargos.forEach((cargo) => {
        categorias.forEach((categoria) => {
          const key = `${cargo.id}___${categoria.id}`
          const existingValor = valoresExistentes.find(
            (v) => v.cargo_id === cargo.id && v.categoria_id === categoria.id
          )
          initialValues[key] = existingValor?.valor || 0
        })
      })

      setValores(initialValues)
    }
  }, [valoresExistentes, cargos, categorias])

  // Load existing Go Live values into state
  useEffect(() => {
    if (valoresGoLiveExistentes && cargos && jornadas && categorias) {
      const categoriaGoLive = categorias.find((c) => c.tipo_calculo === 'go_live')
      if (!categoriaGoLive) return

      const initialValues: Record<string, number> = {}

      cargos.forEach((cargo) => {
        jornadas.forEach((jornada) => {
          const key = `${cargo.id}___${jornada.id}`
          const existingValor = valoresGoLiveExistentes.find(
            (v) =>
              v.cargo_id === cargo.id &&
              v.jornada_id === jornada.id &&
              v.categoria_id === categoriaGoLive.id
          )
          initialValues[key] = existingValor?.valor || 0
        })
      })

      setValoresGoLive(initialValues)
    }
  }, [valoresGoLiveExistentes, cargos, jornadas, categorias])

  const handleValorChange = (cargoId: string, categoriaId: string, valor: number) => {
    const key = `${cargoId}___${categoriaId}`
    setValores((prev) => ({ ...prev, [key]: valor }))
  }

  const handleValorGoLiveChange = (cargoId: string, jornadaId: string, valor: number) => {
    const key = `${cargoId}___${jornadaId}`
    setValoresGoLive((prev) => ({ ...prev, [key]: valor }))
    setHasChangesGoLive(true)
  }

  const handleSave = (categoriaId: string) => {
    salvarMutation.mutate({ categoriaId })
  }

  const handleSaveGoLive = () => {
    salvarGoLiveMutation.mutate()
  }

  const isLoading = isLoadingCargos || isLoadingCategorias || isLoadingValores || isLoadingJornadas || isLoadingValoresGoLive
  const categoriasFixas = categorias
    ?.filter((c) => c.ativo && ['viagem', 'setup', 'day_off'].includes(c.tipo_calculo))
    .sort((a, b) => a.ordem - b.ordem)
  const categoriaGoLive = categorias?.find((c) => c.ativo && c.tipo_calculo === 'go_live')
  const sortedCargos = cargos?.sort((a, b) => a.ordem - b.ordem)
  const sortedJornadas = jornadas?.sort((a, b) => a.ordem - b.ordem)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cargos || cargos.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum cargo cadastrado. Configure os cargos antes de definir os parâmetros de diárias.
        </AlertDescription>
      </Alert>
    )
  }

  if (!categorias || categorias.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma categoria de remuneração cadastrada. Configure as categorias antes de definir os parâmetros de diárias.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Parâmetros de Diárias</h3>
        <p className="text-sm text-muted-foreground">
          Configure valores das diárias por cargo para cada categoria de remuneração
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração de Valores</CardTitle>
          <CardDescription>Defina os valores diários para cada cargo em cada categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {categoriasFixas?.map((categoria) => {
                const Icon = ICON_MAP[categoria.tipo_calculo as keyof typeof ICON_MAP]
                return (
                  <TabsTrigger key={categoria.id} value={categoria.tipo_calculo}>
                    <Icon className="mr-2 h-4 w-4" />
                    {categoria.nome}
                  </TabsTrigger>
                )
              })}
              {categoriaGoLive && (
                <TabsTrigger value="go_live">
                  <Zap className="mr-2 h-4 w-4" />
                  {categoriaGoLive.nome}
                </TabsTrigger>
              )}
            </TabsList>

            {categoriasFixas?.map((categoria) => (
              <TabsContent key={categoria.id} value={categoria.tipo_calculo} className="space-y-4 mt-6">
                <div className="space-y-4">
                  {cargos.map((cargo) => {
                    const key = `${cargo.id}___${categoria.id}`
                    return (
                      <div key={cargo.id} className="grid grid-cols-[1fr_250px] gap-4 items-center">
                        <Label className="font-medium">
                          {cargo.sigla} - {cargo.nome}
                        </Label>
                        <NumberInput
                          value={valores[key] || 0}
                          onChange={(valor) => handleValorChange(cargo.id, categoria.id, valor)}
                          allowDecimal
                          currency
                          className="w-full"
                          placeholder="R$ 0,00"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleSave(categoria.id)}
                    disabled={salvarMutation.isPending}
                    style={{ cursor: 'pointer' }}
                  >
                    {salvarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar {categoria.nome}
                  </Button>
                </div>
              </TabsContent>
            ))}

            {categoriaGoLive && (
              <TabsContent value="go_live" className="space-y-4 mt-6">
                {!jornadas || jornadas.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma jornada cadastrada. Configure as jornadas antes de definir as diárias Go Live.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Configure os valores das diárias Go Live por cargo e jornada de trabalho
                      </p>
                      <Button
                        onClick={handleSaveGoLive}
                        disabled={!hasChangesGoLive || salvarGoLiveMutation.isPending}
                        style={{ cursor: 'pointer' }}
                      >
                        {salvarGoLiveMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar {categoriaGoLive.nome}
                      </Button>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 bg-muted/50 z-10 font-semibold">Cargo</TableHead>
                            {sortedJornadas?.map((jornada) => (
                              <TableHead key={jornada.id} className="text-center min-w-[150px]">
                                <div className="flex flex-col">
                                  <span className="font-semibold">{jornada.nome}</span>
                                  <span className="text-xs text-muted-foreground font-normal">
                                    {jornada.hora_inicio} - {jornada.hora_fim}
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedCargos?.map((cargo, idx) => (
                            <TableRow key={cargo.id} className={idx % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/30'}>
                              <TableCell className="sticky left-0 bg-inherit z-10 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs">{cargo.sigla}</span>
                                  <span>{cargo.nome}</span>
                                </div>
                              </TableCell>
                              {sortedJornadas?.map((jornada) => {
                                const key = `${cargo.id}___${jornada.id}`
                                return (
                                  <TableCell key={jornada.id} className="p-2">
                                    <NumberInput
                                      value={valoresGoLive[key] || 0}
                                      onChange={(valor) => handleValorGoLiveChange(cargo.id, jornada.id, valor)}
                                      allowDecimal
                                      currency
                                      className="w-full"
                                      placeholder="R$ 0,00"
                                    />
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

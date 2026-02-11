import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Loader2, AlertCircle, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NumberInput } from '@/components/ui/number-input'
import { cargosService, jornadasService, categoriasRemuneracaoService, cargoJornadaCategoriaService } from '../services/mco-parametros.service'
import type { Cargo, Jornada, CategoriaRemuneracao } from '../types/mco-parametros'
import { toast } from 'sonner'

export function DiariasGoLivePage() {
  const [valores, setValores] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const queryClient = useQueryClient()

  const { data: cargos, isLoading: isLoadingCargos } = useQuery({
    queryKey: ['mco-cargos'],
    queryFn: () => cargosService.getCargos(),
  })

  const { data: jornadas, isLoading: isLoadingJornadas } = useQuery({
    queryKey: ['mco-jornadas'],
    queryFn: () => jornadasService.getJornadas(),
  })

  const { data: categorias } = useQuery({
    queryKey: ['mco-categorias-remuneracao'],
    queryFn: () => categoriasRemuneracaoService.getCategorias(),
  })

  const { data: valoresExistentes, isLoading: isLoadingValores } = useQuery({
    queryKey: ['mco-cargo-jornada-categoria-valores'],
    queryFn: () => cargoJornadaCategoriaService.getValores(),
  })

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const categoriaGoLive = categorias?.find((c) => c.tipo_calculo === 'go_live')
      if (!categoriaGoLive) throw new Error('Categoria Go Live não encontrada')

      // Delete all existing Go Live values
      await cargoJornadaCategoriaService.deleteByCategoria(categoriaGoLive.id)

      // Prepare new values (only save values > 0)
      const novosValores = Object.entries(valores)
        .filter(([, valor]) => valor > 0)
        .map(([key, valor]) => {
          const [cargoId, jornadaId] = key.split('-')
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
      setHasChanges(false)
      toast.success('Valores de Go Live salvos com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar valores')
    },
  })

  // Load existing values into state
  useEffect(() => {
    if (valoresExistentes && cargos && jornadas && categorias) {
      const categoriaGoLive = categorias.find((c) => c.tipo_calculo === 'go_live')
      if (!categoriaGoLive) return

      const initialValues: Record<string, number> = {}

      cargos.forEach((cargo) => {
        jornadas.forEach((jornada) => {
          const key = `${cargo.id}-${jornada.id}`
          const existingValor = valoresExistentes.find(
            (v) =>
              v.cargo_id === cargo.id &&
              v.jornada_id === jornada.id &&
              v.categoria_id === categoriaGoLive.id
          )
          initialValues[key] = existingValor?.valor || 0
        })
      })

      setValores(initialValues)
    }
  }, [valoresExistentes, cargos, jornadas, categorias])

  const handleValorChange = (cargoId: string, jornadaId: string, valor: number) => {
    const key = `${cargoId}-${jornadaId}`
    setValores((prev) => ({ ...prev, [key]: valor }))
    setHasChanges(true)
  }

  const handleSave = () => {
    salvarMutation.mutate()
  }

  const isLoading = isLoadingCargos || isLoadingJornadas || isLoadingValores
  const sortedCargos = cargos?.sort((a, b) => a.ordem - b.ordem)
  const sortedJornadas = jornadas?.sort((a, b) => a.ordem - b.ordem)
  const categoriaGoLive = categorias?.find((c) => c.tipo_calculo === 'go_live')

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
          Nenhum cargo cadastrado. Configure os cargos antes de definir as diárias Go Live.
        </AlertDescription>
      </Alert>
    )
  }

  if (!jornadas || jornadas.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma jornada cadastrada. Configure as jornadas antes de definir as diárias Go Live.
        </AlertDescription>
      </Alert>
    )
  }

  if (!categoriaGoLive) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Categoria Go Live não encontrada. Configure uma categoria com tipo "go_live" antes de continuar.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Diárias Go Live</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure os valores das diárias Go Live por cargo e jornada
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || salvarMutation.isPending}
          style={{ cursor: 'pointer' }}
        >
          {salvarMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Valores</CardTitle>
          <CardDescription>
            Defina o valor da diária para cada combinação de cargo e jornada de trabalho
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      const key = `${cargo.id}-${jornada.id}`
                      return (
                        <TableCell key={jornada.id} className="p-2">
                          <NumberInput
                            value={valores[key] || 0}
                            onChange={(valor) => handleValorChange(cargo.id, jornada.id, valor)}
                            allowDecimal
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
        </CardContent>
      </Card>
    </div>
  )
}

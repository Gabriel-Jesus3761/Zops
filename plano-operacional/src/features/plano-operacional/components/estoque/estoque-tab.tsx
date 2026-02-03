import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, ArrowRightLeft, Package } from 'lucide-react'
import { useEstoque } from '../../hooks'
import { cn } from '@/lib/utils'

export function EstoqueTab() {
  const {
    terminais,
    insumos,
    totalTerminais,
    totalInsumos,
    terminaisDisponiveis,
    insumosDisponiveis,
    alertasBaixoEstoque,
    isLoading,
  } = useEstoque()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-64 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Terminais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTerminais}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{terminaisDisponiveis} disponíveis</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsumos}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{insumosDisponiveis} disponíveis</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Utilização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTerminais > 0
                ? (((totalTerminais - terminaisDisponiveis) / totalTerminais) * 100).toFixed(0)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Equipamentos alocados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertasBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground">Itens com estoque baixo</p>
          </CardContent>
        </Card>
      </div>

      {/* Terminais e Insumos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Terminais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Terminais de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum terminal cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  terminais.map(item => {
                    const percentDisponivel = (item.disponivel! / item.quantidade) * 100
                    const isBaixoEstoque = percentDisponivel < 20

                    return (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.modelo}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              isBaixoEstoque && 'bg-orange-100 text-orange-800'
                            )}
                          >
                            {item.disponivel}
                            {isBaixoEstoque && (
                              <AlertCircle className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.disponivel! > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Transferir para PDV"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="flex items-center justify-between rounded-md bg-blue-50 p-3 dark:bg-blue-950">
              <span className="text-sm font-semibold">Total de Terminais</span>
              <span className="text-lg font-bold text-blue-600">
                {totalTerminais}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Insumos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              Insumos e Acessórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum insumo cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  insumos.map(item => {
                    const percentDisponivel = (item.disponivel! / item.quantidade) * 100
                    const isBaixoEstoque = percentDisponivel < 20

                    return (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.modelo}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              isBaixoEstoque && 'bg-orange-100 text-orange-800'
                            )}
                          >
                            {item.disponivel}
                            {isBaixoEstoque && (
                              <AlertCircle className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.disponivel! > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Transferir para PDV"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="flex items-center justify-between rounded-md bg-gray-100 p-3 dark:bg-gray-800">
              <span className="text-sm font-semibold">Total de Insumos</span>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                {totalInsumos}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Baixo Estoque */}
      {alertasBaixoEstoque > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-5 w-5" />
              Itens com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Há <strong>{alertasBaixoEstoque}</strong> item(ns) com menos de 20% de estoque
              disponível. Considere reabastecer ou realocar equipamentos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

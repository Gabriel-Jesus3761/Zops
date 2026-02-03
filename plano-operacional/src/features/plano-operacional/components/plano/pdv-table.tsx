import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Package, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PDV } from '../../types'
import { cn } from '@/lib/utils'

interface PDVTableProps {
  data: PDV[]
  isLoading?: boolean
}

const statusColors = {
  Pendente: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Em Preparação': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  Entregue: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Devolvido: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  Cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export function PDVTable({ data, isLoading }: PDVTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>PDV</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Terminais</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-12 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum PDV encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo ponto de venda
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Ponto de Venda</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Terminais</TableHead>
            <TableHead className="text-right">Insumos</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(pdv => {
            const isExpanded = expandedRows.has(pdv.key)
            const isEstoque = pdv['Ponto de Venda'].toLowerCase() === 'estoque'
            const totalInsumos =
              pdv.carregadores + pdv.capas + pdv.cartoes + pdv.powerbanks + pdv.tomadas

            return (
              <>
                <TableRow
                  key={pdv.key}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    pdv.desativado && 'opacity-50',
                    isEstoque && 'bg-blue-50 dark:bg-blue-950'
                  )}
                  onClick={() => toggleRow(pdv.key)}
                >
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{pdv['Ponto de Venda']}</TableCell>
                  <TableCell>
                    <Badge className={cn('font-normal', statusColors[pdv.Status])}>
                      {pdv.Status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{pdv.setor || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{pdv.totalTerminais}</TableCell>
                  <TableCell className="text-right font-medium">{totalInsumos}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {pdv.responsavel || '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Transferir equipamento</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Desativar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/30 p-4">
                      <div className="space-y-4">
                        {/* Terminais Serializados */}
                        {pdv.SERIAIS_FISICOS.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold">
                              Terminais ({pdv.SERIAIS_FISICOS.length})
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {pdv.SERIAIS_FISICOS.map((serial, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-md border bg-background p-2 text-sm"
                                >
                                  <div className="font-mono text-xs text-muted-foreground">
                                    Serial: {serial}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Equipamentos */}
                        {pdv.equipamentos.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold">Equipamentos</h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {pdv.equipamentos.map((equip, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-md border bg-background p-2 text-sm"
                                >
                                  <span>{equip.MODELO}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {equip.QUANTIDADE}x
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Insumos resumidos */}
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">Insumos</h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {pdv.carregadores > 0 && (
                              <div className="flex items-center justify-between rounded-md border bg-background p-2 text-sm">
                                <span>Carregadores</span>
                                <Badge variant="secondary">{pdv.carregadores}</Badge>
                              </div>
                            )}
                            {pdv.capas > 0 && (
                              <div className="flex items-center justify-between rounded-md border bg-background p-2 text-sm">
                                <span>Capas</span>
                                <Badge variant="secondary">{pdv.capas}</Badge>
                              </div>
                            )}
                            {pdv.cartoes > 0 && (
                              <div className="flex items-center justify-between rounded-md border bg-background p-2 text-sm">
                                <span>Cartões</span>
                                <Badge variant="secondary">{pdv.cartoes}</Badge>
                              </div>
                            )}
                            {pdv.powerbanks > 0 && (
                              <div className="flex items-center justify-between rounded-md border bg-background p-2 text-sm">
                                <span>Powerbanks</span>
                                <Badge variant="secondary">{pdv.powerbanks}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

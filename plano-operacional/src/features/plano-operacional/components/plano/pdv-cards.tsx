import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, User, MapPin, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import type { PDV } from '../../types'
import { cn } from '@/lib/utils'

interface PDVCardsProps {
  data: PDV[]
  isLoading?: boolean
}

const statusColors = {
  Pendente: 'bg-orange-100 text-orange-800 border-orange-200',
  'Em Preparação': 'bg-blue-100 text-blue-800 border-blue-200',
  Entregue: 'bg-green-100 text-green-800 border-green-200',
  Devolvido: 'bg-gray-100 text-gray-800 border-gray-200',
  Cancelado: 'bg-red-100 text-red-800 border-red-200',
}

export function PDVCards({ data, isLoading }: PDVCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleCard = (key: string) => {
    setExpandedCards(prev => {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map(pdv => {
        const isExpanded = expandedCards.has(pdv.key)
        const isEstoque = pdv['Ponto de Venda'].toLowerCase() === 'estoque'
        const totalInsumos =
          pdv.carregadores + pdv.capas + pdv.cartoes + pdv.powerbanks + pdv.tomadas

        return (
          <Card
            key={pdv.key}
            className={cn(
              'transition-all hover:shadow-md',
              pdv.desativado && 'opacity-50',
              isEstoque && 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{pdv['Ponto de Venda']}</CardTitle>
                  {pdv.setor && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {pdv.setor}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Transferir equipamento</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Desativar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={cn('font-normal', statusColors[pdv.Status])}>
                  {pdv.Status}
                </Badge>
                {pdv.categoria && (
                  <span className="text-xs text-muted-foreground">{pdv.categoria}</span>
                )}
              </div>

              {pdv.responsavel && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{pdv.responsavel}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Terminais</div>
                  <div className="text-lg font-semibold">{pdv.totalTerminais}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Insumos</div>
                  <div className="text-lg font-semibold">{totalInsumos}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Seriais</div>
                  <div className="text-lg font-semibold">{pdv.SERIAIS_FISICOS.length}</div>
                </div>
              </div>

              {pdv.equipamentos.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCard(pdv.key)}
                    className="h-7 w-full justify-between px-2 text-xs"
                  >
                    <span>Ver equipamentos</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 rounded-md border p-2">
                      {pdv.equipamentos.map((equip, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate">{equip.MODELO}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {equip.QUANTIDADE}x
                          </Badge>
                        </div>
                      ))}

                      {pdv.SERIAIS_FISICOS.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                          <div className="mb-1 text-xs font-semibold">Seriais:</div>
                          <div className="space-y-1">
                            {pdv.SERIAIS_FISICOS.slice(0, 3).map((serial, idx) => (
                              <div key={idx} className="font-mono text-[10px] text-muted-foreground">
                                {serial}
                              </div>
                            ))}
                            {pdv.SERIAIS_FISICOS.length > 3 && (
                              <div className="text-[10px] text-muted-foreground">
                                +{pdv.SERIAIS_FISICOS.length - 3} mais
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

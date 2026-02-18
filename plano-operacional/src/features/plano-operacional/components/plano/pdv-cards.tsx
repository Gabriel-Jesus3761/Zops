import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, User, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
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
  Inativo: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function PDVCards({ data, isLoading }: PDVCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [selectedPDV, setSelectedPDV] = useState<PDV | null>(null)

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map(pdv => {
        const isExpanded = expandedCards.has(pdv.key)
        const isEstoque = pdv['Ponto de Venda'].toLowerCase() === 'estoque'
        const isInactive = pdv.desativado || pdv.Status === 'Cancelado'
        const statusLabel = (isInactive ? 'Inativo' : pdv.Status) as keyof typeof statusColors

        return (
          <Card
            key={pdv.key}
            className={cn(
              'cursor-pointer overflow-hidden transition-all hover:shadow-md',
              pdv.desativado && 'opacity-50',
              isEstoque && 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
            )}
            onClick={() => setSelectedPDV(pdv)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelectedPDV(pdv)
              }
            }}
          >
            <CardHeader className="pb-1 pt-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-[13px] font-semibold leading-snug">
                  {pdv['Ponto de Venda']}
                </CardTitle>
                <Badge
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    statusColors[statusLabel]
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{pdv.setor || 'Setor não informado'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center gap-2 text-[13px]">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {pdv.responsavel || 'Sem técnico'}
                </span>
              </div>

              {pdv.equipamentos.length > 0 && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleCard(pdv.key)
                    }}
                    className="h-9 w-full justify-between px-3 text-sm sm:h-7 sm:px-2 sm:text-xs"
                  >
                    <span>Ver equipamentos</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>

                  {isExpanded && (
                    <div
                      className="mt-2 space-y-2 rounded-lg border bg-background/60 p-3"
                      onClick={(event) => event.stopPropagation()}
                    >
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

      <Dialog open={!!selectedPDV} onOpenChange={(open) => !open && setSelectedPDV(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedPDV && (() => {
            const isInactive = selectedPDV.desativado || selectedPDV.Status === 'Cancelado'
            const statusLabel = (isInactive ? 'Inativo' : selectedPDV.Status) as keyof typeof statusColors
            const totalInsumos =
              selectedPDV.carregadores + selectedPDV.capas + selectedPDV.cartoes + selectedPDV.powerbanks + selectedPDV.tomadas

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedPDV['Ponto de Venda']}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-medium', statusColors[statusLabel])}>
                      {statusLabel}
                    </Badge>
                    {selectedPDV.setor && (
                      <span className="text-muted-foreground">Setor: {selectedPDV.setor}</span>
                    )}
                    {selectedPDV.categoria && (
                      <span className="text-muted-foreground">Categoria: {selectedPDV.categoria}</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Terminais</div>
                      <div className="text-lg font-semibold">{selectedPDV.totalTerminais}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Insumos</div>
                      <div className="text-lg font-semibold">{totalInsumos}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Seriais</div>
                      <div className="text-lg font-semibold">{selectedPDV.SERIAIS_FISICOS.length}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Responsável</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {selectedPDV.responsavel || 'Sem técnico'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Equipamentos</h4>
                    {selectedPDV.equipamentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum equipamento informado</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPDV.equipamentos.map((equip, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-md border bg-background p-2 text-sm">
                            <span className="truncate">{equip.MODELO}</span>
                            <Badge variant="secondary">{equip.QUANTIDADE}x</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Seriais</h4>
                    {selectedPDV.SERIAIS_FISICOS.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum serial registrado</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedPDV.SERIAIS_FISICOS.map((serial, idx) => (
                          <div key={idx} className="rounded-md border bg-background p-2 font-mono text-xs text-muted-foreground">
                            {serial}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

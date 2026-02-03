import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import type { DashboardMetrics } from '../../types'

interface DashboardTabProps {
  metrics: DashboardMetrics
  isLoading?: boolean
}

export function DashboardTab({ metrics, isLoading }: DashboardTabProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais de PDVs */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Visão Geral dos PDVs</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de PDVs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPDVs}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-green-600">{metrics.pdvsAtivos} ativos</span>
                {metrics.pdvsInativos > 0 && (
                  <span className="text-red-600">{metrics.pdvsInativos} inativos</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.pdvsEntregues}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {metrics.totalPDVs > 0
                  ? `${((metrics.pdvsEntregues / metrics.totalPDVs) * 100).toFixed(0)}% do total`
                  : '0% do total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.pdvsPendentes}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Aguardando configuração
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devolvidos</CardTitle>
              <XCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.pdvsDevolvidos}</div>
              <p className="mt-1 text-xs text-muted-foreground">Equipamentos retornados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas de Equipamentos */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Gestão de Equipamentos</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminais</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTerminais}</div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Alocados</span>
                  <span className="font-medium">{metrics.terminaisAlocados}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Disponíveis</span>
                  <span className="font-medium text-green-600">
                    {metrics.terminaisDisponiveis}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insumos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInsumos}</div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Alocados</span>
                  <span className="font-medium">{metrics.insumosAlocados}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Disponíveis</span>
                  <span className="font-medium text-green-600">
                    {metrics.insumosDisponiveis}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              {metrics.taxaOcupacao >= 80 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.taxaOcupacao.toFixed(1)}%
              </div>
              <Progress value={metrics.taxaOcupacao} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {metrics.taxaOcupacao >= 80
                  ? 'Alta ocupação - considere reabastecer'
                  : 'Nível adequado'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas */}
      {metrics.alertasBaixoEstoque > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>{metrics.alertasBaixoEstoque}</strong> item(ns) com estoque baixo (menos de
              20% da capacidade). Verifique a aba de Estoque para mais detalhes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  Entregue
                </Badge>
                <span className="text-sm text-muted-foreground">Equipamentos em operação</span>
              </div>
              <span className="font-semibold">{metrics.pdvsEntregues}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-orange-600">
                  Pendente
                </Badge>
                <span className="text-sm text-muted-foreground">Aguardando configuração</span>
              </div>
              <span className="font-semibold">{metrics.pdvsPendentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  Devolvido
                </Badge>
                <span className="text-sm text-muted-foreground">Equipamentos retornados</span>
              </div>
              <span className="font-semibold">{metrics.pdvsDevolvidos}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

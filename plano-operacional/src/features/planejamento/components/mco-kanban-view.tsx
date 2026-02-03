import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Eye,
  Pencil,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { MCO } from '../types/mco.types'

interface MCOKanbanViewProps {
  mcos: MCO[]
  onEdit?: (mco: MCO) => void
  onView?: (mco: MCO) => void
  onViewResumo?: (mco: MCO) => void
  onDelete?: (mco: MCO) => void
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    color: 'bg-amber-500/10 border-amber-500/30',
    badgeColor: 'bg-amber-500',
    textColor: 'text-amber-700 dark:text-amber-400',
    icon: Clock,
  },
  aprovado: {
    label: 'Aprovado',
    color: 'bg-green-500/10 border-green-500/30',
    badgeColor: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2,
  },
  rejeitado: {
    label: 'Rejeitado',
    color: 'bg-red-500/10 border-red-500/30',
    badgeColor: 'bg-red-500',
    textColor: 'text-red-700 dark:text-red-400',
    icon: XCircle,
  },
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDisplayText = (text?: string) => {
  if (!text) return '-'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function MCOCard({ mco, onEdit, onView, onViewResumo, onDelete }: {
  mco: MCO
  onEdit?: (mco: MCO) => void
  onView?: (mco: MCO) => void
  onViewResumo?: (mco: MCO) => void
  onDelete?: (mco: MCO) => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-50 scale-95"
      )}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header com código e ações */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5 bg-muted/50">
            {mco.codigo}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(mco)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver MCO
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewResumo?.(mco)}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Resumo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(mco)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(mco)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Nome do evento */}
        <div>
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">
            {formatDisplayText(mco.nome_evento)}
          </h4>
        </div>

        {/* Informações principais */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{formatDisplayText(mco.cliente_nome)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {formatDisplayText(mco.cidade)}/{mco.uf}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {format(new Date(mco.data_inicial), "dd/MM/yy", { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Porte */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5",
              mco.porte === 'Grande' && "bg-purple-500/10 border-purple-500/30 text-purple-700",
              mco.porte === 'Médio' && "bg-blue-500/10 border-blue-500/30 text-blue-700",
              mco.porte === 'Pequeno' && "bg-gray-500/10 border-gray-500/30 text-gray-700"
            )}
          >
            {mco.porte || "-"}
          </Badge>
        </div>

        {/* Métricas financeiras */}
        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Custo</span>
            <span className="text-xs font-semibold">
              {formatCurrency(mco.custo_operacional_efetivo || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">COT</span>
            <span
              className={cn(
                "text-xs font-semibold",
                mco.cot > 30 ? "text-red-600" : mco.cot > 20 ? "text-amber-600" : "text-green-600"
              )}
            >
              {mco.cot > 0 ? `${mco.cot.toFixed(1)}%` : '-'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  status,
  mcos,
  onEdit,
  onView,
  onViewResumo,
  onDelete,
}: {
  status: MCO['status']
  mcos: MCO[]
  onEdit?: (mco: MCO) => void
  onView?: (mco: MCO) => void
  onViewResumo?: (mco: MCO) => void
  onDelete?: (mco: MCO) => void
}) {
  const config = statusConfig[status]
  const Icon = config.icon
  const totalCusto = mcos.reduce((sum, mco) => sum + (mco.custo_operacional_efetivo || 0), 0)

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      {/* Column Header */}
      <div className={cn("rounded-t-xl border-2 border-b-0 p-4", config.color)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", config.badgeColor, "bg-opacity-20")}>
              <Icon className={cn("h-4 w-4", config.textColor)} />
            </div>
            <h3 className={cn("font-semibold text-sm", config.textColor)}>
              {config.label}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {mcos.length}
          </Badge>
        </div>

        {mcos.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium">{formatCurrency(totalCusto)}</span>
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div
        className={cn(
          "flex-1 rounded-b-xl border-2 border-t-0 p-3 space-y-3 overflow-y-auto min-h-[400px] bg-muted/20",
          config.color
        )}
      >
        {mcos.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Nenhuma MCO
          </div>
        ) : (
          mcos.map((mco) => (
            <MCOCard
              key={mco.id}
              mco={mco}
              onEdit={onEdit}
              onView={onView}
              onViewResumo={onViewResumo}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function MCOKanbanView({ mcos, onEdit, onView, onViewResumo, onDelete }: MCOKanbanViewProps) {
  const mcosGroupedByStatus = {
    pendente: mcos.filter((mco) => mco.status === 'pendente'),
    aprovado: mcos.filter((mco) => mco.status === 'aprovado'),
    rejeitado: mcos.filter((mco) => mco.status === 'rejeitado'),
  }

  const totalCusto = mcos.reduce((sum, mco) => sum + (mco.custo_operacional_efetivo || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-muted-foreground">Total de MCOs</span>
              <p className="text-2xl font-bold">{mcos.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-xs text-muted-foreground">Custo Total</span>
              <p className="text-2xl font-bold">{formatCurrency(totalCusto)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">
                {mcosGroupedByStatus.pendente.length} Pendente{mcosGroupedByStatus.pendente.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">
                {mcosGroupedByStatus.aprovado.length} Aprovado{mcosGroupedByStatus.aprovado.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">
                {mcosGroupedByStatus.rejeitado.length} Rejeitado{mcosGroupedByStatus.rejeitado.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          <KanbanColumn
            status="pendente"
            mcos={mcosGroupedByStatus.pendente}
            onEdit={onEdit}
            onView={onView}
            onViewResumo={onViewResumo}
            onDelete={onDelete}
          />
          <KanbanColumn
            status="aprovado"
            mcos={mcosGroupedByStatus.aprovado}
            onEdit={onEdit}
            onView={onView}
            onViewResumo={onViewResumo}
            onDelete={onDelete}
          />
          <KanbanColumn
            status="rejeitado"
            mcos={mcosGroupedByStatus.rejeitado}
            onEdit={onEdit}
            onView={onView}
            onViewResumo={onViewResumo}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

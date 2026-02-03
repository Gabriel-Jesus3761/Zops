import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Pencil,
  FileText,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
  BedDouble,
  Car,
  Plane,
  Coffee,
  Truck,
  Building2,
  Target,
  Clock
} from 'lucide-react'
import { mcoService } from '@/features/planejamento/services/mco.service'
import type { MCO } from '@/features/planejamento/types/mco.types'
import { cn } from '@/lib/utils'

export default function MCODetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: mco, isLoading, error } = useQuery({
    queryKey: ['mco-detalhes', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido')
      return await mcoService.buscarMCO(id)
    },
    enabled: !!id,
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDisplayText = (text?: string) => {
    if (!text) return '-'
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const getStatusConfig = (status: MCO['status']) => {
    switch (status) {
      case 'aprovado':
        return {
          label: 'Aprovado',
          color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        }
      case 'rejeitado':
        return {
          label: 'Rejeitado',
          color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        }
      default:
        return {
          label: 'Pendente',
          color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        }
    }
  }

  const getTipoAtendimentoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'atendimento_matriz':
        return 'Atendimento Matriz'
      case 'filial':
        return 'Filial'
      case 'filial_interior':
        return 'Filial Interior'
      default:
        return 'Atendimento Matriz'
    }
  }

  const getTipoAtendimentoColor = (tipo?: string) => {
    switch (tipo) {
      case 'atendimento_matriz':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'filial':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'filial_interior':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (error || !mco) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar MCO</p>
          <Button onClick={() => navigate('/planejamento/mcos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(mco.status)
  const duracao = mco.data_inicial && mco.data_final
    ? differenceInDays(new Date(mco.data_final), new Date(mco.data_inicial)) + 1
    : 0

  // Estimativa de custos por categoria (50% mão de obra, etc.)
  const custoTotal = mco.custo_operacional_efetivo || 0
  const custoPorCategoria = {
    maoDeObra: custoTotal * 0.50,
    alimentacao: custoTotal * 0.15,
    hospedagem: custoTotal * 0.15,
    viagem: custoTotal * 0.08,
    transporte: custoTotal * 0.07,
    dayOff: custoTotal * 0.03,
    frete: custoTotal * 0.02,
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/planejamento/mcos')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes da MCO</h1>
            <p className="text-sm text-muted-foreground">Código: {mco.codigo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/planejamento/mcos/${id}/resumo`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Resumo
          </Button>
          {mco.status !== 'aprovado' && (
            <Button
              size="sm"
              onClick={() => navigate(`/planejamento/mcos/${id}/editar`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Banner de status e informações principais */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="p-6 text-white" style={{ background: 'linear-gradient(to right, #3C83F6, #3C83F6, rgba(60, 131, 246, 0.9))' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={cn('border-2', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                {mco.tipo_atendimento && (
                  <Badge variant="secondary" className={cn('border-2', getTipoAtendimentoColor(mco.tipo_atendimento))}>
                    {getTipoAtendimentoLabel(mco.tipo_atendimento)}
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">{formatDisplayText(mco.nome_evento)}</h2>
              <p className="text-lg opacity-90">{mco.cliente_nome || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                <DollarSign className="h-4 w-4" />
                Custo Operacional
              </div>
              <div className="text-2xl font-bold">{formatCurrency(custoTotal)}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                <TrendingUp className="h-4 w-4" />
                COT
              </div>
              <div className="text-2xl font-bold">{mco.cot > 0 ? `${mco.cot.toFixed(1)}%` : '-'}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                <DollarSign className="h-4 w-4" />
                Faturamento
              </div>
              <div className="text-2xl font-bold">
                {mco.faturamento_estimado ? formatCurrency(parseFloat(mco.faturamento_estimado)) : '-'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Informações do Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase">
              <Calendar className="h-4 w-4" />
              Informações do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nome do Evento</p>
              <p className="font-medium">{formatDisplayText(mco.nome_evento)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Período</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {mco.data_inicial && format(new Date(mco.data_inicial), 'dd/MM/yyyy', { locale: ptBR })}
                  {' - '}
                  {mco.data_final && format(new Date(mco.data_final), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Duração: {duracao} dia{duracao !== 1 ? 's' : ''}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Localização</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDisplayText(mco.cidade)} - {mco.uf}</span>
              </div>
            </div>

            {mco.num_sessoes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sessões</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{mco.num_sessoes} sessão{mco.num_sessoes !== 1 ? 'ões' : ''}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Cliente e Equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase">
              <Users className="h-4 w-4" />
              Cliente e Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mco.cliente_nome || '-'}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Responsável</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mco.responsavel_nome || '-'}</span>
              </div>
            </div>

            {mco.publico_estimado && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Público Estimado</p>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{parseInt(mco.publico_estimado).toLocaleString('pt-BR')} pessoas</span>
                </div>
              </div>
            )}

            {mco.porte && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Porte do Evento</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-medium',
                    mco.porte === 'Grande' && 'bg-purple-50 border-purple-300 text-purple-700',
                    mco.porte === 'Médio' && 'bg-blue-50 border-blue-300 text-blue-700',
                    mco.porte === 'Pequeno' && 'bg-gray-50 border-gray-300 text-gray-700'
                  )}
                >
                  {mco.porte}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Custos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase">
            <DollarSign className="h-4 w-4" />
            Detalhamento de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: Users, label: 'Mão de Obra', value: custoPorCategoria.maoDeObra, color: 'text-blue-600' },
              { icon: UtensilsCrossed, label: 'Alimentação', value: custoPorCategoria.alimentacao, color: 'text-orange-600' },
              { icon: BedDouble, label: 'Hospedagem', value: custoPorCategoria.hospedagem, color: 'text-purple-600' },
              { icon: Plane, label: 'Viagem', value: custoPorCategoria.viagem, color: 'text-sky-600' },
              { icon: Car, label: 'Transporte', value: custoPorCategoria.transporte, color: 'text-green-600' },
              { icon: Coffee, label: 'Day Off', value: custoPorCategoria.dayOff, color: 'text-amber-600' },
              { icon: Truck, label: 'Frete', value: custoPorCategoria.frete, color: 'text-gray-600' },
            ].map((item) => {
              const Icon = item.icon
              const percentual = ((item.value / custoTotal) * 100).toFixed(1)

              return (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', item.color)} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{percentual}%</span>
                    <span className="font-semibold min-w-[120px] text-right">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20 mt-4">
              <span className="font-bold">TOTAL</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(custoTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase">
            Metadados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Código do MCO</p>
              <p className="font-mono font-semibold text-sm">{mco.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge className={cn('border', statusConfig.color)}>{statusConfig.label}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">ID no Sistema</p>
              <p className="font-mono text-xs text-muted-foreground">{mco.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
              <p className="text-sm">
                {mco.updated_at && format(new Date(mco.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

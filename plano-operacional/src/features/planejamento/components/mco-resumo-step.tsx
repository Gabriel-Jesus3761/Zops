import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Settings2,
  Truck,
  CheckCircle2,
  XCircle,
  Building2,
  Utensils,
  BedDouble
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MCOEventoData, MCOOperacionalData } from '../types/mco.types'

interface MCOResumoStepProps {
  eventoData: MCOEventoData
  operacionalData: MCOOperacionalData
}

// Modalidades mock (mesmo do operacional step)
const modalidades = [
  { id: '1', nome: 'Self-Service' },
  { id: '2', nome: 'Atendimento Assistido' },
  { id: '3', nome: 'Híbrido' },
  { id: '4', nome: 'Cashless' },
]

const getDiaSemanaAbreviado = (date: Date): string => {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  return dias[date.getDay()]
}

export function MCOResumoStep({ eventoData, operacionalData }: MCOResumoStepProps) {
  const modalidade = modalidades.find(m => m.id === operacionalData.modalidadeId)

  const calcularTicketMedio = (): string => {
    const faturamentoStr = eventoData.faturamentoEstimado
      ?.replace(/[^\d.,]/g, '')
      ?.replace(/\./g, '')
      ?.replace(',', '.')
      || '0'
    const faturamento = parseFloat(faturamentoStr)

    const publicoStr = eventoData.publicoEstimado?.replace(/\./g, '') || '0'
    const publicoPorDia = parseInt(publicoStr)

    const qtdSessoes = eventoData.sessoes?.length || 1

    if (publicoPorDia === 0 || isNaN(faturamento) || qtdSessoes === 0) return "R$ 0,00"

    const faturamentoPorSessao = faturamento / qtdSessoes
    const ticketMedio = faturamentoPorSessao / publicoPorDia

    return ticketMedio.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatSessaoCompleto = (sessao: { dataHoraInicio: Date | null; dataHoraFim: Date | null }) => {
    if (!sessao.dataHoraInicio || !sessao.dataHoraFim) return "-"
    const diaSemana = getDiaSemanaAbreviado(sessao.dataHoraInicio)
    const dataInicio = format(sessao.dataHoraInicio, "dd/MM/yy")
    const horaInicio = format(sessao.dataHoraInicio, "HH:mm")
    const dataFim = format(sessao.dataHoraFim, "dd/MM/yy")
    const horaFim = format(sessao.dataHoraFim, "HH:mm")

    if (dataInicio === dataFim) {
      return `${diaSemana} | ${dataInicio}: ${horaInicio} - ${horaFim}`
    }
    return `${diaSemana} | ${dataInicio} ${horaInicio} → ${dataFim} ${horaFim}`
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Confirme os dados</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Revise as informações antes de criar a MCO
        </p>
      </div>

      {/* Dados do Evento */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Evento</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nome do Evento</p>
            <p className="text-lg font-semibold text-foreground">
              {eventoData.nomeEvento || "Nome do Evento"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {eventoData.clienteNome || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {eventoData.localEventoNome || "-"}
                {eventoData.cidade && eventoData.uf && (
                  <span className="text-muted-foreground"> • {eventoData.cidade}/{eventoData.uf}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Faturamento */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Faturamento</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Faturamento Estimado</p>
            <p className="text-2xl font-bold text-foreground">
              {eventoData.faturamentoEstimado || "R$ 0,00"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-muted/50">
              <Users className="h-3 w-3 mr-1" />
              {eventoData.publicoEstimado || "0"} público/dia
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Ticket: {calcularTicketMedio()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Sessões */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">
            Sessões Go Live
          </h3>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {eventoData.sessoes.length} {eventoData.sessoes.length === 1 ? 'sessão' : 'sessões'} configurada(s)
          </p>

          {eventoData.sessoes.length > 0 && (
            <div className="space-y-2">
              {eventoData.sessoes.slice(0, 3).map((sessao, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                >
                  <span className="text-xs font-bold text-primary">S{index + 1}</span>
                  <span className="text-sm text-foreground">{formatSessaoCompleto(sessao)}</span>
                </div>
              ))}
              {eventoData.sessoes.length > 3 && (
                <p className="text-xs text-muted-foreground px-2">
                  + {eventoData.sessoes.length - 3} sessão(ões) adicional(is)
                </p>
              )}
            </div>
          )}

          {eventoData.sessoes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma sessão configurada</p>
          )}
        </div>
      </div>

      {/* Modelo Operacional */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Modelo Operacional</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Modalidade</p>
            <p className="text-lg font-semibold text-foreground">
              {modalidade?.nome || "Não selecionado"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                operacionalData.timeTecnico
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {operacionalData.timeTecnico ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <Users className="h-3 w-3" />
              Time Técnico
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                operacionalData.logistica
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {operacionalData.logistica ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <Truck className="h-3 w-3" />
              Logística
            </Badge>
          </div>
        </div>
      </div>

      {/* Descontos (Condicional) */}
      {operacionalData.timeTecnico && (operacionalData.clienteForneceAlimentacaoGoLive || operacionalData.clienteForneceHospedagemAlpha) && (
        <div className="bg-card rounded-lg border-2 border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-base text-foreground">Descontos Aplicados</h3>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cliente fornece os seguintes benefícios:
            </p>

            <div className="flex flex-wrap gap-2">
              {operacionalData.clienteForneceAlimentacaoGoLive && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-800 gap-1">
                  <Utensils className="h-3 w-3" />
                  Alimentação Go Live
                </Badge>
              )}
              {operacionalData.clienteForneceHospedagemAlpha && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-800 gap-1">
                  <BedDouble className="h-3 w-3" />
                  Hospedagem Alpha
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

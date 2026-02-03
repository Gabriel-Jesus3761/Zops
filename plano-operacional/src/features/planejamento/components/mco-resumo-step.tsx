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
    <div className="space-y-4">
      {/* Header simplificado */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Confirme os dados</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Revise as informações antes de criar a MCO
        </p>
      </div>

      {/* Cards em coluna única */}
      <div className="flex flex-col gap-4">

        {/* Card 1: Dados do Evento */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-chart-1/10">
              <Calendar className="h-5 w-5 text-chart-1" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Evento
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5 truncate">
                {eventoData.nomeEvento || "Nome do Evento"}
              </h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{eventoData.clienteNome || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {eventoData.localEventoNome || "-"}
                    {eventoData.cidade && eventoData.uf && ` • ${eventoData.cidade}/${eventoData.uf}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Faturamento Previsto */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-chart-3/10">
              <DollarSign className="h-5 w-5 text-chart-3" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Faturamento Previsto
              </span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {eventoData.faturamentoEstimado || "R$ 0,00"}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-3">
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
        </div>

        {/* Card 3: Sessões */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-chart-2/10">
              <Clock className="h-5 w-5 text-chart-2" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sessões Go Live
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {eventoData.sessoes.length} {eventoData.sessoes.length === 1 ? 'sessão' : 'sessões'}
              </h3>
              <div className="mt-3 space-y-2">
                {eventoData.sessoes.slice(0, 3).map((sessao, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5"
                  >
                    <span className="font-semibold text-foreground">S{index + 1}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{formatSessaoCompleto(sessao)}</span>
                  </div>
                ))}
                {eventoData.sessoes.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {eventoData.sessoes.length - 3} sessão(ões) adicional(is)
                  </p>
                )}
                {eventoData.sessoes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma sessão configurada</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Modelo Operacional */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-chart-4/10">
              <Settings2 className="h-5 w-5 text-chart-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Modelo Operacional
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {modalidade?.nome || "Não selecionado"}
              </h3>
              <div className="flex flex-wrap gap-2 mt-3">
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
                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
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
        </div>

        {/* Card 5: Benefícios do Cliente (Condicional) */}
        {operacionalData.timeTecnico && (operacionalData.clienteForneceAlimentacaoGoLive || operacionalData.clienteForneceHospedagemAlpha) && (
          <div className="rounded-2xl bg-green-500/5 border border-green-500/20 shadow-sm p-5 transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Descontos Aplicados
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliente fornece os seguintes benefícios:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {operacionalData.clienteForneceAlimentacaoGoLive && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                      <Utensils className="h-3 w-3" />
                      Alimentação Go Live
                    </Badge>
                  )}
                  {operacionalData.clienteForneceHospedagemAlpha && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                      <BedDouble className="h-3 w-3" />
                      Hospedagem Alpha
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

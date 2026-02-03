import { useState, useEffect, useMemo } from 'react'
import {
  AlertCircle,
  X,
  Clock,
  Info,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { format, parse, addDays } from 'date-fns'
import type { MCOEventoData, Sessao } from '../types/mco.types'

interface MCOEventoStepProps {
  data: MCOEventoData
  onChange: (data: MCOEventoData) => void
  onValidationChange?: (isValid: boolean) => void
}

// Ilustrações com ícones Lucide
const IllustracaoCliente = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
        <Building2 className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-chart-4 flex items-center justify-center">
        <Users className="w-3 h-3 text-chart-4-foreground" />
      </div>
    </div>
  </div>
)

const IllustracaoEvento = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-1/20 flex items-center justify-center">
        <Calendar className="w-8 h-8 text-chart-1" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-chart-4 flex items-center justify-center">
        <span className="text-[10px] font-bold text-chart-4-foreground">GO</span>
      </div>
    </div>
  </div>
)

const IllustracaoSessoes = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-2/20 flex items-center justify-center">
        <Clock className="w-8 h-8 text-chart-2" />
      </div>
    </div>
  </div>
)

const IllustracaoFaturamento = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-3/20 flex items-center justify-center">
        <DollarSign className="w-8 h-8 text-chart-3" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-chart-3 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">R$</span>
      </div>
    </div>
  </div>
)

const IllustracaoLocal = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-5/20 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-chart-5" />
      </div>
    </div>
  </div>
)

// Helper functions
const formatCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  const amount = Number(numbers) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

const formatNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  return new Intl.NumberFormat('pt-BR').format(Number(numbers))
}

const applyDateMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
}

const parseDate = (dateText: string): Date | null => {
  if (dateText.length !== 10) return null
  const parsed = parse(dateText, "dd/MM/yyyy", new Date())
  return isNaN(parsed.getTime()) ? null : parsed
}

const applyShortDateMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 6)}`
}

const applyHoraMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`
}

const parseShortDate = (dateText: string): Date | null => {
  if (dateText.length !== 8) return null
  const [dia, mes, ano] = dateText.split('/')
  const fullYear = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`
  const parsed = new Date(parseInt(fullYear), parseInt(mes) - 1, parseInt(dia))
  return isNaN(parsed.getTime()) ? null : parsed
}

const getDiaSemanaAbreviado = (date: Date): string => {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  return dias[date.getDay()]
}

// Validação de sessão
interface SessaoValidacao {
  valida: boolean
  erro?: string
}

const validarSessao = (sessao: Sessao): SessaoValidacao => {
  if (!sessao.dataHoraInicio || !sessao.dataHoraFim) {
    return { valida: true }
  }

  if (sessao.dataHoraFim <= sessao.dataHoraInicio) {
    return {
      valida: false,
      erro: "Data/hora fim deve ser posterior à data/hora início"
    }
  }

  return { valida: true }
}

export function MCOEventoStep({ data, onChange, onValidationChange }: MCOEventoStepProps) {
  const [dataInicialText, setDataInicialText] = useState(data.dataInicial ? format(data.dataInicial, "dd/MM/yyyy") : "")
  const [dataFinalText, setDataFinalText] = useState(data.dataFinal ? format(data.dataFinal, "dd/MM/yyyy") : "")
  const [sessaoTexts, setSessaoTexts] = useState<{ dataInicio: string; horaInicio: string; dataFim: string; horaFim: string }[]>([])

  // Estado para horário padrão
  const [horarioPadraoInicio, setHorarioPadraoInicio] = useState("")
  const [horarioPadraoFim, setHorarioPadraoFim] = useState("")
  const [encerraDiaSeguinte, setEncerraDiaSeguinte] = useState(false)

  const sessoesValidacao = useMemo(() => data.sessoes.map(validarSessao), [data.sessoes])
  const todasSessoesValidas = useMemo(() => sessoesValidacao.every(v => v.valida), [sessoesValidacao])

  // Cálculo do Ticket Médio em tempo real
  const ticketMedio = useMemo(() => {
    const faturamentoStr = data.faturamentoEstimado
      ?.replace(/[^\d.,]/g, '')
      ?.replace(/\./g, '')
      ?.replace(',', '.')
      || '0'
    const faturamento = parseFloat(faturamentoStr)

    const publicoStr = data.publicoEstimado?.replace(/\./g, '') || '0'
    const publicoPorDia = parseInt(publicoStr)

    const qtdSessoes = data.sessoes?.length || 1

    if (publicoPorDia === 0 || isNaN(faturamento) || faturamento === 0 || qtdSessoes === 0) {
      return null
    }

    const faturamentoPorSessao = faturamento / qtdSessoes
    const ticket = faturamentoPorSessao / publicoPorDia

    return ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }, [data.faturamentoEstimado, data.publicoEstimado, data.sessoes?.length])

  useEffect(() => {
    onValidationChange?.(todasSessoesValidas)
  }, [todasSessoesValidas, onValidationChange])

  // Sincronizar dataInicialText quando data.dataInicial muda
  useEffect(() => {
    if (data.dataInicial) {
      setDataInicialText(format(data.dataInicial, "dd/MM/yyyy"))
    }
  }, [data.dataInicial])

  // Sincronizar dataFinalText quando data.dataFinal muda
  useEffect(() => {
    if (data.dataFinal) {
      setDataFinalText(format(data.dataFinal, "dd/MM/yyyy"))
    }
  }, [data.dataFinal])

  // Sincronizar sessaoTexts quando sessões mudam
  useEffect(() => {
    if (data.sessoes.length > 0) {
      setSessaoTexts(data.sessoes.map(s => ({
        dataInicio: s.dataHoraInicio ? format(s.dataHoraInicio, "dd/MM/yy") : "",
        horaInicio: s.dataHoraInicio ? format(s.dataHoraInicio, "HH:mm") : "",
        dataFim: s.dataHoraFim ? format(s.dataHoraFim, "dd/MM/yy") : "",
        horaFim: s.dataHoraFim ? format(s.dataHoraFim, "HH:mm") : "",
      })))
    }
  }, [data.sessoes])

  // Criar sessões automaticamente quando datas são definidas
  useEffect(() => {
    if (data.dataInicial && data.dataFinal) {
      const diffTime = data.dataFinal.getTime() - data.dataInicial.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      if (diffDays >= 1 && data.sessoes.length === 0) {
        const novasSessoes: Sessao[] = []
        const horaInicioPadrao = 8
        const horaFimPadrao = 18

        for (let i = 0; i < diffDays; i++) {
          const dataBase = new Date(data.dataInicial)
          dataBase.setDate(dataBase.getDate() + i)
          novasSessoes.push({
            dataHoraInicio: new Date(dataBase.setHours(horaInicioPadrao, 0, 0, 0)),
            dataHoraFim: new Date(dataBase.setHours(horaFimPadrao, 0, 0, 0)),
          })
        }
        onChange({ ...data, sessoes: novasSessoes })
      }
    }
  }, [data.dataInicial, data.dataFinal])

  const handleDataInicialChange = (value: string) => {
    const masked = applyDateMask(value)
    setDataInicialText(masked)
    const parsed = parseDate(masked)
    onChange({ ...data, dataInicial: parsed, sessoes: [] })
  }

  const handleDataFinalChange = (value: string) => {
    const masked = applyDateMask(value)
    setDataFinalText(masked)
    const parsed = parseDate(masked)
    onChange({ ...data, dataFinal: parsed, sessoes: [] })
  }

  const handleFaturamentoChange = (value: string) => {
    onChange({ ...data, faturamentoEstimado: formatCurrency(value) })
  }

  const handlePublicoChange = (value: string) => {
    onChange({ ...data, publicoEstimado: formatNumber(value) })
  }

  const handleSessaoDataInicioChange = (index: number, value: string) => {
    const masked = applyShortDateMask(value)
    const newTexts = [...sessaoTexts]
    newTexts[index] = { ...newTexts[index], dataInicio: masked }
    setSessaoTexts(newTexts)

    if (masked.length === 8) {
      const parsedData = parseShortDate(masked)
      if (parsedData) {
        const novasSessoes = [...data.sessoes]
        const horaAtual = novasSessoes[index].dataHoraInicio
        const hora = horaAtual ? horaAtual.getHours() : 8
        const min = horaAtual ? horaAtual.getMinutes() : 0
        novasSessoes[index] = {
          ...novasSessoes[index],
          dataHoraInicio: new Date(parsedData.getFullYear(), parsedData.getMonth(), parsedData.getDate(), hora, min),
        }
        onChange({ ...data, sessoes: novasSessoes })
      }
    }
  }

  const handleSessaoHoraInicioChange = (index: number, value: string) => {
    const masked = applyHoraMask(value)
    const newTexts = [...sessaoTexts]
    newTexts[index] = { ...newTexts[index], horaInicio: masked }
    setSessaoTexts(newTexts)

    if (masked.length === 5) {
      const [hora, min] = masked.split(':').map(Number)
      const novasSessoes = [...data.sessoes]
      const dataBase = novasSessoes[index].dataHoraInicio || new Date()
      novasSessoes[index] = {
        ...novasSessoes[index],
        dataHoraInicio: new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), hora, min),
      }
      onChange({ ...data, sessoes: novasSessoes })
    }
  }

  const handleSessaoDataFimChange = (index: number, value: string) => {
    const masked = applyShortDateMask(value)
    const newTexts = [...sessaoTexts]
    newTexts[index] = { ...newTexts[index], dataFim: masked }
    setSessaoTexts(newTexts)

    if (masked.length === 8) {
      const parsedData = parseShortDate(masked)
      if (parsedData) {
        const novasSessoes = [...data.sessoes]
        const horaAtual = novasSessoes[index].dataHoraFim
        const hora = horaAtual ? horaAtual.getHours() : 18
        const min = horaAtual ? horaAtual.getMinutes() : 0
        novasSessoes[index] = {
          ...novasSessoes[index],
          dataHoraFim: new Date(parsedData.getFullYear(), parsedData.getMonth(), parsedData.getDate(), hora, min),
        }
        onChange({ ...data, sessoes: novasSessoes })
      }
    }
  }

  const handleSessaoHoraFimChange = (index: number, value: string) => {
    const masked = applyHoraMask(value)
    const newTexts = [...sessaoTexts]
    newTexts[index] = { ...newTexts[index], horaFim: masked }
    setSessaoTexts(newTexts)

    if (masked.length === 5) {
      const [hora, min] = masked.split(':').map(Number)
      const novasSessoes = [...data.sessoes]
      const dataBase = novasSessoes[index].dataHoraFim || new Date()

      novasSessoes[index] = {
        ...novasSessoes[index],
        dataHoraFim: new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), hora, min),
      }
      onChange({ ...data, sessoes: novasSessoes })
    }
  }

  const handleHorarioPadraoInicioChange = (value: string) => {
    setHorarioPadraoInicio(applyHoraMask(value))
  }

  const handleHorarioPadraoFimChange = (value: string) => {
    setHorarioPadraoFim(applyHoraMask(value))
  }

  const handleAplicarHorariosPadrao = () => {
    if (horarioPadraoInicio.length !== 5 || horarioPadraoFim.length !== 5) {
      toast.error('Informe os horários padrão no formato HH:mm')
      return
    }

    const [horaInicio, minInicio] = horarioPadraoInicio.split(':').map(Number)
    const [horaFim, minFim] = horarioPadraoFim.split(':').map(Number)

    const novasSessoes = data.sessoes.map(sessao => {
      const dataBase = sessao.dataHoraInicio || new Date()
      const dataInicio = new Date(
        dataBase.getFullYear(),
        dataBase.getMonth(),
        dataBase.getDate(),
        horaInicio,
        minInicio
      )

      let dataFim = new Date(
        dataBase.getFullYear(),
        dataBase.getMonth(),
        dataBase.getDate(),
        horaFim,
        minFim
      )

      // Se encerra no dia seguinte, adicionar 1 dia
      if (encerraDiaSeguinte) {
        dataFim = addDays(dataFim, 1)
      }

      return {
        ...sessao,
        dataHoraInicio: dataInicio,
        dataHoraFim: dataFim,
      }
    })

    onChange({ ...data, sessoes: novasSessoes })
    toast.success(`Horários aplicados em ${novasSessoes.length} sessões`)
  }

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Card 1 - Cliente */}
      <div className="relative rounded-2xl bg-card border border-border shadow-sm p-6 min-h-[140px]">
        <div className="relative z-10 pr-28 sm:pr-36">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cliente
            </span>
            <span className="text-destructive text-xs font-bold">*</span>
          </div>
          <Input
            placeholder="Nome do cliente"
            value={data.clienteNome || ''}
            onChange={(e) => onChange({ ...data, clienteNome: e.target.value, cliente: e.target.value })}
            className="text-base"
          />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80">
          <IllustracaoCliente />
        </div>
      </div>

      {/* Card 2 - Evento + Período */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-6 min-h-[140px]">
        <div className="relative z-10 pr-28 sm:pr-36">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Evento & Período
          </span>
          <h3 className="text-xl font-bold text-foreground mt-1 mb-3">
            {data.nomeEvento || "Nome do evento"}
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Ex: Festival de Música 2025"
              value={data.nomeEvento}
              onChange={(e) => onChange({ ...data, nomeEvento: e.target.value })}
              className="text-base"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Início Go Live
                </Label>
                <Input
                  placeholder="dd/mm/aaaa"
                  value={dataInicialText}
                  onChange={(e) => handleDataInicialChange(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Fim Go Live
                </Label>
                <Input
                  placeholder="dd/mm/aaaa"
                  value={dataFinalText}
                  onChange={(e) => handleDataFinalChange(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80">
          <IllustracaoEvento />
        </div>
      </div>

      {/* Card 2.5 - Horário Padrão */}
      {data.sessoes.length > 1 && (
        <div className="rounded-xl bg-muted/30 border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Horário Padrão do Evento</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs text-muted-foreground">Abertura</Label>
              <Input
                placeholder="20:00"
                value={horarioPadraoInicio}
                onChange={(e) => handleHorarioPadraoInicioChange(e.target.value)}
                maxLength={5}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Encerramento</Label>
              <Input
                placeholder="05:00"
                value={horarioPadraoFim}
                onChange={(e) => handleHorarioPadraoFimChange(e.target.value)}
                maxLength={5}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id="diaSeguinte"
              checked={encerraDiaSeguinte}
              onCheckedChange={(checked) => setEncerraDiaSeguinte(checked === true)}
            />
            <Label htmlFor="diaSeguinte" className="text-xs cursor-pointer">
              Evento encerra no dia seguinte (madrugada)
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAplicarHorariosPadrao}
            className="w-full"
          >
            Aplicar a Todas as Sessões
          </Button>
        </div>
      )}

      {/* Card 3 - Sessões */}
      {data.sessoes.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-6">
          <div className="relative z-10 pr-20 sm:pr-24">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sessões Go Live
            </span>
            <h3 className="text-xl font-bold text-foreground mt-1 mb-1">
              {data.sessoes.length} {data.sessoes.length === 1 ? 'sessão' : 'sessões'} Go Live
            </h3>
            {data.dataInicial && data.dataFinal && (() => {
              const diffTime = data.dataFinal.getTime() - data.dataInicial.getTime()
              const totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
              const diasDayOff = totalDias - data.sessoes.length
              if (diasDayOff > 0) {
                return (
                  <p className="text-xs text-muted-foreground mb-3">
                    {diasDayOff} {diasDayOff === 1 ? 'dia será' : 'dias serão'} Day Off
                  </p>
                )
              }
              return <div className="mb-3" />
            })()}
            <div className="space-y-2">
              {data.sessoes.map((sessao, index) => {
                const validacao = sessoesValidacao[index]
                const temErro = !validacao?.valida

                return (
                  <div key={index} className="space-y-1">
                    <div
                      className={`flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border flex-wrap sm:flex-nowrap ${
                        temErro ? 'border-destructive' : 'border-border'
                      }`}
                    >
                      <span className="text-xs shrink-0 font-medium flex items-center gap-1">
                        {sessao.dataHoraInicio && (
                          <span className="text-primary font-semibold">{getDiaSemanaAbreviado(sessao.dataHoraInicio)}</span>
                        )}
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">S{index + 1}:</span>
                      </span>
                      <Input
                        placeholder="dd/mm/aa"
                        value={sessaoTexts[index]?.dataInicio || ""}
                        onChange={(e) => handleSessaoDataInicioChange(index, e.target.value)}
                        className="w-[76px] text-xs h-7 px-1.5"
                        maxLength={8}
                      />
                      <Input
                        placeholder="08:00"
                        value={sessaoTexts[index]?.horaInicio || ""}
                        onChange={(e) => handleSessaoHoraInicioChange(index, e.target.value)}
                        className="w-[46px] text-xs text-center h-7 px-1"
                        maxLength={5}
                      />
                      <span className="text-muted-foreground text-xs">a</span>
                      <Input
                        placeholder="dd/mm/aa"
                        value={sessaoTexts[index]?.dataFim || ""}
                        onChange={(e) => handleSessaoDataFimChange(index, e.target.value)}
                        className={`w-[76px] text-xs h-7 px-1.5 ${temErro ? 'border-destructive' : ''}`}
                        maxLength={8}
                      />
                      <Input
                        placeholder="18:00"
                        value={sessaoTexts[index]?.horaFim || ""}
                        onChange={(e) => handleSessaoHoraFimChange(index, e.target.value)}
                        className={`w-[46px] text-xs text-center h-7 px-1 ${temErro ? 'border-destructive' : ''}`}
                        maxLength={5}
                      />
                      {temErro && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const novasSessoes = data.sessoes.filter((_, i) => i !== index)
                          const novosTexts = sessaoTexts.filter((_, i) => i !== index)
                          setSessaoTexts(novosTexts)
                          onChange({ ...data, sessoes: novasSessoes })
                        }}
                        disabled={data.sessoes.length <= 1}
                        title={data.sessoes.length <= 1 ? "Mínimo 1 sessão" : "Remover sessão (dia vira Day Off)"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {temErro && (
                      <p className="text-xs text-destructive flex items-center gap-1 ml-1">
                        <AlertCircle className="h-3 w-3" />
                        {validacao.erro}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="absolute right-2 top-6 w-16 h-16 sm:w-20 sm:h-20 opacity-80">
            <IllustracaoSessoes />
          </div>
        </div>
      )}

      {/* Card 4 - Financeiro */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-6 min-h-[140px]">
        <div className="relative z-10 pr-28 sm:pr-36">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Faturamento Previsto
            </span>
            <span className="text-destructive text-xs font-bold">*</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">Afeta: <span className="font-semibold">Mão de Obra, Cluster, Aprovações</span></p>
                <p className="text-xs text-muted-foreground mt-1">Define porte do evento e quantidade de equipe técnica</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {data.faturamentoEstimado || "R$ 0,00"}
          </h3>
          {ticketMedio ? (
            <p className="text-sm text-muted-foreground mb-3">
              Ticket médio: <span className="font-semibold text-primary">{ticketMedio}</span>
            </p>
          ) : (
            <div className="mb-3" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Faturamento
              </Label>
              <Input
                placeholder="R$ 0,00"
                value={data.faturamentoEstimado}
                onChange={(e) => handleFaturamentoChange(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Público por dia
              </Label>
              <Input
                placeholder="0"
                value={data.publicoEstimado}
                onChange={(e) => handlePublicoChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80">
          <IllustracaoFaturamento />
        </div>
      </div>

      {/* Card 5 - Local */}
      <div className="relative rounded-2xl bg-card border border-border shadow-sm p-6 min-h-[140px]">
        <div className="relative z-10 pr-28 sm:pr-36">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Local do Evento
            </span>
            <span className="text-destructive text-xs font-bold">*</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">Afeta: <span className="font-semibold">Viagem, Transporte, Frete, Hospedagem</span></p>
                <p className="text-xs text-muted-foreground mt-1">Define tipo de atendimento e cálculo de distâncias</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Nome do local (Ex: Allianz Parque)"
              value={data.localEventoNome || ''}
              onChange={(e) => onChange({ ...data, localEventoNome: e.target.value, localEvento: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Cidade"
                value={data.cidade}
                onChange={(e) => onChange({ ...data, cidade: e.target.value })}
              />
              <Input
                placeholder="UF"
                value={data.uf}
                onChange={(e) => onChange({ ...data, uf: e.target.value.toUpperCase() })}
                maxLength={2}
              />
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80">
          <IllustracaoLocal />
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}

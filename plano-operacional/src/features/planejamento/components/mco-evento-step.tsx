import { useState, useEffect, useMemo, useRef } from 'react'
import {
  AlertCircle,
  X,
  Clock,
  Building2,
  CalendarDays,
  DollarSign,
  MapPin,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Loader2,
  HelpCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { format, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { MCOEventoData, Sessao } from '../types/mco.types'
import { clientsService } from '@/features/settings/services/clients.service'
import { searchNominatim, enrichLocalFromOverpass, extractUF } from '../services/geocoding.service'
import type { NominatimResult } from '../services/geocoding.service'

interface MCOEventoStepProps {
  data: MCOEventoData
  onChange: (data: MCOEventoData) => void
  onValidationChange?: (isValid: boolean) => void
}

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

const applyHoraMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`
}

const getDiaSemanaAbreviado = (date: Date): string => {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  return dias[date.getDay()]
}

const sortDates = (dates: Date[]): Date[] =>
  [...dates].sort((a, b) => a.getTime() - b.getTime())

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

export function MCOEventoStep({ data: rawData, onChange, onValidationChange }: MCOEventoStepProps) {
  // Garantir que datasEvento é sempre um array (proteção contra dados legados)
  const data = useMemo(() => ({
    ...rawData,
    datasEvento: rawData.datasEvento || [],
  }), [rawData])

  const [sessaoTexts, setSessaoTexts] = useState<{ horaInicio: string; horaFim: string }[]>([])
  const [openCalendarPopover, setOpenCalendarPopover] = useState(false)

  // Estado para horário padrão por mês: { "2026-02": { inicio: "20:00", fim: "05:00" } }
  const [horariosPorMes, setHorariosPorMes] = useState<Record<string, { inicio: string; fim: string }>>({})

  // Estados para busca de local
  const [openLocalPopover, setOpenLocalPopover] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [locaisEncontrados, setLocaisEncontrados] = useState<NominatimResult[]>([])
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [enrichingLocal, setEnrichingLocal] = useState(false)

  // Estado para Modal de clientes
  const [openClienteModal, setOpenClienteModal] = useState(false)
  const [clienteSearchTerm, setClienteSearchTerm] = useState("")

  // Estado para Modal de cronograma
  const [openCronogramaModal, setOpenCronogramaModal] = useState(false)
  const [cronogramaVisitado, setCronogramaVisitado] = useState(false)

  // Estado para Modal de ver todas as datas
  const [openVerDatasModal, setOpenVerDatasModal] = useState(false)

  // Ref para evitar criação duplicada de sessões
  const sessoesGeradas = useRef(false)

  // Validação de campos
  const camposValidos = useMemo(() => ({
    cliente: !!data.cliente,
    evento: !!data.nomeEvento && data.datasEvento.length > 0,
    financeiro: !!data.faturamentoEstimado && parseFloat(data.faturamentoEstimado.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) > 0,
    local: !!data.localEventoNome && !!data.cidade && !!data.uf && data.uf.length === 2,
  }), [data.cliente, data.nomeEvento, data.datasEvento, data.faturamentoEstimado, data.localEventoNome, data.cidade, data.uf])

  // Auto-save no localStorage
  useEffect(() => {
    const rascunhoSalvo = localStorage.getItem('mco-rascunho-evento')
    if (rascunhoSalvo) {
      try {
        const rascunho = JSON.parse(rascunhoSalvo)
        // Migrar formato antigo (dataInicial/dataFinal) para datasEvento
        if (!rascunho.datasEvento && (rascunho.dataInicial || rascunho.dataFinal)) {
          const datas: Date[] = []
          if (rascunho.dataInicial) datas.push(new Date(rascunho.dataInicial))
          if (rascunho.dataFinal && rascunho.dataFinal !== rascunho.dataInicial) datas.push(new Date(rascunho.dataFinal))
          rascunho.datasEvento = datas
          delete rascunho.dataInicial
          delete rascunho.dataFinal
        } else if (rascunho.datasEvento) {
          rascunho.datasEvento = rascunho.datasEvento.map((d: string) => new Date(d))
        } else {
          rascunho.datasEvento = []
        }
        if (rascunho.sessoes) {
          rascunho.sessoes = rascunho.sessoes.map((s: any) => ({
            ...s,
            dataHoraInicio: s.dataHoraInicio ? new Date(s.dataHoraInicio) : null,
            dataHoraFim: s.dataHoraFim ? new Date(s.dataHoraFim) : null,
          }))
        }
        if (!data.cliente && !data.nomeEvento) {
          onChange(rascunho)
          toast.success('Rascunho restaurado')
        }
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!data.cliente && !data.nomeEvento) return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mco-rascunho-evento', JSON.stringify(data))
      } catch (e) {
        console.error('Erro ao salvar rascunho:', e)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [data])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openClienteModal) {
        setOpenClienteModal(false)
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (data.cliente || data.nomeEvento) {
          localStorage.setItem('mco-rascunho-evento', JSON.stringify(data))
          toast.success('Salvo')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openClienteModal, data])

  // Buscar clientes
  const { data: clientesData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getClients(),
  })

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!clientesData?.clients) return []
    if (!clienteSearchTerm) return clientesData.clients.filter(c => c.isActive)

    const searchLower = clienteSearchTerm.toLowerCase()
    return clientesData.clients.filter(client =>
      client.isActive &&
      (client.name.toLowerCase().includes(searchLower) ||
       client.document?.toLowerCase().includes(searchLower))
    )
  }, [clientesData?.clients, clienteSearchTerm])

  // Buscar locais via Nominatim
  useEffect(() => {
    if (!localSearchTerm || localSearchTerm.length < 3) {
      setLocaisEncontrados([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoLocal(true)
        const results = await searchNominatim(localSearchTerm)
        setLocaisEncontrados(results)
      } catch (error) {
        console.error('Erro ao buscar locais:', error)
        toast.error('Erro ao buscar locais')
      } finally {
        setBuscandoLocal(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [localSearchTerm])

  const sessoesValidacao = useMemo(() => data.sessoes.map(validarSessao), [data.sessoes])
  const todasSessoesValidas = useMemo(() => sessoesValidacao.every(v => v.valida), [sessoesValidacao])

  // Cálculo do Ticket Médio
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

  useEffect(() => {
    if (data.sessoes.length > 0) {
      setSessaoTexts(data.sessoes.map(s => ({
        horaInicio: s.dataHoraInicio ? format(s.dataHoraInicio, "HH:mm") : "",
        horaFim: s.dataHoraFim ? format(s.dataHoraFim, "HH:mm") : "",
      })))
    }
  }, [data.sessoes])

  // Criar sessões automaticamente quando as datas mudam
  useEffect(() => {
    if (data.datasEvento.length > 0 && data.sessoes.length === 0 && !sessoesGeradas.current) {
      sessoesGeradas.current = true
      const sorted = sortDates(data.datasEvento)
      const novasSessoes: Sessao[] = sorted.map(d => ({
        dataHoraInicio: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0),
        dataHoraFim: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0, 0),
      }))
      onChange({ ...data, sessoes: novasSessoes })
    }
    if (data.datasEvento.length === 0) {
      sessoesGeradas.current = false
    }
  }, [data.datasEvento])

  // Handler para seleção de datas no calendário
  const handleDatasChange = (dates: Date[] | undefined) => {
    const newDates = dates || []
    sessoesGeradas.current = false

    // Manter sessões existentes para datas que continuam selecionadas
    const sessoesMap = new Map<string, Sessao>()
    data.sessoes.forEach((sessao, i) => {
      const dataEvento = data.datasEvento[i]
      if (dataEvento) {
        sessoesMap.set(dataEvento.toDateString(), sessao)
      }
    })

    const sorted = sortDates(newDates)
    const novasSessoes: Sessao[] = sorted.map(d => {
      const existing = sessoesMap.get(d.toDateString())
      if (existing) return existing
      return {
        dataHoraInicio: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0),
        dataHoraFim: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0, 0),
      }
    })

    onChange({ ...data, datasEvento: sorted, sessoes: novasSessoes })
  }

  const handleFaturamentoChange = (value: string) => {
    onChange({ ...data, faturamentoEstimado: formatCurrency(value) })
  }

  const handlePublicoChange = (value: string) => {
    onChange({ ...data, publicoEstimado: formatNumber(value) })
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

  const getHorarioMes = (mesKey: string) => {
    return horariosPorMes[mesKey] || { inicio: '', fim: '' }
  }

  const setHorarioMes = (mesKey: string, field: 'inicio' | 'fim', value: string) => {
    setHorariosPorMes(prev => ({
      ...prev,
      [mesKey]: { ...getHorarioMes(mesKey), [field]: applyHoraMask(value) },
    }))
  }

  const handleAplicarHorarioMes = (mesKey: string, indicesGlobais: number[]) => {
    const h = getHorarioMes(mesKey)
    if (h.inicio.length !== 5 || h.fim.length !== 5) {
      toast.error('Informe os horários')
      return
    }

    const [horaInicio, minInicio] = h.inicio.split(':').map(Number)
    const [horaFim, minFim] = h.fim.split(':').map(Number)
    const fimTotal = horaFim * 60 + minFim
    const inicioTotal = horaInicio * 60 + minInicio
    const indicesSet = new Set(indicesGlobais)

    const novasSessoes = data.sessoes.map((sessao, i) => {
      if (!indicesSet.has(i)) return sessao
      const dataBase = sessao.dataHoraInicio || new Date()
      const dataInicio = new Date(
        dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(),
        horaInicio, minInicio
      )
      let dataFim = new Date(
        dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(),
        horaFim, minFim
      )
      if (fimTotal <= inicioTotal) {
        dataFim = addDays(dataFim, 1)
      }
      return { ...sessao, dataHoraInicio: dataInicio, dataHoraFim: dataFim }
    })

    onChange({ ...data, sessoes: novasSessoes })
    toast.success('Horários aplicados')
  }

  // Agrupar sessões por mês
  const sessoesPorMes = useMemo(() => {
    const groups: { mesKey: string; mesLabel: string; items: { sessao: Sessao; globalIndex: number }[] }[] = []
    const map = new Map<string, { sessao: Sessao; globalIndex: number }[]>()

    data.sessoes.forEach((sessao, index) => {
      const dt = sessao.dataHoraInicio
      if (!dt) return
      const mesKey = format(dt, 'yyyy-MM')
      if (!map.has(mesKey)) map.set(mesKey, [])
      map.get(mesKey)!.push({ sessao, globalIndex: index })
    })

    for (const [mesKey, items] of map) {
      const firstDate = items[0].sessao.dataHoraInicio!
      const mesLabel = format(firstDate, "MMMM 'de' yyyy", { locale: ptBR })
      groups.push({ mesKey, mesLabel, items })
    }

    return groups
  }, [data.sessoes])

  const handleRemoverSessao = (index: number) => {
    const sessaoRemovida = data.sessoes[index]
    const novasSessoes = data.sessoes.filter((_, i) => i !== index)

    // Remover a data correspondente de datasEvento
    let novasDatas = [...data.datasEvento]
    if (sessaoRemovida.dataHoraInicio) {
      novasDatas = novasDatas.filter(d => !isSameDay(d, sessaoRemovida.dataHoraInicio!))
    }

    onChange({ ...data, sessoes: novasSessoes, datasEvento: novasDatas })
  }

  // Texto resumo das datas selecionadas
  const datasResumo = useMemo(() => {
    if (data.datasEvento.length === 0) return null
    const sorted = sortDates(data.datasEvento)
    if (sorted.length === 1) {
      return format(sorted[0], "dd 'de' MMM yyyy", { locale: ptBR })
    }
    if (sorted.length <= 3) {
      return sorted.map(d => format(d, "dd/MM", { locale: ptBR })).join(', ')
    }
    return `${sorted.length} dias selecionados`
  }, [data.datasEvento])

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* Cliente */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Cliente</h3>
          {camposValidos.cliente && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <Button
          variant="outline"
          onClick={() => setOpenClienteModal(true)}
          className="w-full justify-start h-11 border-input"
          style={{ cursor: 'pointer' }}
        >
          {data.cliente
            ? clientesData?.clients.find((client) => client.id === data.cliente)?.name
            : "Selecione um cliente..."}
        </Button>

        {/* Modal de Clientes */}
        <Dialog open={openClienteModal} onOpenChange={setOpenClienteModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Selecionar Cliente
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Busque por nome ou CPF/CNPJ</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Buscar por nome ou documento..."
                value={clienteSearchTerm}
                onChange={(e) => setClienteSearchTerm(e.target.value)}
              />
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {clientesFiltrados.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      onChange({ ...data, cliente: client.id, clienteNome: client.name })
                      setClienteSearchTerm("")
                      setOpenClienteModal(false)
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150",
                      data.cliente === client.id
                        ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/15"
                        : "border-border dark:border-white/20 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-500/10"
                    )}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-3">
                      {data.cliente === client.id && (
                        <Check className="h-4 w-4 text-emerald-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        {client.document && (
                          <p className="text-xs text-muted-foreground">{client.document}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Evento */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Evento</h3>
          {camposValidos.evento && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-foreground mb-2 block">Nome do Evento</Label>
            <Input
              placeholder="Ex: Festival de Música 2025"
              value={data.nomeEvento}
              onChange={(e) => onChange({ ...data, nomeEvento: e.target.value })}
              className="h-11"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground mb-2 block">Dias do Evento</Label>
            <Popover open={openCalendarPopover} onOpenChange={setOpenCalendarPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-11 border-input",
                    data.datasEvento.length === 0 && "text-muted-foreground"
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {datasResumo || "Selecione os dias do evento..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  selected={data.datasEvento}
                  onSelect={handleDatasChange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
                {data.datasEvento.length > 0 && (
                  <div className="border-t p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {data.datasEvento.length} {data.datasEvento.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onChange({ ...data, datasEvento: [], sessoes: [] })
                        }}
                        className="text-xs text-destructive hover:text-destructive"
                        style={{ cursor: 'pointer' }}
                      >
                        Limpar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sortDates(data.datasEvento).slice(0, 5).map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          {getDiaSemanaAbreviado(d)} {format(d, "dd/MM")}
                        </span>
                      ))}
                      {data.datasEvento.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setOpenVerDatasModal(true)}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          +{data.datasEvento.length - 5} Ver Mais
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>

          </div>

          {/* Botão Cronograma */}
          {data.datasEvento.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setCronogramaVisitado(true)
                setOpenCronogramaModal(true)
              }}
              className={cn(
                "w-full h-11 justify-between relative",
                !cronogramaVisitado && "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20"
              )}
              style={{ cursor: 'pointer' }}
            >
              {!cronogramaVisitado && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500" />
                </span>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Cronograma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {data.sessoes.length} {data.sessoes.length === 1 ? 'sessão' : 'sessões'}
                </span>
                {todasSessoesValidas && data.sessoes.length > 0 && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {!todasSessoesValidas && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Modal Cronograma */}
      <Dialog open={openCronogramaModal} onOpenChange={setOpenCronogramaModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cronograma
              <span className="text-sm font-normal text-muted-foreground">
                ({data.sessoes.length} {data.sessoes.length === 1 ? 'sessão' : 'sessões'})
              </span>
            </DialogTitle>
          </DialogHeader>

          {sessoesPorMes.length > 0 && (
            <Tabs defaultValue={sessoesPorMes[0].mesKey} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full justify-start overflow-x-auto shrink-0">
                {sessoesPorMes.map(({ mesKey, mesLabel, items }) => (
                  <TabsTrigger key={mesKey} value={mesKey} className="capitalize text-xs" style={{ cursor: 'pointer' }}>
                    {mesLabel}
                    <span className="ml-1 text-muted-foreground">({items.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {sessoesPorMes.map(({ mesKey, items }) => {
                const h = getHorarioMes(mesKey)
                const indicesGlobais = items.map(it => it.globalIndex)

                return (
                  <TabsContent key={mesKey} value={mesKey} className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
                    {/* Horário padrão do mês */}
                    {items.length > 1 && (
                      <div className="bg-muted/50 rounded-lg border p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            placeholder="Hora início"
                            value={h.inicio}
                            onChange={(e) => setHorarioMes(mesKey, 'inicio', e.target.value)}
                            maxLength={5}
                            className="w-24 h-8 text-sm"
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <Input
                            placeholder="Hora fim"
                            value={h.fim}
                            onChange={(e) => setHorarioMes(mesKey, 'fim', e.target.value)}
                            maxLength={5}
                            className="w-24 h-8 text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAplicarHorarioMes(mesKey, indicesGlobais)}
                            className="h-8 text-xs ml-auto"
                            style={{ cursor: 'pointer' }}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Sessões do mês */}
                    <div className="space-y-1.5">
                      {items.map(({ sessao, globalIndex }) => {
                        const validacao = sessoesValidacao[globalIndex]
                        const temErro = !validacao?.valida

                        return (
                          <div
                            key={globalIndex}
                            className={cn(
                              "p-2.5 rounded-lg border",
                              temErro ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : "border-border bg-card"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                                  {globalIndex + 1}
                                </div>
                                {sessao.dataHoraInicio && (
                                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                    {getDiaSemanaAbreviado(sessao.dataHoraInicio)} {format(sessao.dataHoraInicio, "dd")}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  placeholder="08:00"
                                  value={sessaoTexts[globalIndex]?.horaInicio || ""}
                                  onChange={(e) => handleSessaoHoraInicioChange(globalIndex, e.target.value)}
                                  className="text-sm h-8"
                                  maxLength={5}
                                />
                                <span className="text-muted-foreground text-xs shrink-0">até</span>
                                <Input
                                  placeholder="18:00"
                                  value={sessaoTexts[globalIndex]?.horaFim || ""}
                                  onChange={(e) => handleSessaoHoraFimChange(globalIndex, e.target.value)}
                                  className="text-sm h-8"
                                  maxLength={5}
                                />
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 hover:bg-red-100 hover:text-red-600"
                                onClick={() => handleRemoverSessao(globalIndex)}
                                disabled={data.sessoes.length <= 1}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {temErro && (
                              <div className="mt-2 flex items-center gap-2 text-red-600 ml-8">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span className="text-xs">{validacao.erro}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={() => setOpenCronogramaModal(false)}
              className="w-full"
              style={{ cursor: 'pointer' }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Todas as Datas */}
      <Dialog open={openVerDatasModal} onOpenChange={setOpenVerDatasModal}>
        <DialogContent className="sm:max-w-[450px] max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Dias do Evento
              <span className="text-sm font-normal text-muted-foreground">
                ({data.datasEvento.length} {data.datasEvento.length === 1 ? 'dia' : 'dias'})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {sortDates(data.datasEvento).map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">
                    {getDiaSemanaAbreviado(d)} {format(d, "dd/MM/yyyy")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const novasDatas = data.datasEvento.filter(date => !isSameDay(date, d))
                    handleDatasChange(novasDatas)
                    if (novasDatas.length <= 5) setOpenVerDatasModal(false)
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => setOpenVerDatasModal(false)}
              className="w-full"
              style={{ cursor: 'pointer' }}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financeiro */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Faturamento</h3>
          {camposValidos.financeiro && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        {ticketMedio && (
          <p className="text-sm text-muted-foreground mb-4">
            Ticket médio: <span className="font-semibold text-green-600">{ticketMedio}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-foreground mb-2 block">Faturamento Estimado</Label>
            <Input
              placeholder="R$ 0,00"
              value={data.faturamentoEstimado}
              onChange={(e) => handleFaturamentoChange(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground mb-2 block">Público por Dia</Label>
            <Input
              placeholder="0"
              value={data.publicoEstimado}
              onChange={(e) => handlePublicoChange(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Local */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Local do Evento</h3>
          {camposValidos.local && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-foreground mb-2 block">Nome do Local</Label>
            <Popover open={openLocalPopover} onOpenChange={setOpenLocalPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLocalPopover}
                  className="w-full justify-between h-11"
                  style={{ cursor: 'pointer' }}
                >
                  {data.localEventoNome || "Buscar local..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="flex flex-col">
                  <div className="border-b p-2">
                    <Input
                      placeholder="Digite para buscar..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {buscandoLocal && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                      </div>
                    )}
                    {!buscandoLocal && locaisEncontrados.length === 0 && localSearchTerm.length >= 3 && (
                      <div className="p-4 text-sm text-center text-muted-foreground">
                        Nenhum local encontrado.
                      </div>
                    )}
                    {!buscandoLocal && localSearchTerm.length > 0 && localSearchTerm.length < 3 && (
                      <div className="p-4 text-sm text-center text-muted-foreground">
                        Digite pelo menos 3 caracteres para buscar.
                      </div>
                    )}
                    {!buscandoLocal && locaisEncontrados.length > 0 && (
                      <div className="py-1">
                        {locaisEncontrados.map((local) => (
                          <button
                            key={local.place_id}
                            type="button"
                            onClick={async () => {
                              const nomeLocal = local.display_name.split(',')[0].trim()
                              const cidade = local.address?.city ||
                                           local.address?.town ||
                                           local.address?.village ||
                                           local.address?.municipality || ''
                              const uf = extractUF(local.address)

                              // Preenche campos imediatamente com dados do Nominatim
                              const dadosAtualizados = {
                                ...data,
                                localEventoNome: nomeLocal,
                                localEvento: nomeLocal,
                                cidade,
                                uf,
                              }
                              onChange(dadosAtualizados)
                              setOpenLocalPopover(false)
                              setLocalSearchTerm("")

                              // Enrich via Overpass — salvar em Locais de Projetos acontece ao criar MCO
                              setEnrichingLocal(true)
                              try {
                                const detalhes = await enrichLocalFromOverpass(local)
                                // Armazena os detalhes para serem salvos ao criar MCO
                                onChange({ ...dadosAtualizados, localEventoDetalhes: detalhes })
                              } catch (error) {
                                console.error('Erro ao enriquecer local:', error)
                              } finally {
                                setEnrichingLocal(false)
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer text-left"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                data.localEventoNome === local.display_name.split(',')[0]
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-semibold text-foreground truncate">{local.display_name.split(',')[0]}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {local.address?.city || local.address?.town || local.address?.village || local.address?.municipality || ''}, {extractUF(local.address)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {enrichingLocal && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Buscando detalhes do local...
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground mb-2 block">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={data.cidade}
                onChange={(e) => onChange({ ...data, cidade: e.target.value })}
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground mb-2 block">UF</Label>
              <Input
                placeholder="UF"
                value={data.uf}
                onChange={(e) => onChange({ ...data, uf: e.target.value.toUpperCase() })}
                maxLength={2}
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

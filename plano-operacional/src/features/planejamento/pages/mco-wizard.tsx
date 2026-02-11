import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X, CheckCircle2, FileText, Settings, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { MCOEventoStep } from '../components/mco-evento-step'
import { MCOOperacionalStep } from '../components/mco-operacional-step'
import { MCOResumoStep } from '../components/mco-resumo-step'
import { mcoService } from '../services/mco.service'
import { mcoCalculatorService } from '../services/mco-calculator.service'
import { locaisEventosService } from '@/features/settings/services/locais-eventos.service'
import type { WizardStep, MCOEventoData, MCOOperacionalData } from '../types/mco.types'

const initialEventoData: MCOEventoData = {
  cliente: "",
  clienteNome: "",
  nomeEvento: "",
  datasEvento: [],
  sessoes: [],
  faturamentoEstimado: "",
  publicoEstimado: "",
  localEvento: "",
  localEventoNome: "",
  uf: "",
  cidade: "",
}

const initialOperacionalData: MCOOperacionalData = {
  timeTecnico: true,
  logistica: true,
  clienteForneceAlimentacaoGoLive: false,
  clienteForneceHospedagemAlpha: false,
  modalidadeId: "",
}

interface CreationStep {
  id: string
  label: string
  icon: React.ReactNode
}

const creationSteps: CreationStep[] = [
  { id: 'validating', label: 'Validando dados', icon: <ClipboardCheck className="h-5 w-5" /> },
  { id: 'creating', label: 'Criando MCO', icon: <FileText className="h-5 w-5" /> },
  { id: 'configuring', label: 'Configurando parâmetros', icon: <Settings className="h-5 w-5" /> },
  { id: 'complete', label: 'MCO criada com sucesso!', icon: <CheckCircle2 className="h-5 w-5" /> },
]

export function MCOWizardPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('evento')
  const [eventoData, setEventoData] = useState<MCOEventoData>(initialEventoData)
  const [operacionalData, setOperacionalData] = useState<MCOOperacionalData>(initialOperacionalData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessoesValidas, setSessoesValidas] = useState(true)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')

  // Modal de progresso
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [currentCreationStep, setCurrentCreationStep] = useState(0)

  const parseFaturamento = (value: string): number => {
    const cleaned = value
      ?.replace(/[^\d.,]/g, '')
      ?.replace(/\./g, '')
      ?.replace(',', '.')
      || '0'
    return parseFloat(cleaned)
  }

  const validateEventoStep = (): boolean => {
    if (!eventoData.clienteNome?.trim()) {
      toast.error('Selecione um cliente')
      return false
    }
    if (!eventoData.nomeEvento?.trim()) {
      toast.error('Informe o nome do evento')
      return false
    }
    if (!eventoData.datasEvento || eventoData.datasEvento.length === 0) {
      toast.error('Selecione os dias do evento')
      return false
    }

    const faturamento = parseFaturamento(eventoData.faturamentoEstimado)
    if (faturamento <= 0) {
      toast.error('Informe o faturamento estimado')
      return false
    }

    if (!eventoData.localEventoNome?.trim()) {
      toast.error('Selecione o local do evento')
      return false
    }

    if (!eventoData.cidade || !eventoData.uf) {
      toast.error('Informe cidade e UF do local')
      return false
    }

    if (!eventoData.sessoes || eventoData.sessoes.length === 0) {
      toast.error('Adicione pelo menos uma sessão')
      return false
    }

    if (!sessoesValidas) {
      toast.error('Corrija os erros nas sessões')
      return false
    }

    const sessoesIncompletas = eventoData.sessoes.filter(
      s => !s.dataHoraInicio || !s.dataHoraFim
    )
    if (sessoesIncompletas.length > 0) {
      toast.error(`${sessoesIncompletas.length} sessão(ões) incompleta(s)`)
      return false
    }

    return true
  }

  const validateOperacionalStep = (): boolean => {
    if (!operacionalData.modalidadeId) {
      toast.error('Selecione o modelo operacional')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 'evento') {
      if (validateEventoStep()) {
        setSlideDirection('right')
        setCurrentStep('operacional')
      }
    } else if (currentStep === 'operacional') {
      if (validateOperacionalStep()) {
        setSlideDirection('right')
        setCurrentStep('resumo')
      }
    }
  }

  const handlePrevious = () => {
    setSlideDirection('left')
    if (currentStep === 'operacional') {
      setCurrentStep('evento')
    } else if (currentStep === 'resumo') {
      setCurrentStep('operacional')
    }
  }

  const handleCancel = () => {
    navigate('/planejamento/mcos')
  }

  const handleClearDraft = () => {
    localStorage.removeItem('mco-rascunho-evento')
    setEventoData(initialEventoData)
    setOperacionalData(initialOperacionalData)
    setCurrentStep('evento')
    toast.success('Rascunho limpo')
  }

  const simulateProgress = async () => {
    // Step 1: Validando
    setCurrentCreationStep(0)
    setCreationProgress(10)
    await new Promise(r => setTimeout(r, 400))
    setCreationProgress(25)
    await new Promise(r => setTimeout(r, 300))

    // Step 2: Criando
    setCurrentCreationStep(1)
    setCreationProgress(40)
    await new Promise(r => setTimeout(r, 500))
    setCreationProgress(60)
    await new Promise(r => setTimeout(r, 400))

    // Step 3: Configurando
    setCurrentCreationStep(2)
    setCreationProgress(75)
    await new Promise(r => setTimeout(r, 400))
    setCreationProgress(90)
    await new Promise(r => setTimeout(r, 300))

    // Step 4: Completo
    setCurrentCreationStep(3)
    setCreationProgress(100)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setShowProgressModal(true)
    setCreationProgress(0)
    setCurrentCreationStep(0)

    try {
      // Inicia animação de progresso
      const progressPromise = simulateProgress()

      // Gerar código MCO
      const now = new Date()
      const codigo = `MCO-${String(now.getTime()).slice(-4).padStart(4, '0')}`

      // Derivar data_inicial e data_final do array de datas selecionadas
      const sortedDates = [...eventoData.datasEvento].sort((a, b) => a.getTime() - b.getTime())
      const dataInicial = sortedDates[0]
      const dataFinal = sortedDates[sortedDates.length - 1]

      // Calcular custos operacionais
      const calculationResult = await mcoCalculatorService.calcular(eventoData, operacionalData)

      // Criar MCO via service
      await mcoService.criarMCO({
        codigo,
        nome_evento: eventoData.nomeEvento,
        cidade: eventoData.cidade,
        uf: eventoData.uf,
        data_inicial: dataInicial ? format(dataInicial, 'yyyy-MM-dd') : '',
        data_final: dataFinal ? format(dataFinal, 'yyyy-MM-dd') : '',
        status: 'pendente',
        faturamento_estimado: eventoData.faturamentoEstimado,
        publico_estimado: eventoData.publicoEstimado,
        custo_operacional_efetivo: calculationResult.custo_operacional_efetivo,
        cot: calculationResult.cot,
        cliente_id: eventoData.cliente || null,
        cliente_nome: eventoData.clienteNome,
        num_sessoes: eventoData.sessoes.length,
        // Dados operacionais
        modalidade_id: operacionalData.modalidadeId,
        time_tecnico: operacionalData.timeTecnico,
        logistica: operacionalData.logistica,
        cliente_fornece_alimentacao: operacionalData.clienteForneceAlimentacaoGoLive,
        cliente_fornece_hospedagem: operacionalData.clienteForneceHospedagemAlpha,
        // Breakdown de custos
        breakdown_custos: calculationResult.breakdown,
      })

      // Salvar local em Locais de Projetos (se tiver detalhes enriquecidos)
      if (eventoData.localEventoDetalhes) {
        const detalhes = eventoData.localEventoDetalhes
        try {
          // Verificar se o local já existe (nome + cidade + uf)
          const locaisExistentes = await locaisEventosService.getLocais()
          const jaExiste = locaisExistentes.some(
            (l) =>
              l.nome.toLowerCase() === detalhes.nome.toLowerCase() &&
              l.cidade.toLowerCase() === detalhes.cidade.toLowerCase() &&
              l.uf.toLowerCase() === detalhes.uf.toLowerCase()
          )

          if (!jaExiste) {
            await locaisEventosService.createLocal({
              nome: detalhes.nome,
              apelido: undefined,
              tipo: detalhes.tipo,
              cidade: detalhes.cidade,
              uf: detalhes.uf,
              cep: detalhes.cep,
              logradouro: detalhes.logradouro,
              numero: detalhes.numero,
              bairro: detalhes.bairro,
              capacidade_maxima: detalhes.capacidade_maxima,
              tem_cobertura: detalhes.tem_cobertura ?? false,
              tem_ar_condicionado: detalhes.tem_ar_condicionado ?? false,
              tem_estacionamento: detalhes.tem_estacionamento ?? false,
              tem_acessibilidade: detalhes.tem_acessibilidade ?? false,
              ativo: true,
            })
          }
        } catch (localError) {
          // Log mas não bloqueia — MCO já foi criada
          console.error('Erro ao salvar local:', localError)
        }
      }

      // Aguarda animação terminar
      await progressPromise

      // Delay para mostrar sucesso
      await new Promise(r => setTimeout(r, 1000))

      toast.success('MCO criada com sucesso!')
      navigate('/planejamento/mcos')

    } catch (error) {
      console.error('Erro ao criar MCO:', error)
      setShowProgressModal(false)
      toast.error('Erro ao criar MCO. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'evento': return 'Dados do Evento'
      case 'operacional': return 'Configuração Operacional'
      case 'resumo': return 'Revisão Final'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'evento': return 'Informe os dados básicos do evento'
      case 'operacional': return 'Configure as opções operacionais'
      case 'resumo': return 'Revise os dados antes de confirmar'
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDraft}
              className="text-foreground hover:text-destructive hover:border-destructive"
              style={{ cursor: 'pointer' }}
            >
              Limpar Rascunho
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              style={{ cursor: 'pointer' }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-foreground">
              <FileText className="h-7 w-7 text-foreground" />
              Nova MCO
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Matriz de Custo Operacional
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step Content com animação */}
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              slideDirection === 'right' ? "animate-in slide-in-from-right-4" : "animate-in slide-in-from-left-4"
            )}
            key={currentStep}
          >
            {currentStep === 'evento' && (
              <MCOEventoStep
                data={eventoData}
                onChange={setEventoData}
                onValidationChange={setSessoesValidas}
              />
            )}
            {currentStep === 'operacional' && (
              <MCOOperacionalStep
                data={operacionalData}
                onChange={setOperacionalData}
              />
            )}
            {currentStep === 'resumo' && (
              <MCOResumoStep
                eventoData={eventoData}
                operacionalData={operacionalData}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={currentStep === 'evento' ? handleCancel : handlePrevious}
          className="min-w-[140px]"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'evento' ? 'Cancelar' : 'Voltar'}
        </Button>

        {currentStep === 'resumo' ? (
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="min-w-[140px] bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Criar MCO
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="min-w-[140px]"
            size="lg"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Modal de Progresso */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Criando MCO
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={creationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {creationProgress}%
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {creationSteps.map((step, index) => {
                const isActive = index === currentCreationStep
                const isCompleted = index < currentCreationStep
                const isPending = index > currentCreationStep

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10 border border-primary/20",
                      isCompleted && "bg-muted/50",
                      isPending && "opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-green-500 text-white",
                        isPending && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        isActive && "text-primary",
                        isCompleted && "text-green-600",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Evento info */}
            {currentCreationStep === 3 && (
              <div className="text-center pt-2 animate-in fade-in duration-500">
                <p className="text-sm text-muted-foreground">
                  {eventoData.nomeEvento}
                </p>
                <p className="text-xs text-muted-foreground">
                  {eventoData.cidade}/{eventoData.uf}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

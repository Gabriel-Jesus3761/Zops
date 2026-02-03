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

import { MCOStepIndicator } from '../components/mco-step-indicator'
import { MCOEventoStep } from '../components/mco-evento-step'
import { MCOOperacionalStep } from '../components/mco-operacional-step'
import { MCOResumoStep } from '../components/mco-resumo-step'
import { mcoService } from '../services/mco.service'
import type { WizardStep, MCOEventoData, MCOOperacionalData } from '../types/mco.types'

const initialEventoData: MCOEventoData = {
  cliente: "",
  clienteNome: "",
  nomeEvento: "",
  dataInicial: null,
  dataFinal: null,
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
    if (!eventoData.dataInicial || !eventoData.dataFinal) {
      toast.error('Informe o período do evento')
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

      // Criar MCO via service
      await mcoService.criarMCO({
        codigo,
        nome_evento: eventoData.nomeEvento,
        cidade: eventoData.cidade,
        uf: eventoData.uf,
        data_inicial: eventoData.dataInicial ? format(eventoData.dataInicial, 'yyyy-MM-dd') : '',
        data_final: eventoData.dataFinal ? format(eventoData.dataFinal, 'yyyy-MM-dd') : '',
        status: 'pendente',
        faturamento_estimado: eventoData.faturamentoEstimado,
        publico_estimado: eventoData.publicoEstimado,
        custo_operacional_efetivo: 0,
        cot: 0,
        cliente_id: eventoData.cliente || null,
        cliente_nome: eventoData.clienteNome,
        num_sessoes: eventoData.sessoes.length,
      })

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
      {/* Header Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Nova MCO</CardTitle>
                <CardDescription className="mt-1">
                  Matriz de Custo Operacional
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Step Indicator */}
          <MCOStepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Content Card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg">{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
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

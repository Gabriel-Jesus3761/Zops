import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { MCOStepIndicator } from '../components/mco-step-indicator'
import { MCOEventoStep } from '../components/mco-evento-step'
import { MCOOperacionalStep } from '../components/mco-operacional-step'
import { MCOResumoStep } from '../components/mco-resumo-step'
import { mcoService } from '../services/mco.service'
import type { WizardStep, MCOEventoData, MCOOperacionalData } from '../types/mco.types'

export function MCOEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('evento')
  const [eventoData, setEventoData] = useState<MCOEventoData | null>(null)
  const [operacionalData, setOperacionalData] = useState<MCOOperacionalData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')

  // Carregar MCO existente
  const { data: mco, isLoading, error } = useQuery({
    queryKey: ['mco-edit', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido')
      return await mcoService.buscarMCO(id)
    },
    enabled: !!id,
  })

  // Inicializar dados quando o MCO for carregado
  useEffect(() => {
    if (mco && !eventoData) {
      // Converter dados do MCO para o formato do wizard
      // Reconstruir datasEvento a partir de data_inicial e data_final
      const datasEvento: Date[] = []
      if (mco.data_inicial) {
        datasEvento.push(new Date(mco.data_inicial))
      }
      if (mco.data_final && mco.data_final !== mco.data_inicial) {
        datasEvento.push(new Date(mco.data_final))
      }

      setEventoData({
        cliente: mco.cliente_id || '',
        clienteNome: mco.cliente_nome || '',
        nomeEvento: mco.nome_evento,
        datasEvento,
        sessoes: [], // TODO: carregar sessões se disponíveis
        faturamentoEstimado: mco.faturamento_estimado,
        publicoEstimado: mco.publico_estimado || '',
        localEvento: '', // TODO: carregar local se disponível
        localEventoNome: `${mco.cidade} - ${mco.uf}`,
        uf: mco.uf,
        cidade: mco.cidade,
      })

      // Dados operacionais padrão (podem ser expandidos conforme necessário)
      setOperacionalData({
        timeTecnico: true,
        logistica: true,
        clienteForneceAlimentacaoGoLive: false,
        clienteForneceHospedagemAlpha: false,
        modalidadeId: '',
      })
    }
  }, [mco, eventoData])

  const parseFaturamento = (value: string): number => {
    const cleaned = value
      ?.replace(/[^\d.,]/g, '')
      ?.replace(/\./g, '')
      ?.replace(',', '.')
      || '0'
    return parseFloat(cleaned)
  }

  const validateEventoStep = (): boolean => {
    if (!eventoData) return false

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

    return true
  }

  const validateOperacionalStep = (): boolean => {
    if (!operacionalData) return false

    if (!operacionalData.modalidadeId?.trim()) {
      toast.error('Selecione uma modalidade')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 'evento' && !validateEventoStep()) {
      return
    }

    if (currentStep === 'operacional' && !validateOperacionalStep()) {
      return
    }

    setSlideDirection('right')

    if (currentStep === 'evento') {
      setCurrentStep('operacional')
    } else if (currentStep === 'operacional') {
      setCurrentStep('resumo')
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

  const handleSubmit = async () => {
    if (!eventoData || !operacionalData || !id) {
      toast.error('Dados incompletos')
      return
    }

    setIsSubmitting(true)

    try {
      // Aqui você implementaria a lógica de atualização do MCO
      // Por enquanto, vamos simular uma atualização
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('MCO atualizado com sucesso!')
      navigate('/planejamento/mcos')
    } catch (error) {
      console.error('Erro ao atualizar MCO:', error)
      toast.error('Erro ao atualizar MCO. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case 'evento':
        return 33
      case 'operacional':
        return 66
      case 'resumo':
        return 100
      default:
        return 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando MCO...</p>
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

  if (!eventoData || !operacionalData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparando edição...</p>
        </div>
      </div>
    )
  }

  // Verificar se MCO está aprovado
  if (mco.status === 'aprovado') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>MCO Aprovado</CardTitle>
            <CardDescription>
              Este MCO já foi aprovado e não pode ser editado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/planejamento/mcos/${id}/detalhes`)} className="w-full">
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/planejamento/mcos')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar MCO</h1>
                <p className="text-sm text-muted-foreground">Código: {mco.codigo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Progresso</p>
              <p className="text-2xl font-bold text-primary">{getStepProgress()}%</p>
            </div>
          </div>

          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      {/* Indicador de Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MCOStepIndicator currentStep={currentStep} />
      </div>

      {/* Conteúdo dos Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative overflow-hidden">
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              slideDirection === 'right' ? 'animate-in slide-in-from-right' : 'animate-in slide-in-from-left'
            )}
          >
            {currentStep === 'evento' && (
              <MCOEventoStep
                data={eventoData}
                onChange={setEventoData}
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
        </div>

        {/* Botões de Navegação */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 'evento' || isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {currentStep !== 'resumo' ? (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

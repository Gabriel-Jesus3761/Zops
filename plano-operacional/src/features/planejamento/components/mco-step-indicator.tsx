import { Check, Calendar, Settings, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStep } from '../types/mco.types'

interface MCOStepIndicatorProps {
  currentStep: WizardStep
  onStepClick?: (step: WizardStep) => void
}

const steps = [
  { id: 'evento' as WizardStep, label: 'Evento', sublabel: 'Dados básicos', icon: Calendar, number: 1 },
  { id: 'operacional' as WizardStep, label: 'Operacional', sublabel: 'Configurações', icon: Settings, number: 2 },
  { id: 'resumo' as WizardStep, label: 'Resumo', sublabel: 'Confirmação', icon: FileCheck, number: 3 },
]

export function MCOStepIndicator({ currentStep, onStepClick }: MCOStepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-6 left-[16.67%] right-[16.67%] h-0.5 bg-border rounded-full" />

        {/* Progress bar filled - com animação suave */}
        <div
          className="absolute top-6 left-[16.67%] h-0.5 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 66.67}%` }}
        />

        {/* Steps */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isPending = index > currentIndex
            const Icon = step.icon
            const canClick = isCompleted && onStepClick

            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center flex-1 group",
                  canClick && "cursor-pointer"
                )}
                onClick={() => canClick && onStepClick(step.id)}
              >
                {/* Step Circle with Icon */}
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground shadow-md shadow-primary/20",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/30 scale-110",
                    isPending && "bg-muted text-muted-foreground border-2 border-border",
                    canClick && "group-hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-xl animate-ping bg-primary/30" style={{ animationDuration: '2s' }} />
                  )}
                </div>

                {/* Labels */}
                <div className="mt-3 text-center">
                  <span
                    className={cn(
                      "block text-sm font-semibold transition-colors duration-300",
                      isCurrent && "text-foreground",
                      isCompleted && "text-primary",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "block text-xs transition-colors duration-300 mt-0.5",
                      isCurrent && "text-muted-foreground",
                      isCompleted && "text-primary/70",
                      isPending && "text-muted-foreground/60"
                    )}
                  >
                    {step.sublabel}
                  </span>
                </div>

                {/* Step number badge */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-muted-foreground/20 text-muted-foreground hidden"
                  )}
                  style={{ display: isPending ? 'none' : 'flex' }}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : step.number}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress text */}
      <div className="mt-6 text-center">
        <span className="text-xs text-muted-foreground">
          Passo <span className="font-semibold text-foreground">{currentIndex + 1}</span> de <span className="font-semibold text-foreground">{steps.length}</span>
        </span>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useSerialPatterns } from '../hooks/use-serial-patterns'
import type { SerialDetectionResult } from '../types/serial-pattern'
import { useNavigate } from 'react-router-dom'

interface SerialDetectorProps {
  serialNumber: string
  onSuggestionApply?: (tipo: string, modelo: string, adquirencia: string) => void
  className?: string
}

export function SerialDetector({ serialNumber, onSuggestionApply, className }: SerialDetectorProps) {
  const navigate = useNavigate()
  const { detectPattern } = useSerialPatterns()
  const [detection, setDetection] = useState<SerialDetectionResult | null>(null)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    if (serialNumber && serialNumber.length >= 2) {
      const result = detectPattern(serialNumber)
      setDetection(result)
      setHasApplied(false)
    } else {
      setDetection(null)
      setHasApplied(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialNumber])

  if (!detection || !serialNumber) {
    return null
  }

  const handleApplySuggestion = () => {
    if (detection.suggestedValues && onSuggestionApply) {
      onSuggestionApply(
        detection.suggestedValues.tipo || '',
        detection.suggestedValues.modelo || '',
        detection.suggestedValues.adquirencia || ''
      )
      setHasApplied(true)
    }
  }

  if (detection.found && detection.pattern) {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Padrão Identificado: <code className="ml-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{detection.pattern.prefixo}</code>
          </span>
        </AlertTitle>
        <AlertDescription>
          <div className="flex items-center gap-3 text-sm mt-2">
            <span><strong>Tipo:</strong> {detection.pattern.tipo}</span>
            <span>•</span>
            <span><strong>Modelo:</strong> {detection.pattern.modelo}</span>
            <span>•</span>
            <span><strong>Adquirência:</strong> {detection.pattern.adquirencia}</span>
          </div>

          {!hasApplied && onSuggestionApply && (
            <Button
              type="button"
              size="sm"
              onClick={handleApplySuggestion}
              className="mt-3"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Preencher Campos
            </Button>
          )}

          {hasApplied && (
            <div className="mt-3 text-xs text-green-600 font-medium">
              ✓ Campos preenchidos
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Nenhum padrão encontrado
  return (
    <Alert className={className} variant="default">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-sm font-medium">
        Prefixo <code className="font-mono">{serialNumber.substring(0, 3).toUpperCase()}</code> não reconhecido
      </AlertTitle>
      <AlertDescription className="text-sm mt-1">
        Configure um padrão para este prefixo em{' '}
        <button
          type="button"
          onClick={() => navigate('/logistica/cadastro/serial-patterns')}
          className="underline font-medium hover:text-primary"
        >
          Padrões de Serial
        </button>
      </AlertDescription>
    </Alert>
  )
}

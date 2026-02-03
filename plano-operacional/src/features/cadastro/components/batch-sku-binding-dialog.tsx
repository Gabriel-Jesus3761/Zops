import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Link2, AlertCircle, Loader2, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useSkuEquipmentBindings } from '../hooks/use-sku-equipment-bindings'
import { skuPatternsService } from '../services/sku-patterns.service'
import type { CreateSkuBindingData } from '../types/sku-equipment-binding'

interface PendingBinding {
  modelo: string
  adquirencia: string
  tipo: string
  sku?: string
  status?: 'pending' | 'creating' | 'created' | 'error'
  error?: string
}

interface BatchSkuBindingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingBindings: PendingBinding[]
  onBindingsCreated: (bindings: { modelo: string; adquirencia: string; sku: string }[]) => void
}

export function BatchSkuBindingDialog({
  open,
  onOpenChange,
  pendingBindings,
  onBindingsCreated,
}: BatchSkuBindingDialogProps) {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [bindings, setBindings] = useState<PendingBinding[]>([])
  const [noPatternConfigured, setNoPatternConfigured] = useState(false)
  const { addBinding, getNextAvailableSku } = useSkuEquipmentBindings()

  // Carregar SKUs sugeridos quando o modal abrir
  useEffect(() => {
    if (open && pendingBindings.length > 0) {
      loadSuggestedSkus()
    } else if (!open) {
      // Reset state when dialog closes
      setNoPatternConfigured(false)
      setBindings([])
      setIsLoading(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingBindings])

  const loadSuggestedSkus = async () => {
    setIsLoading(true)
    setNoPatternConfigured(false)

    try {
      // Verificar se existe padrão configurado para ativos serializados
      const activePatterns = await skuPatternsService.getActiveByItemType('ativo-serializado')

      if (activePatterns.length === 0) {
        setNoPatternConfigured(true)
        setBindings([])
        setIsLoading(false)
        return
      }

      const pattern = activePatterns[0]
      const codeToUse = pattern.customCode || 'ATS'

      // Buscar o próximo SKU disponível
      const firstSku = await getNextAvailableSku()
      const regex = new RegExp(`${codeToUse}(\\d+)`)
      const match = firstSku.match(regex) || firstSku.match(/([A-Z]+)(\d+)/)
      let currentNumber = match ? parseInt(match[match.length === 2 ? 1 : 2], 10) : 1

      const bindingsWithSkus: PendingBinding[] = []
      // Gerar SKUs incrementalmente para cada binding
      for (const binding of pendingBindings) {
        const sku = `${codeToUse}${currentNumber.toString().padStart(pattern.sequentialPadding || 3, '0')}`
        bindingsWithSkus.push({
          ...binding,
          sku,
          status: 'pending',
        })
        currentNumber++ // Incrementar para o próximo SKU
      }

      setBindings(bindingsWithSkus)
    } catch (error) {
      console.error('Erro ao carregar SKUs sugeridos:', error)
      setNoPatternConfigured(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToSettings = () => {
    onOpenChange(false)
    navigate('/logistica/cadastro/sku-patterns')
  }

  const handleCreateAll = async () => {
    setIsProcessing(true)
    const createdBindings: { modelo: string; adquirencia: string; sku: string }[] = []

    try {
      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i]

        // Atualizar status para "creating"
        setBindings(prev =>
          prev.map((b, idx) =>
            idx === i ? { ...b, status: 'creating' as const } : b
          )
        )

        try {
          const bindingData: CreateSkuBindingData = {
            sku: binding.sku!,
            modelo: binding.modelo,
            adquirencia: binding.adquirencia,
            tipo: binding.tipo,
          }

          await addBinding(bindingData)

          // Atualizar status para "created"
          setBindings(prev =>
            prev.map((b, idx) =>
              idx === i ? { ...b, status: 'created' as const } : b
            )
          )

          createdBindings.push({
            modelo: binding.modelo,
            adquirencia: binding.adquirencia,
            sku: binding.sku!,
          })
        } catch (error) {
          // Atualizar status para "error"
          setBindings(prev =>
            prev.map((b, idx) =>
              idx === i
                ? {
                    ...b,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Erro ao vincular',
                  }
                : b
            )
          )
        }
      }

      if (createdBindings.length > 0) {
        toast.success(`${createdBindings.length} SKUs vinculados com sucesso!`)
        onBindingsCreated(createdBindings)
        onOpenChange(false)
      } else {
        toast.error('Nenhum SKU foi vinculado')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const totalBindings = bindings.length
  const createdBindings = bindings.filter(b => b.status === 'created').length
  const errorBindings = bindings.filter(b => b.status === 'error').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular SKUs aos Equipamentos
          </DialogTitle>
          <DialogDescription>
            As seguintes combinações de equipamento serão vinculadas automaticamente a novos SKUs.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando padrões de SKU...</p>
          </div>
        ) : noPatternConfigured ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhum padrão de SKU configurado</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Para vincular SKUs a equipamentos, é necessário primeiro configurar um padrão de SKU
                para <strong>Ativos Serializados</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToSettings}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar Padrão de SKU
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cada combinação de <strong>Modelo + Adquirência</strong> receberá um SKU único.
                Todos os equipamentos com a mesma combinação compartilharão o mesmo SKU.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {bindings.map((binding) => (
                <div
                  key={`${binding.modelo}-${binding.adquirencia}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {binding.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      {binding.status === 'creating' && (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )}
                      {binding.status === 'created' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {binding.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{binding.modelo}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{binding.adquirencia}</span>
                        </div>
                        {binding.tipo && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Tipo: {binding.tipo}
                          </div>
                        )}
                        {binding.error && (
                          <div className="text-sm text-red-600 mt-1">
                            {binding.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant="secondary" className="font-mono">
                    {binding.sku || '...'}
                  </Badge>
                </div>
              ))}
            </div>

            {isProcessing && (
              <div className="text-sm text-muted-foreground text-center">
                Criando vinculações: {createdBindings + errorBindings} / {totalBindings}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {noPatternConfigured ? 'Fechar' : 'Cancelar'}
          </Button>
          {!noPatternConfigured && !isLoading && (
            <Button
              onClick={handleCreateAll}
              disabled={isProcessing || bindings.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando... ({createdBindings}/{totalBindings})
                </>
              ) : (
                `Vincular ${bindings.length} SKUs`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

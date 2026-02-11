import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { useLocaisEventos } from '../../hooks/use-locais-eventos'
import type { LocalEvento } from '../../types/local-evento'

interface MCOVinculada {
  id: string
  codigo: string | null
  nome_evento: string
  status: string | null
  faturamento_estimado: string
}

interface LocalEventoDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  local: LocalEvento | null
  onSuccess?: () => void
}

type DeleteStep = 'checking' | 'confirm' | 'blocked' | 'warning'

export function LocalEventoDeleteModal({
  open,
  onOpenChange,
  local,
  onSuccess,
}: LocalEventoDeleteModalProps) {
  const { deleteLocal, toggleActive, verificarMCOsVinculadas, isDeleting } = useLocaisEventos()
  const [step, setStep] = useState<DeleteStep>('checking')
  const [mcos, setMcos] = useState<MCOVinculada[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && local) {
      setStep('checking')
      setIsLoading(true)

      try {
        const mcosVinculadas = await verificarMCOsVinculadas(local.id)
        setMcos(mcosVinculadas)

        const mcosAprovadas = mcosVinculadas.filter((m) => m.status === 'aprovada')
        const mcosPendentes = mcosVinculadas.filter((m) => m.status !== 'aprovada')

        if (mcosAprovadas.length > 0) {
          setStep('blocked')
        } else if (mcosPendentes.length > 0) {
          setStep('warning')
        } else {
          setStep('confirm')
        }
      } catch (error) {
        console.error('Erro ao verificar MCOs:', error)
        setStep('confirm')
      } finally {
        setIsLoading(false)
      }
    }
    onOpenChange(isOpen)
  }

  const handleDelete = async () => {
    if (!local) return

    try {
      await deleteLocal(local.id)
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Erro tratado no hook
    }
  }

  const handleDeactivate = async () => {
    if (!local) return

    try {
      await toggleActive({ id: local.id, ativo: false })
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Erro tratado no hook
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (!local) return null

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        {step === 'checking' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verificando...</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir o local?</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium">{local.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {local.cidade}, {local.uf}
                </p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {step === 'blocked' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Não é Possível Excluir
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este local possui MCOs aprovadas vinculadas:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-48 space-y-2 overflow-y-auto py-4">
              {mcos
                .filter((m) => m.status === 'aprovada')
                .map((mco) => (
                  <div key={mco.id} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-medium">
                      {mco.codigo || 'MCO'} - {mco.nome_evento}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: Aprovada | {formatCurrency(mco.faturamento_estimado)}
                    </p>
                  </div>
                ))}
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950/50">
              <p className="text-blue-600 dark:text-blue-400">
                Você pode desativar o local ao invés de excluí-lo
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
              <Button onClick={handleDeactivate} disabled={isLoading}>
                Desativar Local
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 'warning' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Atenção - MCOs Pendentes
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este local possui MCOs em rascunho/revisão:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-48 space-y-2 overflow-y-auto py-4">
              {mcos
                .filter((m) => m.status !== 'aprovada')
                .map((mco) => (
                  <div key={mco.id} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-medium">
                      {mco.codigo || 'MCO'} - {mco.nome_evento}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {mco.status || 'Pendente'}
                    </p>
                  </div>
                ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Ao excluir, estas MCOs ficarão sem local vinculado.
            </p>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir Mesmo Assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

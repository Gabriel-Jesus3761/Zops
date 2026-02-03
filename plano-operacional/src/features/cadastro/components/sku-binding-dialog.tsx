import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSkuEquipmentBindings } from '../hooks/use-sku-equipment-bindings'
import type { CreateSkuBindingData } from '../types/sku-equipment-binding'

const bindingSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório').regex(/^ATS\d{3}$/, 'SKU deve estar no formato ATS001'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  adquirencia: z.string().min(1, 'Adquirência é obrigatória'),
  tipo: z.string().optional(),
})

type BindingFormData = z.infer<typeof bindingSchema>

interface SkuBindingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelo: string
  adquirencia: string
  tipo?: string
  onBindingCreated?: (sku: string) => void
}

export function SkuBindingDialog({
  open,
  onOpenChange,
  modelo,
  adquirencia,
  tipo,
  onBindingCreated,
}: SkuBindingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestedSku, setSuggestedSku] = useState('')
  const { addBinding, getNextAvailableSku } = useSkuEquipmentBindings()

  const form = useForm<BindingFormData>({
    resolver: zodResolver(bindingSchema),
    defaultValues: {
      sku: '',
      modelo: '',
      adquirencia: '',
      tipo: '',
    },
  })

  // Atualizar o formulário quando o modal abrir ou os dados mudarem
  useEffect(() => {
    if (open) {
      const loadNextSku = async () => {
        const nextSku = await getNextAvailableSku()
        setSuggestedSku(nextSku)
        form.reset({
          sku: nextSku,
          modelo: modelo,
          adquirencia: adquirencia,
          tipo: tipo || '',
        })
      }
      loadNextSku()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modelo, adquirencia, tipo])

  const handleSubmit = async (data: BindingFormData) => {
    setIsSubmitting(true)
    try {
      const bindingData: CreateSkuBindingData = {
        sku: data.sku,
        modelo: data.modelo,
        adquirencia: data.adquirencia,
        tipo: data.tipo,
      }

      await addBinding(bindingData)

      toast.success('SKU vinculado com sucesso!', {
        description: `${data.sku} → ${data.modelo} (${data.adquirencia})`,
      })

      // Notificar o componente pai
      onBindingCreated?.(data.sku)

      // Fechar dialog
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao criar vinculação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao vincular SKU')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseSuggested = () => {
    form.setValue('sku', suggestedSku)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular SKU ao Equipamento
          </DialogTitle>
          <DialogDescription>
            Esta combinação de equipamento ainda não possui um SKU vinculado.
            Crie um novo SKU para identificar este tipo de equipamento.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos os equipamentos com <strong>{modelo}</strong> da <strong>{adquirencia}</strong> compartilharão o mesmo SKU.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Ex: ATS001" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleUseSuggested}
                    >
                      Usar {suggestedSku}
                    </Button>
                  </div>
                  <FormDescription>
                    Código único para este tipo de equipamento (formato: ATS001)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adquirencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adquirência *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {tipo && (
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Vinculando...' : 'Vincular SKU'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

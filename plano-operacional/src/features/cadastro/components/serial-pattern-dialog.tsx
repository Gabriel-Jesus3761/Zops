import { useEffect, useState, useRef } from 'react'
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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Info, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SerialPattern, CustomOptions } from '../types/serial-pattern'

const serialPatternSchema = z.object({
  prefixo: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(10, 'Máximo 10 caracteres')
    .transform((val) => val.trim().toUpperCase().replace(/\s+/g, ''))
    .pipe(
      z.string().regex(/^[A-Z0-9]+$/, 'Apenas letras e números, sem espaços ou caracteres especiais')
    ),
  tipo: z
    .string()
    .min(1, 'Tipo é obrigatório')
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z.string().regex(/^[A-Z0-9\s]+$/, 'Apenas letras, números e espaços, sem caracteres especiais')
    ),
  modelo: z
    .string()
    .min(1, 'Modelo é obrigatório')
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z.string().regex(/^[A-Z0-9\s]+$/, 'Apenas letras, números e espaços, sem caracteres especiais')
    ),
  adquirencia: z
    .string()
    .min(1, 'Adquirência é obrigatória')
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z.string().regex(/^[A-Z0-9\s]+$/, 'Apenas letras, números e espaços, sem caracteres especiais')
    ),
  needsValidation: z.boolean(),
  ativo: z.boolean(),
})

type SerialPatternFormData = z.infer<typeof serialPatternSchema>

interface ComboboxFieldProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  className?: string
  onCreateNew?: (value: string) => void
}

function ComboboxField({ value, onChange, options, placeholder, className, onCreateNew }: ComboboxFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(option =>
    option.toUpperCase().includes(filter.toUpperCase())
  )

  // Sincronizar filter com value quando o componente montar ou value mudar
  useEffect(() => {
    setFilter(value)
  }, [value])

  // Garantir que o filter seja atualizado quando o dropdown fechar
  useEffect(() => {
    if (!isOpen) {
      setFilter(value)
    }
  }, [isOpen, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setFilter(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSelectOption = (option: string) => {
    onChange(option)
    setFilter(option)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={filter}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn('uppercase pr-8', className)}
        />
        <ChevronDown
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2">
              {filter && onCreateNew ? (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(filter)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar "{filter}"</span>
                </button>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  {filter ? 'Nenhuma opção encontrada' : 'Sem opções cadastradas'}
                </div>
              )}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between',
                  value.toUpperCase() === option.toUpperCase() && 'bg-accent'
                )}
              >
                {option}
                {value.toUpperCase() === option.toUpperCase() && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface SerialPatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pattern?: SerialPattern | null
  customOptions: CustomOptions
  onSave: (data: Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>
  onUpdate?: (id: string, data: Partial<SerialPattern>) => void | Promise<void>
  onAddCustomOption: (type: 'tipos' | 'modelos' | 'adquirencias', value: string) => void | Promise<void>
  onReloadOptions?: () => void | Promise<void>
}

export function SerialPatternDialog({
  open,
  onOpenChange,
  pattern,
  customOptions,
  onSave,
  onUpdate,
  onAddCustomOption,
  onReloadOptions,
}: SerialPatternDialogProps) {
  const isEditing = !!pattern
  const [isReloading, setIsReloading] = useState(false)

  const form = useForm<SerialPatternFormData>({
    resolver: zodResolver(serialPatternSchema),
    defaultValues: {
      prefixo: '',
      tipo: '',
      modelo: '',
      adquirencia: '',
      needsValidation: false,
      ativo: true,
    },
  })

  // Rastrear valores digitados e se existem nas opções
  const tipoValue = form.watch('tipo')
  const modeloValue = form.watch('modelo')
  const adquirenciaValue = form.watch('adquirencia')

  const tipoExists = customOptions.tipos.some(t => t.toUpperCase() === tipoValue.toUpperCase())
  const modeloExists = customOptions.modelos.some(m => m.toUpperCase() === modeloValue.toUpperCase())
  const adquirenciaExists = customOptions.adquirencias.some(a => a.toUpperCase() === adquirenciaValue.toUpperCase())

  const showCreateTipo = tipoValue.length > 0 && !tipoExists
  const showCreateModelo = modeloValue.length > 0 && !modeloExists
  const showCreateAdquirencia = adquirenciaValue.length > 0 && !adquirenciaExists

  useEffect(() => {
    if (pattern) {
      form.reset({
        prefixo: pattern.prefixo,
        tipo: pattern.tipo,
        modelo: pattern.modelo,
        adquirencia: pattern.adquirencia,
        needsValidation: pattern.needsValidation,
        ativo: pattern.ativo,
      })
    } else {
      form.reset({
        prefixo: '',
        tipo: '',
        modelo: '',
        adquirencia: '',
        needsValidation: false,
        ativo: true,
      })
    }
  }, [pattern, form])

  const onSubmit = async (data: SerialPatternFormData) => {
    const patternData = {
      ...data,
      prefixo: data.prefixo.toUpperCase(),
      subCategoria: 'EQUIPAMENTOS',
      dataAtualizacao: new Date().toISOString(),
      atualizadoPor: 'Sistema',
    }

    if (isEditing && pattern?.id && onUpdate) {
      await onUpdate(pattern.id, patternData)
    } else {
      await onSave(patternData)
    }
    onOpenChange(false)
    form.reset()
  }

  const handleAddTipo = async (valorManual?: string) => {
    const valor = valorManual || tipoValue
    const cleanValue = valor.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    if (cleanValue) {
      await onAddCustomOption('tipos', cleanValue)
      toast.success('Tipo adicionado!', {
        description: `"${cleanValue}" foi criado e está disponível para uso.`
      })
    }
  }

  const handleAddModelo = async (valorManual?: string) => {
    const valor = valorManual || modeloValue
    const cleanValue = valor.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    if (cleanValue) {
      await onAddCustomOption('modelos', cleanValue)
      toast.success('Modelo adicionado!', {
        description: `"${cleanValue}" foi criado e está disponível para uso.`
      })
    }
  }

  const handleAddAdquirencia = async (valorManual?: string) => {
    const valor = valorManual || adquirenciaValue
    const cleanValue = valor.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    if (cleanValue) {
      await onAddCustomOption('adquirencias', cleanValue)
      toast.success('Adquirência adicionada!', {
        description: `"${cleanValue}" foi criada e está disponível para uso.`
      })
    }
  }

  const handleReload = async () => {
    if (!onReloadOptions) return

    setIsReloading(true)
    try {
      await onReloadOptions()
    } catch (error) {
      console.error('Erro ao recarregar opções:', error)
    } finally {
      setIsReloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Padrão de Serial' : 'Novo Padrão de Serial'}
          </DialogTitle>
          <DialogDescription>
            Configure o padrão para identificação automática baseada no prefixo do número de série
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Os campos Tipo, Modelo e Adquirência são inteligentes. Digite um valor e, se não existir,
            aparecerá um botão para criá-lo automaticamente.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prefixo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefixo Serial *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: PB3, 244, AA7"
                      {...field}
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Primeiros caracteres do número de série (2-10 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {onReloadOptions && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Opções de Tipo, Modelo e Adquirência
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReload}
                  disabled={isReloading}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', isReloading && 'animate-spin')} />
                  Atualizar
                </Button>
              </div>
            )}

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <ComboboxField
                          value={field.value}
                          onChange={field.onChange}
                          options={customOptions.tipos}
                          placeholder="Digite ou escolha um tipo"
                          onCreateNew={handleAddTipo}
                        />
                        {showCreateTipo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTipo()}
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar "{tipoValue}"
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <ComboboxField
                          value={field.value}
                          onChange={field.onChange}
                          options={customOptions.modelos}
                          placeholder="Digite ou escolha um modelo"
                          onCreateNew={handleAddModelo}
                        />
                        {showCreateModelo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddModelo()}
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar "{modeloValue}"
                          </Button>
                        )}
                      </div>
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
                      <div className="space-y-2">
                        <ComboboxField
                          value={field.value}
                          onChange={field.onChange}
                          options={customOptions.adquirencias}
                          placeholder="Digite ou escolha uma adquirência"
                          onCreateNew={handleAddAdquirencia}
                        />
                        {showCreateAdquirencia && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddAdquirencia()}
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar "{adquirenciaValue}"
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="needsValidation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Validação Manual
                      </FormLabel>
                      <FormDescription>
                        Sempre pedir confirmação manual
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Status
                      </FormLabel>
                      <FormDescription>
                        Padrão ativo para uso
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Salvar Alterações' : 'Criar Padrão'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

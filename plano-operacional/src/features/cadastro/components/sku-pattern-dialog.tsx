import { useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SkuPattern } from '../types/sku-pattern'
import { generateSku } from '../utils/sku-generator'
import { DEFAULT_ITEM_TYPE_CONFIGS } from '../constants/default-patterns'

const patternSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  pattern: z.string().min(1, 'Padrão é obrigatório'),
  itemType: z.enum(['ativo-serializado', 'ativo-nao-serializado', 'insumo']),
  customCode: z.string()
    .min(1, 'Código é obrigatório')
    .max(4, 'Máximo 4 letras')
    .transform(val => val.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{1,4}$/, 'Apenas letras de A-Z')),
  description: z.string().optional(),
  sequentialStart: z.number().min(1, 'Deve ser pelo menos 1'),
  sequentialPadding: z.number().min(1, 'Deve ser pelo menos 1').max(10, 'Máximo 10'),
  isActive: z.boolean(),
})

type PatternFormData = z.infer<typeof patternSchema>

interface SkuPatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pattern?: SkuPattern | null
  onSave: (data: Omit<SkuPattern, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, data: Partial<SkuPattern>) => void
}

export function SkuPatternDialog({
  open,
  onOpenChange,
  pattern,
  onSave,
  onUpdate,
}: SkuPatternDialogProps) {
  const isEditing = !!pattern

  const form = useForm<PatternFormData>({
    resolver: zodResolver(patternSchema),
    defaultValues: {
      name: '',
      pattern: '{TIPO}{SEQUENCIAL}',
      itemType: 'ativo-serializado',
      customCode: 'ATS',
      description: '',
      sequentialStart: 1,
      sequentialPadding: 3,
      isActive: true,
    },
  })

  // Atualizar formulário quando o padrão mudar
  useEffect(() => {
    if (pattern) {
      const defaultConfig = DEFAULT_ITEM_TYPE_CONFIGS.find(c => c.itemType === pattern.itemType)
      form.reset({
        name: pattern.name,
        pattern: pattern.pattern,
        itemType: pattern.itemType,
        customCode: pattern.customCode || defaultConfig?.code || '',
        description: pattern.description || '',
        sequentialStart: pattern.sequentialStart,
        sequentialPadding: pattern.sequentialPadding,
        isActive: pattern.isActive,
      })
    } else {
      form.reset({
        name: '',
        pattern: '{TIPO}{SEQUENCIAL}',
        itemType: 'ativo-serializado',
        customCode: 'ATS',
        description: '',
        sequentialStart: 1,
        sequentialPadding: 3,
        isActive: true,
      })
    }
  }, [pattern, form])

  const watchedItemType = form.watch('itemType')
  const watchedCustomCode = form.watch('customCode')

  // Preview do SKU - sempre usa padrão fixo {TIPO}{SEQUENCIAL} com 3 zeros
  const itemTypeConfig = DEFAULT_ITEM_TYPE_CONFIGS.find(c => c.itemType === watchedItemType)
  const preview = itemTypeConfig
    ? (() => {
        const codeToUse = watchedCustomCode || itemTypeConfig.code
        const mockPattern: SkuPattern = {
          name: 'Preview',
          pattern: '{TIPO}{SEQUENCIAL}',
          itemType: itemTypeConfig.itemType,
          customCode: codeToUse,
          sequentialStart: 1,
          sequentialPadding: 3,
          isActive: true,
        }
        // Usar customCode se existir, senão usar código padrão
        const customConfig = { ...itemTypeConfig, code: codeToUse }
        return generateSku(mockPattern, customConfig, 1).sku
      })()
    : ''

  const onSubmit = (data: PatternFormData) => {
    // Forçar valores fixos para pattern, sequentialStart e sequentialPadding
    const patternData = {
      ...data,
      pattern: '{TIPO}{SEQUENCIAL}',
      sequentialStart: 1,
      sequentialPadding: 3,
    }

    if (isEditing && pattern?.id && onUpdate) {
      onUpdate(pattern.id, patternData)
    } else {
      onSave(patternData)
    }
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Padrão de SKU' : 'Novo Padrão de SKU'}
          </DialogTitle>
          <DialogDescription>
            Configure o padrão de geração automática de SKU
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Padrão *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Padrão Ativos 2024" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome descritivo para identificar o padrão
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Item *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEFAULT_ITEM_TYPE_CONFIGS.map((config) => (
                        <SelectItem key={config.itemType} value={config.itemType}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Para qual tipo de item este padrão será usado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código/Sigla *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: ATS, TERM, MAT"
                      {...field}
                      className="font-mono uppercase"
                      maxLength={4}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Código do tipo (até 4 letras, apenas A-Z)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Formato padrão para ativos do ano de 2024" {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição opcional do padrão
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pré-visualização do SKU */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Pré-visualização do SKU
                </div>
                <Badge variant="secondary" className="text-xs">
                  Formato: TIPO + Sequencial
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-bold text-primary font-mono">
                  {preview || 'Digite o código acima'}
                </code>
                {preview && (
                  <span className="text-sm text-muted-foreground">
                    (exemplo com número 001)
                  </span>
                )}
              </div>
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

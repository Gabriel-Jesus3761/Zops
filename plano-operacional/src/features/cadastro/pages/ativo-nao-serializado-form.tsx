import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Wand2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { getItemTypeConfig } from '../constants/default-patterns'
import { generateSku } from '../utils/sku-generator'
import { useSkuPatterns } from '../hooks/use-sku-patterns'
import type { SkuPattern } from '../types/sku-pattern'

const ativoNaoSerializadoSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  quantidade: z.number().min(1, 'Quantidade deve ser maior que 0').optional(),
})

type AtivoNaoSerializadoFormData = z.infer<typeof ativoNaoSerializadoSchema>

export function AtivoNaoSerializadoForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<SkuPattern | null>(null)
  const [currentSequential, setCurrentSequential] = useState(1)

  const { getActivePatternsByItemType } = useSkuPatterns()
  const availablePatterns = getActivePatternsByItemType('ativo-nao-serializado')
  const itemTypeConfig = getItemTypeConfig('ativo-nao-serializado')

  const form = useForm<AtivoNaoSerializadoFormData>({
    resolver: zodResolver(ativoNaoSerializadoSchema),
    defaultValues: {
      sku: '',
      tipo: '',
      modelo: '',
      quantidade: undefined,
    },
  })

  const handleGenerateSku = () => {
    if (!selectedPattern || !itemTypeConfig) {
      toast.error('Selecione um padrão de SKU primeiro')
      return
    }

    const generated = generateSku(selectedPattern, itemTypeConfig, currentSequential)
    form.setValue('sku', generated.sku)
    setCurrentSequential(prev => prev + 1)
    toast.success('SKU gerado com sucesso!')
  }

  const onSubmit = async (data: AtivoNaoSerializadoFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Integrar com API/Firebase para salvar os dados
      console.log('Ativo Não Serializado:', data)

      toast.success('Ativo Não Serializado cadastrado com sucesso!')

      // Limpar formulário
      form.reset()

      // Opcional: navegar de volta para a lista
      // navigate('/logistica/cadastro')
    } catch (error) {
      console.error('Erro ao cadastrar ativo:', error)
      toast.error('Erro ao cadastrar ativo não serializado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/logistica/cadastro')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastro de Ativo Não Serializado</h1>
          <p className="mt-2 text-muted-foreground">
            Preencha os dados do ativo sem número de série individual
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Ativo</CardTitle>
          <CardDescription>
            Todos os campos marcados com * são obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Geração Automática de SKU</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/logistica/cadastro/sku-patterns')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Padrões
                  </Button>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select
                      value={selectedPattern?.id || ''}
                      onValueChange={(value) => {
                        const pattern = availablePatterns.find(p => p.id === value)
                        setSelectedPattern(pattern || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um padrão de SKU" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePatterns.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Nenhum padrão ativo disponível
                          </div>
                        ) : (
                          availablePatterns.map((pattern) => (
                            <SelectItem key={pattern.id} value={pattern.id!}>
                              {pattern.name} - <code className="text-xs">{pattern.pattern}</code>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGenerateSku}
                    disabled={!selectedPattern}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar SKU
                  </Button>
                </div>
                {selectedPattern && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedPattern.description}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ATN-2024-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Código único de identificação do item (Stock Keeping Unit)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cabo HDMI, Parafuso, Bateria" {...field} />
                      </FormControl>
                      <FormDescription>
                        Categoria ou tipo do ativo
                      </FormDescription>
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
                        <Input placeholder="Ex: HDMI 2.0 3m" {...field} />
                      </FormControl>
                      <FormDescription>
                        Modelo específico do ativo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="quantidade"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 10"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantidade de itens disponíveis (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/logistica/cadastro')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Ativo'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

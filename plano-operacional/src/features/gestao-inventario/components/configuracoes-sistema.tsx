import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Bell,
  Link2,
  Package,
  FileText,
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Skeleton, SkeletonForm } from '@/components/ui/skeleton'
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip'

// Validation Schemas
const estoqueSchema = z.object({
  alertaEstoqueMinimo: z.boolean(),
  quantidadeMinimaAlerta: z.number().min(1, 'Deve ser pelo menos 1'),
  periodoReposicao: z.number().min(1, 'Deve ser pelo menos 1 dia'),
  metodoCalculoMedia: z.enum(['simples', 'ponderada', 'exponencial']),
  considerarPedidosPendentes: z.boolean(),
})

const notificacaoSchema = z.object({
  emailAlertaEstoque: z.boolean(),
  emailRelatoriosDiarios: z.boolean(),
  emailsNotificacao: z.string(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  frequenciaRelatorios: z.enum(['diario', 'semanal', 'mensal']),
})

const integracaoSchema = z.object({
  apiKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  sincronizacaoAutomatica: z.boolean(),
  intervaloSincronizacao: z.number().min(5, 'Mínimo de 5 minutos'),
})

const relatorioSchema = z.object({
  formatoPadrao: z.enum(['pdf', 'excel', 'csv']),
  incluirGraficos: z.boolean(),
  periodoHistorico: z.number().min(1).max(24),
  agruparPor: z.enum(['categoria', 'fornecedor', 'localizacao']),
})

type EstoqueFormData = z.infer<typeof estoqueSchema>
type NotificacaoFormData = z.infer<typeof notificacaoSchema>
type IntegracaoFormData = z.infer<typeof integracaoSchema>
type RelatorioFormData = z.infer<typeof relatorioSchema>

// Default values
const defaultEstoque: EstoqueFormData = {
  alertaEstoqueMinimo: true,
  quantidadeMinimaAlerta: 10,
  periodoReposicao: 7,
  metodoCalculoMedia: 'simples',
  considerarPedidosPendentes: true,
}

const defaultNotificacao: NotificacaoFormData = {
  emailAlertaEstoque: true,
  emailRelatoriosDiarios: false,
  emailsNotificacao: '',
  webhookUrl: '',
  frequenciaRelatorios: 'semanal',
}

const defaultIntegracao: IntegracaoFormData = {
  apiKey: '',
  webhookSecret: '',
  sincronizacaoAutomatica: false,
  intervaloSincronizacao: 30,
}

const defaultRelatorio: RelatorioFormData = {
  formatoPadrao: 'pdf',
  incluirGraficos: true,
  periodoHistorico: 12,
  agruparPor: 'categoria',
}

export function ConfiguracoesSistema() {
  const [activeTab, setActiveTab] = React.useState('estoque')
  const [isLoading, setIsLoading] = React.useState(true)

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <ConfiguracoesSkeleton />
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Configurações do Sistema
          </h2>
          <p className="text-muted-foreground">
            Gerencie as configurações de inventário e integrações do sistema.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="estoque" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="integracao" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Integração</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estoque" className="mt-6">
            <EstoqueConfig />
          </TabsContent>

          <TabsContent value="notificacoes" className="mt-6">
            <NotificacaoConfig />
          </TabsContent>

          <TabsContent value="integracao" className="mt-6">
            <IntegracaoConfig />
          </TabsContent>

          <TabsContent value="relatorios" className="mt-6">
            <RelatorioConfig />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

function EstoqueConfig() {
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EstoqueFormData>({
    resolver: zodResolver(estoqueSchema),
    defaultValues: defaultEstoque,
  })

  const alertaEstoqueMinimo = watch('alertaEstoqueMinimo')
  const considerarPedidosPendentes = watch('considerarPedidosPendentes')

  const onSubmit = async (data: EstoqueFormData) => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Estoque config saved:', data)
      toast.success('Configurações de estoque salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Configurações de Estoque
        </CardTitle>
        <CardDescription>
          Configure alertas, cálculos de média e parâmetros de reposição.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="alertaEstoqueMinimo">Alerta de Estoque Mínimo</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas quando o estoque atingir o nível mínimo
              </p>
            </div>
            <Switch
              id="alertaEstoqueMinimo"
              checked={alertaEstoqueMinimo}
              onCheckedChange={(checked) => setValue('alertaEstoqueMinimo', checked)}
            />
          </div>

          {alertaEstoqueMinimo && (
            <FormField error={errors.quantidadeMinimaAlerta?.message}>
              <FormField.Label required>Quantidade Mínima para Alerta</FormField.Label>
              <FormField.Input
                type="number"
                placeholder="10"
                {...register('quantidadeMinimaAlerta', { valueAsNumber: true })}
              />
              <FormField.Description>
                Quando o estoque atingir esta quantidade, um alerta será gerado
              </FormField.Description>
              <FormField.Error />
            </FormField>
          )}

          <FormField error={errors.periodoReposicao?.message}>
            <FormField.Label required>Período de Reposição (dias)</FormField.Label>
            <FormField.Input
              type="number"
              placeholder="7"
              {...register('periodoReposicao', { valueAsNumber: true })}
            />
            <FormField.Description>
              Tempo médio para reposição de estoque
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <FormField error={errors.metodoCalculoMedia?.message}>
            <FormField.Label required>Método de Cálculo de Média</FormField.Label>
            <Select
              defaultValue={defaultEstoque.metodoCalculoMedia}
              onValueChange={(value) =>
                setValue('metodoCalculoMedia', value as EstoqueFormData['metodoCalculoMedia'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Média Simples</SelectItem>
                <SelectItem value="ponderada">Média Ponderada</SelectItem>
                <SelectItem value="exponencial">Média Exponencial</SelectItem>
              </SelectContent>
            </Select>
            <FormField.Description>
              Método usado para calcular a média de consumo
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="considerarPedidosPendentes">
                Considerar Pedidos Pendentes
              </Label>
              <p className="text-sm text-muted-foreground">
                Incluir pedidos pendentes no cálculo de estoque disponível
              </p>
            </div>
            <Switch
              id="considerarPedidosPendentes"
              checked={considerarPedidosPendentes}
              onCheckedChange={(checked) =>
                setValue('considerarPedidosPendentes', checked)
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultEstoque)}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function NotificacaoConfig() {
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<NotificacaoFormData>({
    resolver: zodResolver(notificacaoSchema),
    defaultValues: defaultNotificacao,
  })

  const emailAlertaEstoque = watch('emailAlertaEstoque')
  const emailRelatoriosDiarios = watch('emailRelatoriosDiarios')

  const onSubmit = async (data: NotificacaoFormData) => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Notificacao config saved:', data)
      toast.success('Configurações de notificação salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Configure como e quando você deseja receber notificações.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="emailAlertaEstoque">Alerta de Estoque por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas de estoque baixo por email
              </p>
            </div>
            <Switch
              id="emailAlertaEstoque"
              checked={emailAlertaEstoque}
              onCheckedChange={(checked) => setValue('emailAlertaEstoque', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="emailRelatoriosDiarios">Relatórios por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba relatórios periódicos por email
              </p>
            </div>
            <Switch
              id="emailRelatoriosDiarios"
              checked={emailRelatoriosDiarios}
              onCheckedChange={(checked) => setValue('emailRelatoriosDiarios', checked)}
            />
          </div>

          {(emailAlertaEstoque || emailRelatoriosDiarios) && (
            <FormField error={errors.emailsNotificacao?.message}>
              <FormField.Label required>Emails para Notificação</FormField.Label>
              <FormField.Textarea
                placeholder="email1@exemplo.com, email2@exemplo.com"
                {...register('emailsNotificacao')}
              />
              <FormField.Description>
                Separe múltiplos emails por vírgula
              </FormField.Description>
              <FormField.Error />
            </FormField>
          )}

          {emailRelatoriosDiarios && (
            <FormField error={errors.frequenciaRelatorios?.message}>
              <FormField.Label required>Frequência dos Relatórios</FormField.Label>
              <Select
                defaultValue={defaultNotificacao.frequenciaRelatorios}
                onValueChange={(value) =>
                  setValue(
                    'frequenciaRelatorios',
                    value as NotificacaoFormData['frequenciaRelatorios']
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
              <FormField.Error />
            </FormField>
          )}

          <FormField error={errors.webhookUrl?.message}>
            <FormField.Label>Webhook URL (opcional)</FormField.Label>
            <FormField.Input
              type="url"
              placeholder="https://seu-webhook.com/endpoint"
              {...register('webhookUrl')}
            />
            <FormField.Description>
              URL para receber notificações via webhook
            </FormField.Description>
            <FormField.Error />
          </FormField>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultNotificacao)}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function IntegracaoConfig() {
  const [isSaving, setIsSaving] = React.useState(false)
  const [showApiKey, setShowApiKey] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<IntegracaoFormData>({
    resolver: zodResolver(integracaoSchema),
    defaultValues: defaultIntegracao,
  })

  const sincronizacaoAutomatica = watch('sincronizacaoAutomatica')

  const onSubmit = async (data: IntegracaoFormData) => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Integracao config saved:', data)
      toast.success('Configurações de integração salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Configurações de Integração
        </CardTitle>
        <CardDescription>
          Configure chaves de API e sincronização com sistemas externos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <FormField error={errors.apiKey?.message}>
            <FormField.Label>Chave de API</FormField.Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                {...register('apiKey')}
              />
              <SimpleTooltip content={showApiKey ? 'Ocultar' : 'Mostrar'}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </SimpleTooltip>
            </div>
            <FormField.Description>
              Chave de acesso para APIs externas
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <FormField error={errors.webhookSecret?.message}>
            <FormField.Label>Webhook Secret</FormField.Label>
            <FormField.Input
              type="password"
              placeholder="whsec_xxxxxxxxxxxxxxxx"
              {...register('webhookSecret')}
            />
            <FormField.Description>
              Secret para validação de webhooks recebidos
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="sincronizacaoAutomatica">Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar automaticamente com sistemas externos
              </p>
            </div>
            <Switch
              id="sincronizacaoAutomatica"
              checked={sincronizacaoAutomatica}
              onCheckedChange={(checked) =>
                setValue('sincronizacaoAutomatica', checked)
              }
            />
          </div>

          {sincronizacaoAutomatica && (
            <FormField error={errors.intervaloSincronizacao?.message}>
              <FormField.Label required>
                Intervalo de Sincronização (minutos)
              </FormField.Label>
              <FormField.Input
                type="number"
                placeholder="30"
                {...register('intervaloSincronizacao', { valueAsNumber: true })}
              />
              <FormField.Description>
                Intervalo entre sincronizações automáticas (mínimo 5 minutos)
              </FormField.Description>
              <FormField.Error />
            </FormField>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultIntegracao)}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function RelatorioConfig() {
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<RelatorioFormData>({
    resolver: zodResolver(relatorioSchema),
    defaultValues: defaultRelatorio,
  })

  const incluirGraficos = watch('incluirGraficos')

  const onSubmit = async (data: RelatorioFormData) => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Relatorio config saved:', data)
      toast.success('Configurações de relatório salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configurações de Relatórios
        </CardTitle>
        <CardDescription>
          Configure formato, conteúdo e organização dos relatórios.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <FormField error={errors.formatoPadrao?.message}>
            <FormField.Label required>Formato Padrão</FormField.Label>
            <Select
              defaultValue={defaultRelatorio.formatoPadrao}
              onValueChange={(value) =>
                setValue('formatoPadrao', value as RelatorioFormData['formatoPadrao'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <FormField.Description>
              Formato padrão para exportação de relatórios
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="incluirGraficos">Incluir Gráficos</Label>
              <p className="text-sm text-muted-foreground">
                Adicionar visualizações gráficas aos relatórios
              </p>
            </div>
            <Switch
              id="incluirGraficos"
              checked={incluirGraficos}
              onCheckedChange={(checked) => setValue('incluirGraficos', checked)}
            />
          </div>

          <FormField error={errors.periodoHistorico?.message}>
            <FormField.Label required>Período Histórico (meses)</FormField.Label>
            <FormField.Input
              type="number"
              placeholder="12"
              min={1}
              max={24}
              {...register('periodoHistorico', { valueAsNumber: true })}
            />
            <FormField.Description>
              Quantidade de meses de histórico a incluir (máximo 24)
            </FormField.Description>
            <FormField.Error />
          </FormField>

          <FormField error={errors.agruparPor?.message}>
            <FormField.Label required>Agrupar Por</FormField.Label>
            <Select
              defaultValue={defaultRelatorio.agruparPor}
              onValueChange={(value) =>
                setValue('agruparPor', value as RelatorioFormData['agruparPor'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o agrupamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categoria">Categoria</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="localizacao">Localização</SelectItem>
              </SelectContent>
            </Select>
            <FormField.Description>
              Como os dados serão agrupados nos relatórios
            </FormField.Description>
            <FormField.Error />
          </FormField>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultRelatorio)}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function ConfiguracoesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <SkeletonForm fields={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

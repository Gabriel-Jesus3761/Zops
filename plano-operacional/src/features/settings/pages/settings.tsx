import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Palette, Settings, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SyncUsers, EnrichUsers, ManageUsers } from '../components'
import { LoginCarouselConfig } from '../components/appearance/login-carousel-config'

const settingsMenuOptions = [
  {
    value: 'geral',
    title: 'Geral',
    description: 'Perfil e preferências gerais do sistema',
    icon: Settings,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'usuarios',
    title: 'Gestão de Usuários',
    description: 'Gerenciamento, sincronização e enriquecimento de dados',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'notificacoes',
    title: 'Notificações',
    description: 'Canais e alertas para eventos importantes',
    icon: Bell,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'seguranca',
    title: 'Segurança',
    description: 'Regras de acesso e proteção da conta',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    value: 'aparencia',
    title: 'Aparência',
    description: 'Personalização visual da experiência',
    icon: Palette,
    color: 'text-purple-600 dark:text-purple-400',
  },
] as const

export function SettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Detectar aba ativa baseada na URL
  const getActiveTab = () => {
    if (location.pathname.includes('/usuarios')) return 'usuarios'
    if (location.pathname.includes('/notificacoes')) return 'notificacoes'
    if (location.pathname.includes('/seguranca')) return 'seguranca'
    if (location.pathname.includes('/aparencia')) return 'aparencia'
    return 'geral'
  }

  // Detectar sub-aba ativa de usuários
  const getActiveUserTab = () => {
    if (location.pathname.includes('/sincronizar')) return 'sync'
    if (location.pathname.includes('/enriquecer')) return 'enrich'
    return 'manage'
  }

  const handleTabChange = (value: string) => {
    navigate(`/configuracoes/${value}`)
  }

  const handleUserTabChange = (value: string) => {
    const tabMap: Record<string, string> = {
      manage: 'gerenciar',
      sync: 'sincronizar',
      enrich: 'enriquecer',
    }
    navigate(`/configuracoes/usuarios/${tabMap[value]}`)
  }

  const activeTab = getActiveTab()
  const normalizedPath = location.pathname.replace(/\/+$/, '')
  const isMenuView = normalizedPath === '/configuracoes'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="mt-2 text-muted-foreground">
            {isMenuView ? 'Selecione uma área para configurar' : 'Gerencie as configurações do sistema'}
          </p>
        </div>
        {!isMenuView && (
          <Button variant="outline" onClick={() => navigate('/configuracoes')} className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao menu
          </Button>
        )}
      </div>

      {isMenuView ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {settingsMenuOptions.map((option) => {
            const Icon = option.icon

            return (
              <Card
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleTabChange(option.value)
                  }
                }}
                className="cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg bg-muted p-3', option.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-3">{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleTabChange(option.value)
                    }}
                  >
                    Abrir
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>
                  Gerencie as informações do seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configurações de perfil em breve...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>
                  Configure suas preferências gerais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configurações de preferências em breve...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Tabs value={getActiveUserTab()} onValueChange={handleUserTabChange} className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Gerenciar</TabsTrigger>
              <TabsTrigger value="sync">Sincronizar Novos</TabsTrigger>
              <TabsTrigger value="enrich">Enriquecer Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="mt-6">
              <ManageUsers />
            </TabsContent>

            <TabsContent value="sync" className="mt-6">
              <SyncUsers />
            </TabsContent>

            <TabsContent value="enrich" className="mt-6">
              <EnrichUsers />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure suas preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurações de notificações em breve...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie a segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurações de segurança em breve...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <LoginCarouselConfig />
        </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

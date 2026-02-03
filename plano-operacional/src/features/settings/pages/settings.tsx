import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SyncUsers, EnrichUsers, ManageUsers } from '../components'
import { LoginCarouselConfig } from '../components/appearance/login-carousel-config'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Gestão de Usuários</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        </TabsList>

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
    </div>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BedDouble,
  Building,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  CreditCard,
  DollarSign,
  Grid3x3,
  Layers,
  MapPin,
  Menu,
  Palette,
  Settings,
  Shield,
  SlidersHorizontal,
  Truck,
  UserCog,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wrench,
  X,
  Zap,
  Package,
  TableProperties,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SyncUsers, EnrichUsers, ManageUsers, ManageClients } from '../components'
import { LoginCarouselConfig } from '../components/appearance/login-carousel-config'
import { LocaisEventosPage } from './locais-eventos'
import {
  ManageClusters,
  ManageFiliais,
  ManageCargos,
  ManageModalidades,
  ManageJornadas,
  ManageDimensionamento,
  ManageParametrosGerais,
  ManageEtapaTimes,
} from '../components/mco-parametros'
import { ParametrosDiariasPage } from './parametros-diarias'
import { EtapasProjetoPage } from './etapas-projeto'

import type { LucideIcon } from 'lucide-react'

// Tipos para a estrutura da sidebar
interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  path: string
}

interface NavSubGroup {
  key: string
  label: string
  icon: LucideIcon
  children: NavItem[]
}

interface NavSection {
  label: string
  items: (NavItem | NavSubGroup)[]
}

function isSubGroup(item: NavItem | NavSubGroup): item is NavSubGroup {
  return 'children' in item
}

// Definição das seções da sidebar
const settingsSections: NavSection[] = [
  {
    label: 'Sistema',
    items: [
      { key: 'geral', label: 'Geral', icon: Settings, path: '/configuracoes/geral' },
      { key: 'aparencia', label: 'Aparência', icon: Palette, path: '/configuracoes/aparencia' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { key: 'usuarios', label: 'Usuários', icon: Users, path: '/configuracoes/usuarios/gerenciar' },
      { key: 'clientes', label: 'Clientes', icon: Building2, path: '/configuracoes/clientes' },
    ],
  },
  {
    label: 'Parâmetros de Eventos',
    items: [
      { key: 'etapas-projeto', label: 'Etapas do Projeto', icon: Calendar, path: '/configuracoes/etapas-projeto' },
      { key: 'clusters', label: 'Clusters', icon: Layers, path: '/configuracoes/clusters' },
      { key: 'modalidades', label: 'Modalidades', icon: CreditCard, path: '/configuracoes/modalidades' },
      { key: 'locais-eventos', label: 'Locais de Projetos', icon: MapPin, path: '/configuracoes/locais-eventos' },
    ],
  },
  {
    label: 'Motores de Cálculo',
    items: [
      { key: 'filiais', label: 'Filiais', icon: Building, path: '/configuracoes/filiais' },
      {
        key: 'mao-de-obra',
        label: 'Mão de Obra',
        icon: Wrench,
        children: [
          { key: 'cargos', label: 'Cargos', icon: UserCog, path: '/configuracoes/cargos' },
          { key: 'jornadas', label: 'Jornadas', icon: Clock, path: '/configuracoes/jornadas' },
          { key: 'parametros-diarias', label: 'Parâmetros de Diárias', icon: DollarSign, path: '/configuracoes/parametros-diarias' },
          { key: 'cargos-x-cluster', label: 'Cargos x Cluster', icon: Grid3x3, path: '/configuracoes/cargos-x-cluster' },
          { key: 'times-por-etapa', label: 'Times por Etapa', icon: UsersRound, path: '/configuracoes/times-por-etapa' },
          { key: 'parametros', label: 'Parâmetros Gerais', icon: SlidersHorizontal, path: '/configuracoes/parametros' },
        ],
      },
      {
        key: 'alimentacao',
        label: 'Alimentação',
        icon: UtensilsCrossed,
        children: [
          { key: 'parametros-alimentacao', label: 'Parâmetros de Alimentação', icon: SlidersHorizontal, path: '/configuracoes/parametros-alimentacao' },
        ],
      },
      {
        key: 'hospedagem',
        label: 'Hospedagem',
        icon: BedDouble,
        children: [
          { key: 'base-custo-hospedagem', label: 'Base de Custo', icon: DollarSign, path: '/configuracoes/base-custo-hospedagem' },
          { key: 'matriz-hospedagem', label: 'Matriz de Hospedagem', icon: TableProperties, path: '/configuracoes/matriz-hospedagem' },
        ],
      },
      {
        key: 'transporte',
        label: 'Transporte',
        icon: Truck,
        children: [
          { key: 'parametros-transporte', label: 'Parâmetros de Transporte', icon: SlidersHorizontal, path: '/configuracoes/parametros-transporte' },
        ],
      },
      {
        key: 'frete',
        label: 'Frete',
        icon: Package,
        children: [
          { key: 'parametros-frete', label: 'Parâmetros de Frete', icon: SlidersHorizontal, path: '/configuracoes/parametros-frete' },
        ],
      },
    ],
  },
  {
    label: 'Avançado',
    items: [
      { key: 'notificacoes', label: 'Notificações', icon: Bell, path: '/configuracoes/notificacoes' },
      { key: 'seguranca', label: 'Segurança', icon: Shield, path: '/configuracoes/seguranca' },
    ],
  },
]

// Coletar todas as keys (incluindo filhos de sub-grupos)
const allKeys = settingsSections.flatMap((s) =>
  s.items.flatMap((item) => (isSubGroup(item) ? item.children.map((c) => c.key) : [item.key]))
)

// Detectar seção ativa baseada na URL
function getActiveKey(pathname: string): string {
  // Ordenar keys por tamanho (maior → menor) para verificar as mais específicas primeiro
  const sortedKeys = [...allKeys].sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    if (pathname.includes(`/configuracoes/${key}`)) {
      return key
    }
  }
  if (pathname.includes('/usuarios')) return 'usuarios'
  return 'geral'
}

// Verificar se um sub-grupo contém a key ativa
function subGroupContainsKey(subGroup: NavSubGroup, activeKey: string): boolean {
  return subGroup.children.some((child) => child.key === activeKey)
}

export function SettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeKey = getActiveKey(location.pathname)

  // Sub-grupos abertos (inicializa com o sub-grupo que contém a rota ativa)
  const [openSubGroups, setOpenSubGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const section of settingsSections) {
      for (const item of section.items) {
        if (isSubGroup(item) && subGroupContainsKey(item, activeKey)) {
          initial.add(item.key)
        }
      }
    }
    return initial
  })

  const toggleSubGroup = (key: string) => {
    setOpenSubGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Detectar sub-aba ativa de usuários
  const getActiveUserTab = () => {
    if (location.pathname.includes('/sincronizar')) return 'sync'
    if (location.pathname.includes('/enriquecer')) return 'enrich'
    return 'manage'
  }

  const handleUserTabChange = (value: string) => {
    const tabMap: Record<string, string> = {
      manage: 'gerenciar',
      sync: 'sincronizar',
      enrich: 'enriquecer',
    }
    navigate(`/configuracoes/usuarios/${tabMap[value]}`)
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setMobileNavOpen(false)
  }

  // Sidebar navigation component
  const SidebarNav = ({ className }: { className?: string }) => (
    <nav className={cn('space-y-6', className)}>
      {settingsSections.map((section) => (
        <div key={section.label}>
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              if (isSubGroup(item)) {
                const isOpen = openSubGroups.has(item.key)
                const hasActiveChild = subGroupContainsKey(item, activeKey)
                const Icon = item.icon
                return (
                  <div key={item.key}>
                    <button
                      onClick={() => toggleSubGroup(item.key)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        hasActiveChild
                          ? 'text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const isActive = activeKey === child.key
                          return (
                            <button
                              key={child.key}
                              onClick={() => handleNavClick(child.path)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{child.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const Icon = item.icon
              const isActive = activeKey === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  // Placeholder para seções que ainda não possuem componente
  const PlaceholderContent = ({ title, description }: { title: string; description: string }) => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Esta seção está em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Em breve...</p>
        </CardContent>
      </Card>
    </div>
  )

  // Renderizar o conteúdo baseado na seção ativa
  const renderContent = () => {
    switch (activeKey) {
      case 'geral':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Geral</h2>
              <p className="text-muted-foreground">Perfil e preferências gerais do sistema</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil</CardTitle>
                  <CardDescription>Gerencie as informações do seu perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Configurações de perfil em breve...</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                  <CardDescription>Configure suas preferências gerais</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Configurações de preferências em breve...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'aparencia':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Aparência</h2>
              <p className="text-muted-foreground">Personalização visual da experiência</p>
            </div>
            <LoginCarouselConfig />
          </div>
        )

      case 'usuarios':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h2>
              <p className="text-muted-foreground">Gerenciamento, sincronização e enriquecimento de dados</p>
            </div>
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
          </div>
        )

      case 'clientes':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
              <p className="text-muted-foreground">Gestão e cadastro de clientes</p>
            </div>
            <ManageClients />
          </div>
        )

      case 'locais-eventos':
        return (
          <div className="space-y-6">
            <LocaisEventosPage />
          </div>
        )

      case 'etapas-projeto':
        return <EtapasProjetoPage />

      case 'clusters':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Clusters</h2>
              <p className="text-muted-foreground">Categorias de tamanho de evento por faixa de faturamento</p>
            </div>
            <ManageClusters />
          </div>
        )

      case 'filiais':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Filiais</h2>
              <p className="text-muted-foreground">Filiais Zig com raio de atuação e limites</p>
            </div>
            <ManageFiliais />
          </div>
        )

      case 'modalidades':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Modalidades</h2>
              <p className="text-muted-foreground">Modalidades de operação e TPV por terminal</p>
            </div>
            <ManageModalidades />
          </div>
        )

      case 'parametros':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Parâmetros Gerais</h2>
              <p className="text-muted-foreground">Configurações gerais do cálculo MCO</p>
            </div>
            <ManageParametrosGerais />
          </div>
        )

      // Mão de Obra
      case 'cargos':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Cargos</h2>
              <p className="text-muted-foreground">Cargos operacionais e valores de diárias</p>
            </div>
            <ManageCargos />
          </div>
        )

      case 'jornadas':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Jornadas</h2>
              <p className="text-muted-foreground">Escalas de trabalho e horários</p>
            </div>
            <ManageJornadas />
          </div>
        )

      case 'parametros-diarias':
        return <ParametrosDiariasPage />

      case 'cargos-x-cluster':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Cargos x Cluster</h2>
              <p className="text-muted-foreground">Matriz de cargos por cluster</p>
            </div>
            <ManageDimensionamento />
          </div>
        )

      case 'times-por-etapa':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Times por Etapa</h2>
              <p className="text-muted-foreground">Configure quais times participam de cada etapa do evento</p>
            </div>
            <ManageEtapaTimes />
          </div>
        )

      // Alimentação
      case 'parametros-alimentacao':
        return <PlaceholderContent title="Parâmetros de Alimentação" description="Configurar custos de alimentação" />

      // Hospedagem
      case 'base-custo-hospedagem':
        return <PlaceholderContent title="Base de Custo" description="Configurar base de custos de hospedagem" />

      case 'matriz-hospedagem':
        return <PlaceholderContent title="Matriz de Hospedagem" description="Matriz de custos de hospedagem por região e categoria" />

      // Transporte
      case 'parametros-transporte':
        return <PlaceholderContent title="Parâmetros de Transporte" description="Configurar custos de transporte por modalidade e distância" />

      // Frete
      case 'parametros-frete':
        return <PlaceholderContent title="Parâmetros de Frete" description="Configurar custos de frete por filial e cluster" />

      // Avançado
      case 'notificacoes':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Notificações</h2>
              <p className="text-muted-foreground">Configure suas preferências de notificação</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Canais de Notificação</CardTitle>
                <CardDescription>Configure como você deseja ser notificado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configurações de notificações em breve...</p>
              </CardContent>
            </Card>
          </div>
        )

      case 'seguranca':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Segurança</h2>
              <p className="text-muted-foreground">Regras de acesso e proteção da conta</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>Gerencie a segurança da sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configurações de segurança em breve...</p>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Mobile nav toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="fixed bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'relative z-50 shrink-0 border-r bg-muted/30',
          // Desktop
          'hidden w-[250px] overflow-y-auto md:block',
          // Mobile
          mobileNavOpen && 'fixed inset-y-0 left-0 block w-[280px] bg-background shadow-2xl md:relative md:w-[250px] md:shadow-none'
        )}
      >
        <div className="sticky top-0 z-50 border-b bg-background px-5 py-4">
          <h1 className="text-lg font-semibold">Configurações</h1>
          <p className="text-xs text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
        <div className="p-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="relative z-0 flex-1 overflow-y-auto p-6">
        {renderContent()}
      </main>
    </div>
  )
}

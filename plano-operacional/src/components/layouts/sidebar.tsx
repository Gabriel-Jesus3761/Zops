import { useState, useCallback, memo } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Settings, ChevronDown, Truck, PackageOpen, Rocket, ClipboardList, ClipboardPenLine, Calculator, FileText, Database, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onMobileClose: () => void
}

interface SubMenuItem {
  key: string
  label: string
  path: string
  icon?: React.ReactNode
}

interface MenuGroup {
  key: string
  icon: React.ReactNode
  label: string
  type: 'group'
  items: SubMenuItem[]
}

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  type: 'item'
}

type MenuItemOrGroup = MenuItem | MenuGroup

// Menu items definidos fora do componente para evitar recriação
const menuItems: MenuItemOrGroup[] = [
  {
    key: 'dashboard',
    type: 'item',
    icon: <Home className="h-5 w-5" />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'go-live',
    type: 'group',
    icon: <Rocket className="h-5 w-5" />,
    label: 'Go Live',
    items: [
      {
        key: 'plano-operacional',
        label: 'Plano Operacional',
        path: '/go-live/plano-operacional',
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ],
  },
  {
    key: 'planejamento',
    type: 'group',
    icon: <ClipboardPenLine className="h-5 w-5" />,
    label: 'Planejamento',
    items: [
      {
        key: 'mcos',
        label: 'MCOs',
        path: '/planejamento/mcos',
        icon: <Calculator className="h-4 w-4" />,
      },
      {
        key: 'hubspot',
        label: 'Hubspot',
        path: '/planejamento/hubspot',
        icon: <Cloud className="h-4 w-4" />,
      },
    ],
  },
  {
    key: 'logistica',
    type: 'group',
    icon: <Truck className="h-5 w-5" />,
    label: 'Logística',
    items: [
      {
        key: 'cadastro',
        label: 'Cadastro',
        path: '/logistica/cadastro',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        key: 'gestao-ativos',
        label: 'Gestão de Ativos',
        path: '/logistica/gestao-ativos',
        icon: <PackageOpen className="h-4 w-4" />,
      },
      {
        key: 'gestao-ativos-teste',
        label: 'Gestão de Ativos - Teste',
        path: '/logistica/cadastro/gestao-ativos-teste',
        icon: <Database className="h-4 w-4" />,
      },
    ],
  },
  {
    key: 'configuracoes',
    type: 'item',
    icon: <Settings className="h-5 w-5" />,
    label: 'Configurações',
    path: '/configuracoes',
  },
]

// Sub-item de menu memoizado
const SubMenuItemLink = memo(function SubMenuItemLink({
  subItem,
  isExpanded,
  onMobileClose,
}: {
  subItem: SubMenuItem
  isExpanded: boolean
  onMobileClose: () => void
}) {
  return (
    <NavLink
      to={subItem.path}
      onClick={onMobileClose}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg px-3 py-2 text-sm',
          isExpanded ? 'gap-2' : 'gap-0 justify-center',
          'hover:bg-accent',
          isActive
            ? 'bg-[#3272CF] text-white hover:bg-[#4080E0] font-medium'
            : 'text-muted-foreground'
        )
      }
    >
      {subItem.icon && (
        <span className="flex items-center flex-shrink-0">{subItem.icon}</span>
      )}
      {isExpanded && <span className="whitespace-nowrap">{subItem.label}</span>}
    </NavLink>
  )
})

// Menu item simples memoizado
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  isExpanded,
  onMobileClose,
}: {
  item: MenuItem
  isExpanded: boolean
  onMobileClose: () => void
}) {
  return (
    <NavLink
      to={item.path}
      onClick={onMobileClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
          'hover:bg-accent',
          isActive
            ? 'bg-[#0050C3] text-white hover:bg-[#0066F5]'
            : 'text-foreground/70'
        )
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
    </NavLink>
  )
})

// Menu group memoizado
const MenuGroupComponent = memo(function MenuGroupComponent({
  item,
  isExpanded,
  isOpen,
  onToggle,
  onMobileClose,
}: {
  item: MenuGroup
  isExpanded: boolean
  isOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
          'hover:bg-accent',
          'text-foreground/70'
        )}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {isExpanded && (
          <>
            <span className="whitespace-nowrap">{item.label}</span>
            <ChevronDown
              className={cn(
                'ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-150',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>
      {isOpen && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
          {item.items.map((subItem) => (
            <SubMenuItemLink
              key={subItem.key}
              subItem={subItem}
              isExpanded={isExpanded}
              onMobileClose={onMobileClose}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Desktop Sidebar memoizado separadamente
const DesktopSidebar = memo(function DesktopSidebar({
  isExpanded,
  openGroups,
  onToggleGroup,
  onMobileClose,
  onMouseEnter,
  onMouseLeave,
}: {
  isExpanded: boolean
  openGroups: Set<string>
  onToggleGroup: (key: string) => void
  onMobileClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-background',
        'transition-[width] duration-200 ease-out',
        isExpanded ? 'w-[250px] shadow-lg' : 'w-[80px]'
      )}
      style={{ contain: 'layout style' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0050C3] flex-shrink-0">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap font-semibold text-foreground">
              Z.Ops
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            if (item.type === 'group') {
              return (
                <MenuGroupComponent
                  key={item.key}
                  item={item}
                  isExpanded={isExpanded}
                  isOpen={openGroups.has(item.key)}
                  onToggle={() => onToggleGroup(item.key)}
                  onMobileClose={onMobileClose}
                />
              )
            }
            return (
              <MenuItemComponent
                key={item.key}
                item={item}
                isExpanded={isExpanded}
                onMobileClose={onMobileClose}
              />
            )
          })}
        </div>
      </nav>
    </aside>
  )
})

// Mobile Sidebar memoizado separadamente
const MobileSidebar = memo(function MobileSidebar({
  isOpen: isMobileOpen,
  openGroups,
  onToggleGroup,
  onMobileClose,
}: {
  isOpen: boolean
  openGroups: Set<string>
  onToggleGroup: (key: string) => void
  onMobileClose: () => void
}) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 z-40 flex flex-col border-r border-border bg-background lg:hidden',
        'w-[280px] transition-transform duration-200 ease-out',
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full pointer-events-none'
      )}
      style={{ contain: 'layout style' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0050C3]">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          <span className="font-semibold text-foreground">Z.Ops</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            if (item.type === 'group') {
              const isOpen = openGroups.has(item.key)
              return (
                <div key={item.key}>
                  <button
                    onClick={() => onToggleGroup(item.key)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      'hover:bg-accent',
                      'text-foreground/70'
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-150',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                      {item.items.map((subItem) => (
                        <NavLink
                          key={subItem.key}
                          to={subItem.path}
                          onClick={onMobileClose}
                          end
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                              'hover:bg-accent',
                              isActive
                                ? 'bg-[#3272CF] text-white hover:bg-[#4080E0] font-medium'
                                : 'text-muted-foreground'
                            )
                          }
                        >
                          {subItem.icon && (
                            <span className="flex items-center flex-shrink-0">{subItem.icon}</span>
                          )}
                          <span className="truncate">{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'hover:bg-accent',
                    isActive
                      ? 'bg-[#0050C3] text-white hover:bg-[#0066F5]'
                      : 'text-foreground/70'
                  )
                }
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </aside>
  )
})

// Componente principal
export function Sidebar({ collapsed, onMobileClose }: SidebarProps) {
  const [hovering, setHovering] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(['go-live', 'planejamento', 'logistica'])
  )

  const isExpanded = !collapsed || hovering
  const isMobileOpen = !collapsed

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
  }, [])

  return (
    <>
      <DesktopSidebar
        isExpanded={isExpanded}
        openGroups={openGroups}
        onToggleGroup={toggleGroup}
        onMobileClose={onMobileClose}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <MobileSidebar
        isOpen={isMobileOpen}
        openGroups={openGroups}
        onToggleGroup={toggleGroup}
        onMobileClose={onMobileClose}
      />
    </>
  )
}

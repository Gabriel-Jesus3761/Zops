import { Menu, LogOut, User, ListX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '../theme-toggle'
import { LanguageSelector } from '../language-selector'
import { useAuth } from '@/features/auth'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  onMenuClick: () => void
  onCollapsedClick: () => void
  collapsed: boolean
  isMenuOpen?: boolean
  isSettingsPage?: boolean
}

function HeaderComponent({ onMenuClick, onCollapsedClick, isMenuOpen = false, isSettingsPage = false }: HeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center rounded-lg p-2 text-foreground/70 hover:bg-accent transition-colors duration-150 lg:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isMenuOpen ? (
            <ListX className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={onCollapsedClick}
          className="hidden items-center justify-center rounded-lg p-2 text-foreground/70 hover:bg-accent transition-colors duration-150 lg:flex"
          aria-label={isSettingsPage ? 'Abrir navegação principal' : isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isSettingsPage ? (
            <Menu className="h-5 w-5" />
          ) : isMenuOpen ? (
            <ListX className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent hover:border-[#0050C3] transition-colors duration-150">
              <AvatarFallback className="bg-[#0050C3] text-white text-sm font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || t('common.user')}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'usuario@zops.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t('header.profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('header.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Export without memo to allow re-renders when isMenuOpen changes
export const Header = HeaderComponent

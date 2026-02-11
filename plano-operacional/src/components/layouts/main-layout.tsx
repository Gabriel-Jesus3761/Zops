import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(true)
  const location = useLocation()

  const isSettingsPage = location.pathname.startsWith('/configuracoes')

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const handleMobileClose = useCallback(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setCollapsed(true)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - oculta nas configurações */}
      {!isSettingsPage && (
        <Sidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onMobileClose={handleMobileClose}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={isSettingsPage ? () => setCollapsed(false) : toggleCollapsed}
          onCollapsedClick={isSettingsPage ? () => setCollapsed(false) : toggleCollapsed}
          collapsed={collapsed}
          isMenuOpen={!collapsed && !isSettingsPage}
          isSettingsPage={isSettingsPage}
        />

        <main className={isSettingsPage ? 'flex-1 overflow-y-auto bg-muted' : 'flex-1 overflow-y-auto bg-muted p-6'}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay + Sidebar drawer para configurações */}
      {!collapsed && !isSettingsPage && (
        <div
          className="fixed inset-0 z-30 bg-black/30 animate-in fade-in duration-200 lg:hidden"
          onClick={toggleCollapsed}
        />
      )}

      {/* Sidebar overlay quando em configurações */}
      {isSettingsPage && !collapsed && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 animate-in fade-in duration-200"
            onClick={() => setCollapsed(true)}
          />
          <div className="fixed inset-y-0 left-0 z-[70] flex h-screen">
            <Sidebar
              collapsed={false}
              onCollapsedChange={setCollapsed}
              onMobileClose={() => setCollapsed(true)}
            />
          </div>
        </>
      )}
    </div>
  )
}

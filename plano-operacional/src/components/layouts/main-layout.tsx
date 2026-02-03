import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(true)

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
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onMobileClose={handleMobileClose}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={toggleCollapsed}
          onCollapsedClick={toggleCollapsed}
          collapsed={collapsed}
          isMenuOpen={!collapsed}
        />

        <main className="flex-1 overflow-y-auto bg-muted p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/30 animate-in fade-in duration-200 lg:hidden"
          onClick={toggleCollapsed}
        />
      )}
    </div>
  )
}

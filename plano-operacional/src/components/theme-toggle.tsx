import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-16 rounded-full bg-muted" />
  }

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'

    // Use View Transitions API for smooth crossfade when available
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(newTheme)
      })
    } else {
      setTheme(newTheme)
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex h-8 w-16 items-center rounded-full p-1
        transition-colors duration-300 ease-in-out
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
        ${isDark ? 'bg-secondary' : 'bg-zinc-300'}
      `}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {/* Sun icon */}
      <Sun
        className={`
          absolute left-1.5 h-4 w-4
          transition-opacity duration-300
          ${isDark ? 'text-muted-foreground opacity-40' : 'text-amber-500 opacity-100'}
        `}
      />

      {/* Moon icon */}
      <Moon
        className={`
          absolute right-1.5 h-4 w-4
          transition-opacity duration-300
          ${isDark ? 'text-blue-300 opacity-100' : 'text-muted-foreground opacity-40'}
        `}
      />

      {/* Sliding circle */}
      <span
        className={`
          h-6 w-6 rounded-full bg-white shadow-md
          transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${isDark ? 'translate-x-8' : 'translate-x-0'}
        `}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-zinc-700" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  )
}

import * as React from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollTriggerProps {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number // Pixels do fim da página para disparar
}

/**
 * Componente que dispara onLoadMore quando usuário scrolla até o fim
 * Usa Intersection Observer para performance otimizada
 */
export function InfiniteScrollTrigger({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
}: InfiniteScrollTriggerProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  React.useEffect(() => {
    if (!hasMore || loading) return

    // Criar observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      {
        rootMargin: `${threshold}px`, // Disparar X pixels antes do fim
        threshold: 0.1,
      }
    )

    // Observar elemento
    const currentTrigger = triggerRef.current
    if (currentTrigger) {
      observerRef.current.observe(currentTrigger)
    }

    // Cleanup
    return () => {
      if (observerRef.current && currentTrigger) {
        observerRef.current.unobserve(currentTrigger)
      }
    }
  }, [hasMore, loading, onLoadMore, threshold])

  if (!hasMore) return null

  return (
    <div
      ref={triggerRef}
      className="flex items-center justify-center py-8"
    >
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando mais ativos...</span>
        </div>
      )}
    </div>
  )
}

/**
 * Hook alternativo para infinite scroll
 * Retorna se deve mostrar o trigger
 */
export function useInfiniteScroll(
  hasMore: boolean,
  loading: boolean,
  onLoadMore: () => void
) {
  const [shouldLoad, setShouldLoad] = React.useState(false)

  React.useEffect(() => {
    if (!hasMore || loading) return

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Se está a 300px do fim, carregar mais
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      if (distanceFromBottom < 300 && !shouldLoad) {
        setShouldLoad(true)
        onLoadMore()
      }
    }

    // Throttle do scroll event
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [hasMore, loading, onLoadMore, shouldLoad])

  // Reset quando terminar de carregar
  React.useEffect(() => {
    if (!loading && shouldLoad) {
      setShouldLoad(false)
    }
  }, [loading, shouldLoad])

  return shouldLoad
}

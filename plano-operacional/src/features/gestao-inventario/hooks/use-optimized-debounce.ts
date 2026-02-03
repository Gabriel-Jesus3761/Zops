import * as React from 'react'

/**
 * Hook de debounce otimizado com cleanup automático
 * Evita memory leaks e melhora performance em inputs
 */
export function useOptimizedDebounce<T>(
  value: T,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook de debounce para callbacks
 * Útil para event handlers
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const callbackRef = React.useRef(callback)

  // Manter referência atualizada do callback
  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup na desmontagem
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return React.useMemo(() => {
    return ((...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T
  }, [delay])
}

/**
 * Hook de throttle para limitar frequência de chamadas
 * Útil para scroll handlers, resize, etc.
 */
export function useThrottle<T>(
  value: T,
  interval: number = 300
): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRan = React.useRef<number>(Date.now())

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, interval - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * Hook combinado: debounce + throttle
 * Útil para search que precisa de feedback imediato mas throttle nas requests
 */
export function useDebounceThrottle<T>(
  value: T,
  options: {
    debounceDelay?: number
    throttleInterval?: number
  } = {}
): { debouncedValue: T; throttledValue: T } {
  const { debounceDelay = 300, throttleInterval = 1000 } = options

  const debouncedValue = useOptimizedDebounce(value, debounceDelay)
  const throttledValue = useThrottle(value, throttleInterval)

  return { debouncedValue, throttledValue }
}

import * as React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Lazy loading para componentes pesados
 * Carrega apenas quando necessário, reduzindo bundle inicial
 */

// Lazy load dos modals (code splitting)
const SerialComparison = React.lazy(() =>
  import('./serial-comparison').then((module) => ({
    default: module.SerialComparison,
  }))
)

const BulkActions = React.lazy(() =>
  import('./bulk-actions').then((module) => ({
    default: module.BulkActions,
  }))
)

const BulkDeleteDialog = React.lazy(() =>
  import('./bulk-actions').then((module) => ({
    default: module.BulkDeleteDialog,
  }))
)

// Fallback de loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
)

// Wrappers com Suspense
export const LazySerialComparison = React.memo((props: React.ComponentProps<typeof SerialComparison>) => (
  <React.Suspense fallback={<LoadingFallback />}>
    <SerialComparison {...props} />
  </React.Suspense>
))

LazySerialComparison.displayName = 'LazySerialComparison'

export const LazyBulkActions = React.memo((props: React.ComponentProps<typeof BulkActions>) => (
  <React.Suspense fallback={<LoadingFallback />}>
    <BulkActions {...props} />
  </React.Suspense>
))

LazyBulkActions.displayName = 'LazyBulkActions'

export const LazyBulkDeleteDialog = React.memo((props: React.ComponentProps<typeof BulkDeleteDialog>) => (
  <React.Suspense fallback={<LoadingFallback />}>
    <BulkDeleteDialog {...props} />
  </React.Suspense>
))

LazyBulkDeleteDialog.displayName = 'LazyBulkDeleteDialog'

/**
 * Hook para preload de componentes lazy
 * Útil para precarregar quando usuário passar mouse sobre botão
 */
export function usePreloadComponent(componentName: 'serial' | 'bulk-actions' | 'bulk-delete') {
  const preload = React.useCallback(() => {
    switch (componentName) {
      case 'serial':
        import('./serial-comparison')
        break
      case 'bulk-actions':
        import('./bulk-actions')
        break
      case 'bulk-delete':
        import('./bulk-actions')
        break
    }
  }, [componentName])

  return preload
}

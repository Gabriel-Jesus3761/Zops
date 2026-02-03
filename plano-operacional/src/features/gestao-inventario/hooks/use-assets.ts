import * as React from 'react'
import type { Asset, AssetFilters, FilterOptions } from '../types/asset.types'

interface UseAssetsState {
  data: Asset[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  incompleteCount: number
}

interface UseAssetsReturn extends UseAssetsState {
  loadMore: () => Promise<void>
  reload: () => Promise<void>
  invalidateCache: () => Promise<void>
  patchItems: (items: Asset[]) => void
  isUpdating: boolean
}

const API_URL = 'https://southamerica-east1-zops-mobile.cloudfunctions.net/getAtivos'
const DEFAULT_PAGE_SIZE = 100 // Carrega apenas 100 linhas inicialmente
const LOAD_MORE_SIZE = 50 // Carrega 50 de cada vez ao fazer "load more"

export function useAssets(
  filters: AssetFilters | null,
  options?: {
    pageSize?: number
    loadMoreSize?: number
  }
): UseAssetsReturn {
  const PAGE_SIZE = options?.pageSize || DEFAULT_PAGE_SIZE
  const LOAD_MORE = options?.loadMoreSize || LOAD_MORE_SIZE
  const [state, setState] = React.useState<UseAssetsState>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    totalCount: 0,
    incompleteCount: 0,
  })
  const [isUpdating, setIsUpdating] = React.useState(false)
  const lastDocRef = React.useRef<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const buildWhereClause = React.useCallback((filters: AssetFilters) => {
    const where: Array<{ field: string; operator: string; value: unknown }> = []

    // Text search
    if (filters.q) {
      where.push({ field: 'serialMaquina', operator: '>=', value: filters.q })
      where.push({ field: 'serialMaquina', operator: '<=', value: filters.q + '\uf8ff' })
    }

    // Field filters
    if (filters.where) {
      Object.entries(filters.where).forEach(([field, values]) => {
        if (values && values.length > 0) {
          if (values.length === 1) {
            where.push({ field, operator: '==', value: values[0] })
          } else {
            where.push({ field, operator: 'in', value: values })
          }
        }
      })
    }

    // Incomplete only
    if (filters.incompleteOnly) {
      where.push({ field: 'serialN', operator: '==', value: '' })
    }

    // Transit filter
    if (filters.transitOnly) {
      where.push({ field: 'alocacao', operator: '>=', value: 'OS:' })
    }

    return where
  }, [])

  const fetchAssets = React.useCallback(async (isLoadMore = false) => {
    if (!filters) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      ...(isLoadMore ? {} : { data: [] }),
    }))

    try {
      const where = buildWhereClause(filters)
      const requestData = {
        url: '/ativos',
        where,
        limit: isLoadMore ? LOAD_MORE : PAGE_SIZE, // Usa tamanho apropriado
        ...(isLoadMore && lastDocRef.current && { startAfter: lastDocRef.current }),
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar ativos: ${response.status}`)
      }

      const result = await response.json()
      const newAssets: Asset[] = result.docs.map((doc: { id: string; data: Partial<Asset> }) => ({
        ...doc.data,
        firestoreId: doc.id,
        id: doc.id,
      }))

      // Calculate incomplete count
      const incomplete = newAssets.filter(
        a => !a.serialN || !a.deviceZ
      ).length

      // Verificar se há mais dados: se retornou quantidade completa, provavelmente há mais
      const expectedSize = isLoadMore ? LOAD_MORE : PAGE_SIZE
      const hasMoreData = newAssets.length === expectedSize

      setState(prev => ({
        ...prev,
        data: isLoadMore ? [...prev.data, ...newAssets] : newAssets,
        loading: false,
        hasMore: hasMoreData,
        totalCount: isLoadMore ? prev.totalCount + newAssets.length : newAssets.length,
        incompleteCount: isLoadMore ? prev.incompleteCount + incomplete : incomplete,
      }))

      // Save last doc for pagination
      if (result.lastVisible) {
        lastDocRef.current = result.lastVisible
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }))
    }
  }, [filters, buildWhereClause])

  // Initial load
  React.useEffect(() => {
    if (filters) {
      lastDocRef.current = null
      fetchAssets(false)
    }
  }, [filters, fetchAssets])

  const loadMore = React.useCallback(async () => {
    if (!state.loading && state.hasMore) {
      await fetchAssets(true)
    }
  }, [state.loading, state.hasMore, fetchAssets])

  const reload = React.useCallback(async () => {
    lastDocRef.current = null
    await fetchAssets(false)
  }, [fetchAssets])

  const invalidateCache = React.useCallback(async () => {
    setIsUpdating(true)
    lastDocRef.current = null
    await fetchAssets(false)
    setIsUpdating(false)
  }, [fetchAssets])

  const patchItems = React.useCallback((items: Asset[]) => {
    setState(prev => {
      const itemMap = new Map(items.map(item => [item.firestoreId, item]))
      const updatedData = prev.data.map(asset =>
        itemMap.has(asset.firestoreId) ? { ...asset, ...itemMap.get(asset.firestoreId) } : asset
      )
      return { ...prev, data: updatedData }
    })
  }, [])

  return {
    ...state,
    loadMore,
    reload,
    invalidateCache,
    patchItems,
    isUpdating,
  }
}

// Hook for filter options (facets)
// Busca uma amostra de ativos e extrai valores únicos para usar como filtros
export function useFilterOptions(): {
  options: FilterOptions
  loading: boolean
  reload: () => Promise<void>
} {
  const [options, setOptions] = React.useState<FilterOptions>({
    tipo: [],
    modelo: [],
    adquirencia: [],
    alocacao: [],
    categoria_parque: [],
    subcategoria_parque: [],
    situacao: [],
    detalhamento: [],
  })
  const [loading, setLoading] = React.useState(true)

  const fetchOptions = React.useCallback(async () => {
    setLoading(true)
    try {
      // Busca uma amostra de ativos para extrair valores únicos
      // 1000 é suficiente para capturar a maioria dos valores únicos
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: '/ativos',
          where: [],
          limit: 1000, // Amostra otimizada: rápida mas com boa cobertura
        }),
      })

      if (!response.ok) throw new Error('Falha ao buscar opções')

      const result = await response.json()
      const assets: Asset[] = result.docs.map((doc: { id: string; data: Partial<Asset> }) => ({
        ...doc.data,
        firestoreId: doc.id,
      }))

      // Extrair valores únicos de cada campo
      const uniqueValues: FilterOptions = {
        tipo: [...new Set(assets.map(a => a.tipo).filter((v): v is string => Boolean(v)))].sort(),
        modelo: [...new Set(assets.map(a => a.modelo).filter((v): v is string => Boolean(v)))].sort(),
        adquirencia: [...new Set(assets.map(a => a.adquirencia).filter((v): v is string => Boolean(v)))].sort(),
        alocacao: [...new Set(assets.map(a => a.alocacao).filter((v): v is string => Boolean(v)))].sort(),
        categoria_parque: [...new Set(assets.map(a => a.categoria_parque).filter((v): v is string => Boolean(v)))].sort(),
        subcategoria_parque: [...new Set(assets.map(a => a.subcategoria_parque).filter((v): v is string => Boolean(v)))].sort(),
        situacao: [...new Set(assets.map(a => a.situacao).filter(Boolean))].sort(),
        detalhamento: [...new Set(assets.map(a => a.detalhamento).filter((v): v is string => Boolean(v)))].sort(),
      }

      setOptions(uniqueValues)
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error)
      // Mantém valores vazios se falhar
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return { options, loading, reload: fetchOptions }
}

// Hook for debounced search
export function useDebouncedSearch(
  callback: (value: string) => void,
  delay: number = 300
) {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  return React.useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(value)
      }, delay)
    },
    [callback, delay]
  )
}

// Hook for event lookup with caching
const eventosCache = new Map<string, string | null>()

export function useEventLookup() {
  const extractOSNumber = React.useCallback((alocacao: string): string | null => {
    if (!alocacao) return null

    const patterns = [
      /(?:os|OS)\s*:\s*(\w+)/i,
      /(?:os|OS)\s*(\w+)/i,
      /\b(\d{4,})\b/,
    ]

    for (const pattern of patterns) {
      const match = alocacao.match(pattern)
      if (match?.[1]) {
        return match[1].trim()
      }
    }

    return null
  }, [])

  const fetchEventName = React.useCallback(async (osNumber: string): Promise<string | null> => {
    if (!osNumber) return null

    const cacheKey = osNumber.trim()
    if (eventosCache.has(cacheKey)) {
      return eventosCache.get(cacheKey) ?? null
    }

    try {
      const response = await fetch(
        'https://southamerica-east1-zops-mobile.cloudfunctions.net/getQuerySnapshotNoOrder',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'ordemServico',
            where: [{ field: 'os', operator: '==', value: osNumber.trim() }],
          }),
        }
      )

      if (!response.ok) return null

      const result = await response.json()

      if (result.docs?.length > 0) {
        for (const doc of result.docs) {
          if (String(doc.data?.os).trim() === osNumber.trim()) {
            const eventName = doc.data?.evento || null
            eventosCache.set(cacheKey, eventName)
            return eventName
          }
        }
      }

      eventosCache.set(cacheKey, null)
      return null
    } catch {
      return null
    }
  }, [])

  const formatAllocationWithEvent = React.useCallback(
    async (alocacao: string): Promise<string> => {
      if (!alocacao) return 'Estoque'

      const osNumber = extractOSNumber(alocacao)
      if (!osNumber) return alocacao

      const eventName = await fetchEventName(osNumber)
      if (eventName) {
        return `${eventName} - ${osNumber}`
      }

      return alocacao
    },
    [extractOSNumber, fetchEventName]
  )

  return {
    extractOSNumber,
    fetchEventName,
    formatAllocationWithEvent,
  }
}

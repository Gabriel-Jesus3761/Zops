import * as React from 'react'

interface CacheOptions {
  dbName: string
  storeName: string
  ttl?: number // Time to live em milissegundos
}

interface CachedData<T> {
  data: T
  timestamp: number
  version: number
}

const CURRENT_VERSION = 1

/**
 * Hook para cache persistente com IndexedDB
 * Reduz chamadas à API cachando dados localmente
 */
export function useIndexedDBCache<T>(
  key: string,
  options: CacheOptions = {
    dbName: 'gestao-inventario-cache',
    storeName: 'assets',
    ttl: 5 * 60 * 1000, // 5 minutos default
  }
) {
  const [db, setDb] = React.useState<IDBDatabase | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  // Inicializar IndexedDB
  React.useEffect(() => {
    const openDB = async () => {
      try {
        const request = indexedDB.open(options.dbName, CURRENT_VERSION)

        request.onerror = () => {
          console.error('Erro ao abrir IndexedDB')
          setIsReady(true) // Continuar sem cache
        }

        request.onsuccess = () => {
          setDb(request.result)
          setIsReady(true)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(options.storeName)) {
            db.createObjectStore(options.storeName)
          }
        }
      } catch (error) {
        console.error('IndexedDB não disponível:', error)
        setIsReady(true)
      }
    }

    openDB()

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [options.dbName, options.storeName])

  // Obter dados do cache
  const get = React.useCallback(async (): Promise<T | null> => {
    if (!db || !isReady) return null

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([options.storeName], 'readonly')
        const store = transaction.objectStore(options.storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const cached = request.result as CachedData<T> | undefined

          if (!cached) {
            resolve(null)
            return
          }

          // Verificar se cache expirou
          const now = Date.now()
          const ttl = options.ttl || 5 * 60 * 1000
          if (now - cached.timestamp > ttl) {
            resolve(null)
            return
          }

          // Verificar versão
          if (cached.version !== CURRENT_VERSION) {
            resolve(null)
            return
          }

          resolve(cached.data)
        }

        request.onerror = () => {
          console.error('Erro ao ler cache')
          resolve(null)
        }
      } catch (error) {
        console.error('Erro ao acessar cache:', error)
        resolve(null)
      }
    })
  }, [db, isReady, key, options.storeName, options.ttl])

  // Salvar dados no cache
  const set = React.useCallback(async (data: T): Promise<void> => {
    if (!db || !isReady) return

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([options.storeName], 'readwrite')
        const store = transaction.objectStore(options.storeName)

        const cachedData: CachedData<T> = {
          data,
          timestamp: Date.now(),
          version: CURRENT_VERSION,
        }

        const request = store.put(cachedData, key)

        request.onsuccess = () => resolve()
        request.onerror = () => {
          console.error('Erro ao salvar cache')
          reject(new Error('Failed to save cache'))
        }
      } catch (error) {
        console.error('Erro ao salvar cache:', error)
        reject(error)
      }
    })
  }, [db, isReady, key, options.storeName])

  // Limpar cache específico
  const clear = React.useCallback(async (): Promise<void> => {
    if (!db || !isReady) return

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([options.storeName], 'readwrite')
        const store = transaction.objectStore(options.storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear cache'))
      } catch (error) {
        reject(error)
      }
    })
  }, [db, isReady, key, options.storeName])

  // Limpar todo o cache
  const clearAll = React.useCallback(async (): Promise<void> => {
    if (!db || !isReady) return

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([options.storeName], 'readwrite')
        const store = transaction.objectStore(options.storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear all cache'))
      } catch (error) {
        reject(error)
      }
    })
  }, [db, isReady, options.storeName])

  return {
    get,
    set,
    clear,
    clearAll,
    isReady,
  }
}

/**
 * Hook simplificado para cache de dados com fetch automático
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: Partial<CacheOptions>
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const cache = useIndexedDBCache<T>(key, {
    dbName: 'gestao-inventario-cache',
    storeName: 'assets',
    ttl: 5 * 60 * 1000,
    ...options,
  })

  const load = React.useCallback(async (forceRefresh = false) => {
    if (!cache.isReady) return

    setLoading(true)
    setError(null)

    try {
      // Tentar obter do cache primeiro
      if (!forceRefresh) {
        const cached = await cache.get()
        if (cached) {
          setData(cached)
          setLoading(false)
          return cached
        }
      }

      // Buscar dados frescos
      const freshData = await fetcher()
      setData(freshData)

      // Salvar no cache
      await cache.set(freshData)

      return freshData
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [cache, fetcher])

  // Carregar ao montar
  React.useEffect(() => {
    if (cache.isReady) {
      load()
    }
  }, [cache.isReady])

  const invalidate = React.useCallback(async () => {
    await cache.clear()
    await load(true)
  }, [cache, load])

  return {
    data,
    loading,
    error,
    reload: () => load(true),
    invalidate,
  }
}

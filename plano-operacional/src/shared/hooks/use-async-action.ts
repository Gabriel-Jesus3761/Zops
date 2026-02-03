import * as React from 'react'

interface AsyncActionState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

interface UseAsyncActionReturn<T, Args extends unknown[]> extends AsyncActionState<T> {
  execute: (...args: Args) => Promise<T | null>
  reset: () => void
}

export function useAsyncAction<T, Args extends unknown[] = []>(
  action: (...args: Args) => Promise<T>
): UseAsyncActionReturn<T, Args> {
  const [state, setState] = React.useState<AsyncActionState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const execute = React.useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      })

      try {
        const result = await action(...args)
        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        })
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setState({
          data: null,
          error,
          isLoading: false,
          isSuccess: false,
          isError: true,
        })
        return null
      }
    },
    [action]
  )

  const reset = React.useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface ChartFilters {
  [key: string]: string | null
}

interface ChartFilterContextType {
  interactiveMode: boolean
  setInteractiveMode: (mode: boolean) => void
  chartFilters: ChartFilters
  setChartFilter: (chartKey: string, value: string | null) => void
  clearChartFilters: () => void
  activeFiltersCount: number
}

const ChartFilterContext = createContext<ChartFilterContextType | undefined>(undefined)

export function ChartFilterProvider({ children }: { children: ReactNode }) {
  const [interactiveMode, setInteractiveMode] = useState(false)
  const [chartFilters, setChartFilters] = useState<ChartFilters>({})

  const setChartFilter = (chartKey: string, value: string | null) => {
    setChartFilters((prev) => {
      if (value === null) {
        const { [chartKey]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [chartKey]: value }
    })
  }

  const clearChartFilters = () => {
    setChartFilters({})
  }

  // Limpar filtros quando o modo interativo é desligado
  useEffect(() => {
    if (!interactiveMode) {
      clearChartFilters()
    }
  }, [interactiveMode])

  const activeFiltersCount = Object.keys(chartFilters).length

  return (
    <ChartFilterContext.Provider
      value={{
        interactiveMode,
        setInteractiveMode,
        chartFilters,
        setChartFilter,
        clearChartFilters,
        activeFiltersCount,
      }}
    >
      {children}
    </ChartFilterContext.Provider>
  )
}

export function useChartFilters() {
  const context = useContext(ChartFilterContext)
  if (context === undefined) {
    throw new Error('useChartFilters must be used within a ChartFilterProvider')
  }
  return context
}

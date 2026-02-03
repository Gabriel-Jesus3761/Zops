import { createContext, useContext, useState, type ReactNode } from 'react'
import type { DateFilter, AdvancedFilters } from '../components/dashboard-filters'

interface FilterContextType {
  dateFilter: DateFilter
  advancedFilters: AdvancedFilters
  setFilters: (dateFilter: DateFilter, advancedFilters: AdvancedFilters) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const calcularDatas = (filtro: DateFilter['type']): { startDate: string; endDate: string } => {
  const hoje = new Date()
  const endDate = hoje.toISOString().split('T')[0]

  let diasAtras: number
  switch (filtro) {
    case '7d':
      diasAtras = 6 // 7 dias incluindo hoje
      break
    case '15d':
      diasAtras = 14 // 15 dias incluindo hoje
      break
    case '30d':
      diasAtras = 29 // 30 dias incluindo hoje
      break
    case '90d':
      diasAtras = 89 // 90 dias incluindo hoje
      break
    default:
      diasAtras = 29
  }

  const dataInicio = new Date(hoje)
  dataInicio.setDate(dataInicio.getDate() - diasAtras)
  const startDate = dataInicio.toISOString().split('T')[0]

  return { startDate, endDate }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { startDate, endDate } = calcularDatas('30d')
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: '30d',
    startDate,
    endDate,
  })
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({})

  const setFilters = (newDateFilter: DateFilter, newAdvancedFilters: AdvancedFilters) => {
    setDateFilter(newDateFilter)
    setAdvancedFilters(newAdvancedFilters)
  }

  return (
    <FilterContext.Provider value={{ dateFilter, advancedFilters, setFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

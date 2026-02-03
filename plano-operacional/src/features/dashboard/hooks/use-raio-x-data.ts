import { useQuery } from '@tanstack/react-query'
import { raioXService } from '../services/raio-x.service'

// Helper para gerar período padrão (último mês)
const getDefaultPeriod = () => {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

// Hook para buscar dados gerais (Eventos)
export const useDadosEventos = (startDate?: string, endDate?: string, filtrosExtras?: Record<string, any>) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'eventos', period.startDate, period.endDate, filtrosExtras],
    queryFn: () => raioXService.buscarDadosGerais(period.startDate, period.endDate, 'evento', filtrosExtras),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para buscar dados de Casas
export const useDadosCasas = (startDate?: string, endDate?: string, filtrosExtras?: Record<string, any>) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'casas', period.startDate, period.endDate, filtrosExtras],
    queryFn: () => raioXService.buscarDadosCasas(period.startDate, period.endDate, filtrosExtras),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook para buscar dados ECC
export const useDadosECC = (startDate?: string, endDate?: string, filtrosExtras?: Record<string, any>) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'ecc', period.startDate, period.endDate, filtrosExtras],
    queryFn: () => raioXService.buscarDadosECC(period.startDate, period.endDate, filtrosExtras),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook para buscar dados Report Tech
export const useDadosReportTech = (startDate?: string, endDate?: string) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'reportTech', period.startDate, period.endDate],
    queryFn: () => raioXService.buscarDadosReportTech(period.startDate, period.endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook para buscar dados Reports Interno
export const useDadosReportsInterno = (startDate?: string, endDate?: string) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'reportsInterno', period.startDate, period.endDate],
    queryFn: () => raioXService.buscarDadosReportsInterno(period.startDate, period.endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook para buscar dados Field Ziger
export const useDadosFieldZiger = (startDate?: string, endDate?: string, filtrosExtras?: Record<string, any>) => {
  const period = startDate && endDate ? { startDate, endDate } : getDefaultPeriod()

  return useQuery({
    queryKey: ['raioX', 'fieldZiger', period.startDate, period.endDate, filtrosExtras],
    queryFn: () => raioXService.buscarDadosFieldZiger(period.startDate, period.endDate, filtrosExtras),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

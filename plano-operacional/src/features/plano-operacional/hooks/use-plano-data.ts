import { useState, useEffect, useMemo } from 'react'
import type { PDV, PlanoFilters } from '../types'

// Mock data para demonstração
const mockPDVs: PDV[] = [
  {
    key: 'pdv-001',
    'Ponto de Venda': 'Food Court - Setor A',
    Status: 'Entregue',
    setor: 'Alimentação',
    categoria: 'Food Truck',
    responsavel: 'João Silva',
    dataEntrega: '2024-01-20',
    SERIAIS_FISICOS: ['SN001', 'SN002'],
    equipamentos: [
      { TIPO: 'TERMINAL', MODELO: 'PagSeguro SMART', QUANTIDADE: 2 },
      { TIPO: 'INSUMO', MODELO: 'Carregador USB-C', QUANTIDADE: 2 },
    ],
    totalTerminais: 2,
    carregadores: 2,
    capas: 2,
    cartoes: 10,
    powerbanks: 1,
    tomadas: 0,
  },
  {
    key: 'pdv-002',
    'Ponto de Venda': 'Bar Premium - Setor B',
    Status: 'Pendente',
    setor: 'Bebidas',
    categoria: 'Bar',
    responsavel: 'Maria Santos',
    SERIAIS_FISICOS: [],
    equipamentos: [
      { TIPO: 'TERMINAL', MODELO: 'Mercado Pago Point Pro', QUANTIDADE: 3 },
      { TIPO: 'INSUMO', MODELO: 'Carregador Micro USB', QUANTIDADE: 3 },
    ],
    totalTerminais: 3,
    carregadores: 3,
    capas: 3,
    cartoes: 15,
    powerbanks: 2,
    tomadas: 1,
  },
  {
    key: 'pdv-003',
    'Ponto de Venda': 'Loja de Merchandising - Entrada',
    Status: 'Em Preparação',
    setor: 'Varejo',
    categoria: 'Loja',
    responsavel: 'Carlos Oliveira',
    SERIAIS_FISICOS: ['SN003'],
    equipamentos: [
      { TIPO: 'TERMINAL', MODELO: 'Cielo LIO', QUANTIDADE: 1 },
      { TIPO: 'INSUMO', MODELO: 'Carregador USB-C', QUANTIDADE: 1 },
    ],
    totalTerminais: 1,
    carregadores: 1,
    capas: 1,
    cartoes: 5,
    powerbanks: 1,
    tomadas: 0,
  },
  {
    key: 'pdv-004',
    'Ponto de Venda': 'Cervejaria Artesanal - Setor C',
    Status: 'Entregue',
    setor: 'Bebidas',
    categoria: 'Cervejaria',
    responsavel: 'Ana Costa',
    dataEntrega: '2024-01-21',
    SERIAIS_FISICOS: ['SN004', 'SN005', 'SN006'],
    equipamentos: [
      { TIPO: 'TERMINAL', MODELO: 'Getnet SMART', QUANTIDADE: 3 },
      { TIPO: 'INSUMO', MODELO: 'Carregador USB-C', QUANTIDADE: 3 },
    ],
    totalTerminais: 3,
    carregadores: 3,
    capas: 3,
    cartoes: 20,
    powerbanks: 2,
    tomadas: 1,
  },
  {
    key: 'pdv-005',
    'Ponto de Venda': 'Estoque',
    Status: 'Entregue',
    setor: 'Logística',
    categoria: 'Estoque',
    desativado: false,
    SERIAIS_FISICOS: ['SN007', 'SN008', 'SN009', 'SN010'],
    equipamentos: [
      { TIPO: 'TERMINAL', MODELO: 'PagSeguro SMART', QUANTIDADE: 2 },
      { TIPO: 'TERMINAL', MODELO: 'Mercado Pago Point Pro', QUANTIDADE: 2 },
      { TIPO: 'INSUMO', MODELO: 'Carregador USB-C', QUANTIDADE: 5 },
      { TIPO: 'INSUMO', MODELO: 'Carregador Micro USB', QUANTIDADE: 3 },
    ],
    totalTerminais: 4,
    carregadores: 8,
    capas: 5,
    cartoes: 50,
    powerbanks: 10,
    tomadas: 5,
  },
]

export function usePlanoData(pipeId?: string) {
  const [data, setData] = useState<PDV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Simula carregamento de dados
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Simula delay de API
        await new Promise(resolve => setTimeout(resolve, 500))
        setData(mockPDVs)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [pipeId])

  const refetch = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setData([...mockPDVs])
    setIsLoading(false)
  }

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

export function useFilteredPlanoData(data: PDV[], filters: PlanoFilters) {
  return useMemo(() => {
    let filtered = [...data]

    // Busca por texto
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase()
      filtered = filtered.filter(
        pdv =>
          pdv['Ponto de Venda'].toLowerCase().includes(search) ||
          pdv.setor?.toLowerCase().includes(search) ||
          pdv.categoria?.toLowerCase().includes(search) ||
          pdv.responsavel?.toLowerCase().includes(search)
      )
    }

    // Filtro por status (multi-seleção, inclui "Inativo")
    if (filters.status.length > 0) {
      const includesInactive = filters.status.includes('Inativo')
      const statusFilters = filters.status.filter(status => status !== 'Inativo') as PDVStatus[]

      filtered = filtered.filter(pdv => {
        const matchesInactive = includesInactive && (pdv.desativado || pdv.Status === 'Cancelado')
        const matchesStatus = statusFilters.length > 0 && statusFilters.includes(pdv.Status)
        return matchesInactive || matchesStatus
      })
    }

    // Filtro por setor
    if (filters.setor.length > 0) {
      filtered = filtered.filter(pdv => pdv.setor && filters.setor.includes(pdv.setor))
    }

    // Filtro por categoria
    if (filters.categoria.length > 0) {
      filtered = filtered.filter(pdv => pdv.categoria && filters.categoria.includes(pdv.categoria))
    }

    // Ordena Estoque sempre no final
    filtered.sort((a, b) => {
      const isEstoqueA = a['Ponto de Venda'].toLowerCase() === 'estoque'
      const isEstoqueB = b['Ponto de Venda'].toLowerCase() === 'estoque'
      if (isEstoqueA) return 1
      if (isEstoqueB) return -1
      return 0
    })

    return filtered
  }, [data, filters])
}

import { useState, useEffect, useMemo } from 'react'
import type { EstoqueItem } from '../types'

// Mock data para demonstração
const mockEstoque: EstoqueItem[] = [
  {
    key: 'est-001',
    modelo: 'PagSeguro SMART',
    quantidade: 5,
    tipo: 'TERMINAL',
    disponivel: 5,
    alocado: 2,
  },
  {
    key: 'est-002',
    modelo: 'Mercado Pago Point Pro',
    quantidade: 8,
    tipo: 'TERMINAL',
    disponivel: 6,
    alocado: 2,
  },
  {
    key: 'est-003',
    modelo: 'Cielo LIO',
    quantidade: 3,
    tipo: 'TERMINAL',
    disponivel: 2,
    alocado: 1,
  },
  {
    key: 'est-004',
    modelo: 'Getnet SMART',
    quantidade: 4,
    tipo: 'TERMINAL',
    disponivel: 1,
    alocado: 3,
  },
  {
    key: 'est-005',
    modelo: 'Carregador USB-C',
    quantidade: 25,
    tipo: 'INSUMO',
    disponivel: 14,
    alocado: 11,
  },
  {
    key: 'est-006',
    modelo: 'Carregador Micro USB',
    quantidade: 15,
    tipo: 'INSUMO',
    disponivel: 9,
    alocado: 6,
  },
  {
    key: 'est-007',
    modelo: 'Capa Protetora Universal',
    quantidade: 20,
    tipo: 'INSUMO',
    disponivel: 6,
    alocado: 14,
  },
  {
    key: 'est-008',
    modelo: 'Cartão Cashless RFID',
    quantidade: 200,
    tipo: 'INSUMO',
    disponivel: 100,
    alocado: 100,
  },
  {
    key: 'est-009',
    modelo: 'Powerbank 10000mAh',
    quantidade: 30,
    tipo: 'INSUMO',
    disponivel: 14,
    alocado: 16,
  },
  {
    key: 'est-010',
    modelo: 'Suporte Mesa',
    quantidade: 12,
    tipo: 'INSUMO',
    disponivel: 3,
    alocado: 9,
  },
]

export function useEstoque() {
  const [data, setData] = useState<EstoqueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 300))
        setData(mockEstoque)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const terminais = useMemo(
    () => data.filter(item => item.tipo === 'TERMINAL'),
    [data]
  )

  const insumos = useMemo(
    () => data.filter(item => item.tipo === 'INSUMO'),
    [data]
  )

  const totalTerminais = useMemo(
    () => terminais.reduce((acc, item) => acc + item.quantidade, 0),
    [terminais]
  )

  const totalInsumos = useMemo(
    () => insumos.reduce((acc, item) => acc + item.quantidade, 0),
    [insumos]
  )

  const terminaisDisponiveis = useMemo(
    () => terminais.reduce((acc, item) => acc + (item.disponivel || 0), 0),
    [terminais]
  )

  const insumosDisponiveis = useMemo(
    () => insumos.reduce((acc, item) => acc + (item.disponivel || 0), 0),
    [insumos]
  )

  const alertasBaixoEstoque = useMemo(
    () => data.filter(item => (item.disponivel || 0) < item.quantidade * 0.2).length,
    [data]
  )

  const refetch = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setData([...mockEstoque])
    setIsLoading(false)
  }

  return {
    data,
    terminais,
    insumos,
    totalTerminais,
    totalInsumos,
    terminaisDisponiveis,
    insumosDisponiveis,
    alertasBaixoEstoque,
    isLoading,
    error,
    refetch,
  }
}

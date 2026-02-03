import { useState, useEffect } from 'react'
import type { CCO, CreateCCORequest, EstoqueItem } from '../types'

// Mock data - CCOs de exemplo
const mockCCOs: CCO[] = [
  {
    id: 'cco-001',
    nome: 'CCO Arena Principal',
    localizacao: 'Portão Sul - Arena',
    responsavel: 'Carlos Alberto',
    descricao: 'Centro de controle próximo ao palco principal',
    ativo: true,
    equipamentos: [
      {
        key: 'cco1-001',
        modelo: 'PagSeguro SMART',
        quantidade: 3,
        tipo: 'TERMINAL',
        disponivel: 3,
        alocado: 0,
      },
      {
        key: 'cco1-002',
        modelo: 'Carregador USB-C',
        quantidade: 5,
        tipo: 'INSUMO',
        disponivel: 5,
        alocado: 0,
      },
      {
        key: 'cco1-003',
        modelo: 'Powerbank 10000mAh',
        quantidade: 10,
        tipo: 'INSUMO',
        disponivel: 8,
        alocado: 2,
      },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'Admin',
  },
  {
    id: 'cco-002',
    nome: 'CCO Food Court',
    localizacao: 'Área de Alimentação - Setor B',
    responsavel: 'Marina Silva',
    descricao: 'Suporte para zona de alimentação',
    ativo: true,
    equipamentos: [
      {
        key: 'cco2-001',
        modelo: 'Mercado Pago Point Pro',
        quantidade: 5,
        tipo: 'TERMINAL',
        disponivel: 2,
        alocado: 3,
      },
      {
        key: 'cco2-002',
        modelo: 'Carregador Micro USB',
        quantidade: 6,
        tipo: 'INSUMO',
        disponivel: 4,
        alocado: 2,
      },
      {
        key: 'cco2-003',
        modelo: 'Cartão Cashless RFID',
        quantidade: 100,
        tipo: 'INSUMO',
        disponivel: 65,
        alocado: 35,
      },
    ],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-21'),
    createdBy: 'Admin',
  },
]

export function useCCOs() {
  const [ccos, setCCOs] = useState<CCO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 300))
        setCCOs(mockCCOs)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const createCCO = async (data: CreateCCORequest): Promise<CCO> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newCCO: CCO = {
      id: `cco-${Date.now()}`,
      nome: data.nome,
      localizacao: data.localizacao,
      responsavel: data.responsavel,
      descricao: data.descricao,
      ativo: true,
      equipamentos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'CurrentUser', // Seria pegado do contexto de auth
    }

    setCCOs(prev => [...prev, newCCO])
    return newCCO
  }

  const updateCCO = async (id: string, data: Partial<CreateCCORequest>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    setCCOs(prev =>
      prev.map(cco =>
        cco.id === id
          ? {
              ...cco,
              ...data,
              updatedAt: new Date(),
            }
          : cco
      )
    )
  }

  const deleteCCO = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    setCCOs(prev => prev.filter(cco => cco.id !== id))
  }

  const toggleCCOStatus = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    setCCOs(prev =>
      prev.map(cco =>
        cco.id === id
          ? {
              ...cco,
              ativo: !cco.ativo,
              updatedAt: new Date(),
            }
          : cco
      )
    )
  }

  const addEquipmentToCCO = async (
    ccoId: string,
    equipment: EstoqueItem
  ): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    setCCOs(prev =>
      prev.map(cco =>
        cco.id === ccoId
          ? {
              ...cco,
              equipamentos: [...cco.equipamentos, equipment],
              updatedAt: new Date(),
            }
          : cco
      )
    )
  }

  const removeEquipmentFromCCO = async (
    ccoId: string,
    equipmentKey: string
  ): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    setCCOs(prev =>
      prev.map(cco =>
        cco.id === ccoId
          ? {
              ...cco,
              equipamentos: cco.equipamentos.filter(eq => eq.key !== equipmentKey),
              updatedAt: new Date(),
            }
          : cco
      )
    )
  }

  const refetch = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setCCOs([...mockCCOs])
    setIsLoading(false)
  }

  // Estatísticas agregadas
  const totalCCOs = ccos.length
  const ccosAtivos = ccos.filter(cco => cco.ativo).length
  const totalEquipamentos = ccos.reduce(
    (acc, cco) => acc + cco.equipamentos.reduce((sum, eq) => sum + eq.quantidade, 0),
    0
  )
  const totalTerminais = ccos.reduce(
    (acc, cco) =>
      acc +
      cco.equipamentos
        .filter(eq => eq.tipo === 'TERMINAL')
        .reduce((sum, eq) => sum + eq.quantidade, 0),
    0
  )

  return {
    ccos,
    isLoading,
    error,
    createCCO,
    updateCCO,
    deleteCCO,
    toggleCCOStatus,
    addEquipmentToCCO,
    removeEquipmentFromCCO,
    refetch,
    // Stats
    totalCCOs,
    ccosAtivos,
    totalEquipamentos,
    totalTerminais,
  }
}

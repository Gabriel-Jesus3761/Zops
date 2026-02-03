import { useState, useEffect, useMemo } from 'react'
import type { Comodato, CreateComodatoRequest, DevolucaoComodatoRequest } from '../types'

// Mock data - Comodatos de exemplo
const mockComodatos: Comodato[] = [
  {
    id: 'com-001',
    tecnico: {
      nome: 'João Pedro Santos',
      cpf: '123.456.789-00',
      contato: '(11) 98765-4321',
      setor: 'Logística',
    },
    item: {
      tipo: 'INSUMO',
      modelo: 'Powerbank 10000mAh',
      serial: 'PWB2024001',
      quantidade: 1,
    },
    status: 'Emprestado',
    dataEmprestimo: new Date('2024-01-20'),
    dataPrevistaRetorno: new Date('2024-01-27'),
    observacoes: 'Técnico solicitou para uso durante o turno noturno',
    responsavelEntrega: 'Carlos Silva',
    createdAt: new Date('2024-01-20T08:30:00'),
    updatedAt: new Date('2024-01-20T08:30:00'),
  },
  {
    id: 'com-002',
    tecnico: {
      nome: 'Maria Fernanda Costa',
      cpf: '987.654.321-00',
      contato: '(11) 91234-5678',
      setor: 'Suporte Técnico',
    },
    item: {
      tipo: 'TERMINAL',
      modelo: 'PagSeguro SMART',
      serial: 'PSS2024045',
      quantidade: 1,
    },
    status: 'Devolvido',
    dataEmprestimo: new Date('2024-01-18'),
    dataPrevistaRetorno: new Date('2024-01-25'),
    dataRetorno: new Date('2024-01-24'),
    observacoes: 'Terminal para testes de integração',
    responsavelEntrega: 'Ana Paula',
    responsavelRecebimento: 'Carlos Silva',
    createdAt: new Date('2024-01-18T10:00:00'),
    updatedAt: new Date('2024-01-24T16:45:00'),
  },
  {
    id: 'com-003',
    tecnico: {
      nome: 'Roberto Alves',
      cpf: '456.789.123-00',
      contato: '(11) 97654-3210',
      setor: 'Manutenção',
    },
    item: {
      tipo: 'INSUMO',
      modelo: 'Carregador USB-C',
      quantidade: 2,
    },
    status: 'Atrasado',
    dataEmprestimo: new Date('2024-01-10'),
    dataPrevistaRetorno: new Date('2024-01-17'),
    observacoes: 'Carregadores para backup',
    responsavelEntrega: 'Marina Silva',
    createdAt: new Date('2024-01-10T14:20:00'),
    updatedAt: new Date('2024-01-10T14:20:00'),
  },
  {
    id: 'com-004',
    tecnico: {
      nome: 'Patricia Oliveira',
      cpf: '321.654.987-00',
      contato: '(11) 99876-5432',
      setor: 'Operações',
    },
    item: {
      tipo: 'INSUMO',
      modelo: 'Capa Protetora Universal',
      quantidade: 3,
    },
    status: 'Emprestado',
    dataEmprestimo: new Date('2024-01-22'),
    dataPrevistaRetorno: new Date('2024-01-29'),
    responsavelEntrega: 'Carlos Silva',
    createdAt: new Date('2024-01-22T09:15:00'),
    updatedAt: new Date('2024-01-22T09:15:00'),
  },
]

export function useComodato() {
  const [comodatos, setComodatos] = useState<Comodato[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Atualizar status de atrasados
        const today = new Date()
        const updatedComodatos = mockComodatos.map(com => {
          if (
            com.status === 'Emprestado' &&
            com.dataPrevistaRetorno < today &&
            !com.dataRetorno
          ) {
            return { ...com, status: 'Atrasado' as const }
          }
          return com
        })

        setComodatos(updatedComodatos)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const createComodato = async (data: CreateComodatoRequest): Promise<Comodato> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newComodato: Comodato = {
      id: `com-${Date.now()}`,
      tecnico: {
        nome: data.tecnicoNome,
        cpf: data.tecnicoCpf,
        contato: data.tecnicoContato,
        setor: data.tecnicoSetor,
      },
      item: {
        tipo: data.itemTipo,
        modelo: data.itemModelo,
        serial: data.itemSerial,
        quantidade: data.itemQuantidade,
      },
      status: 'Emprestado',
      dataEmprestimo: new Date(),
      dataPrevistaRetorno: data.dataPrevistaRetorno,
      observacoes: data.observacoes,
      assinaturaTecnico: data.assinaturaTecnico,
      responsavelEntrega: 'CurrentUser', // Seria pegado do contexto de auth
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setComodatos(prev => [newComodato, ...prev])
    return newComodato
  }

  const devolverComodato = async (data: DevolucaoComodatoRequest): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    setComodatos(prev =>
      prev.map(com =>
        com.id === data.comodatoId
          ? {
              ...com,
              status: 'Devolvido' as const,
              dataRetorno: data.dataRetorno,
              assinaturaResponsavel: data.assinaturaResponsavel,
              responsavelRecebimento: 'CurrentUser',
              observacoes: data.observacoes
                ? `${com.observacoes || ''}\nDevolução: ${data.observacoes}`.trim()
                : com.observacoes,
              updatedAt: new Date(),
            }
          : com
      )
    )
  }

  const deleteComodato = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    setComodatos(prev => prev.filter(com => com.id !== id))
  }

  const refetch = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setComodatos([...mockComodatos])
    setIsLoading(false)
  }

  // Estatísticas
  const comodatosAtivos = useMemo(
    () => comodatos.filter(c => c.status === 'Emprestado' || c.status === 'Atrasado'),
    [comodatos]
  )

  const comodatosEmprestados = useMemo(
    () => comodatos.filter(c => c.status === 'Emprestado'),
    [comodatos]
  )

  const comodatosAtrasados = useMemo(
    () => comodatos.filter(c => c.status === 'Atrasado'),
    [comodatos]
  )

  const comodatosDevolvidos = useMemo(
    () => comodatos.filter(c => c.status === 'Devolvido'),
    [comodatos]
  )

  const totalItensEmprestados = useMemo(
    () => comodatosAtivos.reduce((acc, c) => acc + c.item.quantidade, 0),
    [comodatosAtivos]
  )

  return {
    comodatos,
    isLoading,
    error,
    createComodato,
    devolverComodato,
    deleteComodato,
    refetch,
    // Stats
    comodatosAtivos,
    comodatosEmprestados,
    comodatosAtrasados,
    comodatosDevolvidos,
    totalItensEmprestados,
    totalComodatos: comodatos.length,
  }
}

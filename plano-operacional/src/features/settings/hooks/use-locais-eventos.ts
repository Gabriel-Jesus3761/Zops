import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { locaisEventosService } from '../services/locais-eventos.service'
import type { LocalEvento, LocalEventoFormData } from '../types/local-evento'

export function useLocaisEventos() {
  const queryClient = useQueryClient()

  // Listar locais
  const {
    data: locais = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['locais-eventos'],
    queryFn: () => locaisEventosService.getLocais(),
  })

  // Criar local
  const createMutation = useMutation({
    mutationFn: (data: LocalEventoFormData) => locaisEventosService.createLocal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais-eventos'] })
      toast.success('Local cadastrado com sucesso!')
    },
    onError: (error: Error) => {
      if (error.message?.includes('unique') || error.message?.includes('duplicado')) {
        toast.error('Já existe um local com este nome nesta cidade/UF')
      } else {
        toast.error(error.message || 'Erro ao cadastrar local')
      }
    },
  })

  // Atualizar local
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LocalEventoFormData> }) =>
      locaisEventosService.updateLocal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais-eventos'] })
      toast.success('Local atualizado com sucesso!')
    },
    onError: (error: Error) => {
      if (error.message?.includes('unique') || error.message?.includes('duplicado')) {
        toast.error('Já existe um local com este nome nesta cidade/UF')
      } else {
        toast.error(error.message || 'Erro ao atualizar local')
      }
    },
  })

  // Excluir local
  const deleteMutation = useMutation({
    mutationFn: (id: string) => locaisEventosService.deleteLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais-eventos'] })
      toast.success('Local excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir local')
    },
  })

  // Desativar/Ativar local
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      locaisEventosService.toggleActive(id, ativo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locais-eventos'] })
      toast.success(variables.ativo ? 'Local ativado com sucesso!' : 'Local desativado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar status do local')
    },
  })

  // Importar locais em lote
  const importMutation = useMutation({
    mutationFn: (dados: LocalEventoFormData[]) => locaisEventosService.importLocais(dados),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['locais-eventos'] })
      toast.success(`${count} locais importados com sucesso!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao importar locais')
    },
  })

  // Verificar MCOs vinculadas
  const verificarMCOsVinculadas = async (localId: string) => {
    return locaisEventosService.verificarMCOsVinculadas(localId)
  }

  return {
    locais,
    isLoading,
    refetch,
    createLocal: createMutation.mutateAsync,
    updateLocal: updateMutation.mutateAsync,
    deleteLocal: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    importLocais: importMutation.mutateAsync,
    verificarMCOsVinculadas,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isImporting: importMutation.isPending,
  }
}

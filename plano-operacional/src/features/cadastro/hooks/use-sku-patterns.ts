import { useState, useEffect } from 'react'
import type { SkuPattern, PatternItemType } from '../types/sku-pattern'
import { skuPatternsService } from '../services/sku-patterns.service'
import { toast } from 'sonner'

export function useSkuPatterns() {
  const [patterns, setPatterns] = useState<SkuPattern[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar padrões do Firebase
  const loadPatterns = async () => {
    try {
      setLoading(true)
      const data = await skuPatternsService.getAll()
      setPatterns(data)
    } catch (error) {
      console.error('Erro ao carregar padrões:', error)
      toast.error('Erro ao carregar padrões de SKU')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatterns()
  }, [])

  // Adicionar novo padrão
  const addPattern = async (pattern: Omit<SkuPattern, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await skuPatternsService.create(pattern)
      await loadPatterns() // Recarregar lista
      return id
    } catch (error) {
      console.error('Erro ao adicionar padrão:', error)
      toast.error('Erro ao adicionar padrão')
      throw error
    }
  }

  // Atualizar padrão existente
  const updatePattern = async (id: string, updates: Partial<SkuPattern>) => {
    try {
      await skuPatternsService.update(id, updates)
      await loadPatterns() // Recarregar lista
    } catch (error) {
      console.error('Erro ao atualizar padrão:', error)
      toast.error('Erro ao atualizar padrão')
      throw error
    }
  }

  // Deletar padrão
  const deletePattern = async (id: string) => {
    try {
      await skuPatternsService.delete(id)
      await loadPatterns() // Recarregar lista
    } catch (error) {
      console.error('Erro ao deletar padrão:', error)
      toast.error('Erro ao deletar padrão')
      throw error
    }
  }

  // Toggle ativo/inativo
  const toggleActive = async (id: string) => {
    try {
      const pattern = patterns.find(p => p.id === id)
      if (!pattern) return

      await skuPatternsService.update(id, {
        isActive: !pattern.isActive
      })
      await loadPatterns() // Recarregar lista
    } catch (error) {
      console.error('Erro ao alternar status:', error)
      toast.error('Erro ao alternar status')
      throw error
    }
  }

  // Buscar padrões por tipo de item
  const getPatternsByItemType = (itemType: PatternItemType) => {
    return patterns.filter(p => p.itemType === itemType)
  }

  // Buscar padrões ativos por tipo de item
  const getActivePatternsByItemType = (itemType: PatternItemType) => {
    return patterns.filter(p => p.itemType === itemType && p.isActive)
  }

  return {
    patterns,
    loading,
    addPattern,
    updatePattern,
    deletePattern,
    toggleActive,
    getPatternsByItemType,
    getActivePatternsByItemType,
    reload: loadPatterns,
  }
}

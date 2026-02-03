import { useState, useEffect } from 'react'
import type { SkuEquipmentBinding, CreateSkuBindingData, SkuBindingCheckResult } from '../types/sku-equipment-binding'
import { skuBindingsService } from '../services/sku-bindings.service'
import { skuPatternsService } from '../services/sku-patterns.service'
import { generateSku } from '../utils/sku-generator'
import { getItemTypeConfig } from '../constants/default-patterns'

/**
 * Hook para gerenciar vinculações entre SKUs e combinações de equipamentos
 * Permite que múltiplas unidades do mesmo MODELO + ADQUIRÊNCIA compartilhem o mesmo SKU
 */
export function useSkuEquipmentBindings() {
  const [bindings, setBindings] = useState<SkuEquipmentBinding[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar bindings do Firebase na inicialização
  useEffect(() => {
    const loadBindings = async () => {
      try {
        setLoading(true)
        const loadedBindings = await skuBindingsService.getAll()
        setBindings(loadedBindings)
      } catch (error) {
        console.error('Erro ao carregar vinculações SKU:', error)
        setBindings([])
      } finally {
        setLoading(false)
      }
    }

    loadBindings()
  }, [])

  /**
   * Verifica se existe um SKU vinculado para a combinação MODELO + ADQUIRÊNCIA
   */
  const checkBinding = (modelo: string, adquirencia: string): SkuBindingCheckResult => {
    const normalized = {
      modelo: modelo.trim().toUpperCase(),
      adquirencia: adquirencia.trim().toUpperCase(),
    }

    const existing = bindings.find(
      (b) =>
        b.modelo.toUpperCase() === normalized.modelo &&
        b.adquirencia.toUpperCase() === normalized.adquirencia
    )

    if (existing) {
      return {
        exists: true,
        binding: existing,
      }
    }

    return {
      exists: false,
    }
  }

  /**
   * Gera o próximo SKU disponível usando padrões configurados
   */
  const getNextAvailableSku = async (): Promise<string> => {
    try {
      // Buscar padrão ativo para ativo-serializado
      const activePatterns = await skuPatternsService.getActiveByItemType('ativo-serializado')

      if (activePatterns.length === 0) {
        console.warn('Nenhum padrão de SKU ativo encontrado, usando formato padrão')
        // Fallback para formato antigo se não houver padrão configurado
        const currentBindings = await skuBindingsService.getAll()
        const maxNumber = currentBindings.reduce((max: number, binding: SkuEquipmentBinding) => {
          const match = binding.sku.match(/ATS(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            return num > max ? num : max
          }
          return max
        }, 0)
        const nextNumber = maxNumber + 1
        return `ATS${nextNumber.toString().padStart(3, '0')}`
      }

      // Usar o primeiro padrão ativo encontrado
      const pattern = activePatterns[0]
      const itemTypeConfig = getItemTypeConfig('ativo-serializado')

      if (!itemTypeConfig) {
        throw new Error('Configuração de tipo de item não encontrada')
      }

      // Se o padrão tem customCode, usar ele em vez do código padrão
      const configToUse = pattern.customCode
        ? { ...itemTypeConfig, code: pattern.customCode }
        : itemTypeConfig

      // Buscar bindings existentes para determinar o próximo sequencial
      const currentBindings = await skuBindingsService.getAll()

      // Determinar o próximo número sequencial
      // Se houver bindings, extrair o maior número sequencial usado
      let nextSequential = pattern.sequentialStart

      if (currentBindings.length > 0) {
        // Tentar extrair números sequenciais dos SKUs existentes
        const sequentials = currentBindings
          .map(b => {
            // Tentar extrair números do final do SKU
            const match = b.sku.match(/(\d+)$/)
            return match ? parseInt(match[1], 10) : 0
          })
          .filter(n => n > 0)

        if (sequentials.length > 0) {
          const maxSequential = Math.max(...sequentials)
          nextSequential = maxSequential + 1
        }
      }

      // Gerar o SKU usando o padrão configurado (com customCode se existir)
      const generated = generateSku(pattern, configToUse, nextSequential)
      return generated.sku
    } catch (error) {
      console.error('Erro ao gerar próximo SKU:', error)
      // Fallback para formato simples em caso de erro
      return `ATS${Date.now().toString().slice(-3)}`
    }
  }

  /**
   * Adiciona uma nova vinculação SKU-Equipamento
   */
  const addBinding = async (data: CreateSkuBindingData): Promise<SkuEquipmentBinding> => {
    try {
      // Verificar no Firebase se já existe vinculação para este modelo+adquirência
      const existingBinding = await skuBindingsService.getByModeloAdquirencia(data.modelo, data.adquirencia)
      if (existingBinding) {
        throw new Error(`Já existe um SKU vinculado para esta combinação: ${existingBinding.sku}`)
      }

      // Verificar se o SKU já está em uso
      const skuExists = await skuBindingsService.checkSkuExists(data.sku)
      if (skuExists) {
        throw new Error('Este SKU já está em uso para outro equipamento')
      }

      const bindingData = {
        sku: data.sku,
        modelo: data.modelo,
        adquirencia: data.adquirencia,
        tipo: data.tipo,
        quantidade: 1,
      }

      const id = await skuBindingsService.create(bindingData)

      const newBinding: SkuEquipmentBinding = {
        id,
        ...bindingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setBindings((prev) => [...prev, newBinding])
      return newBinding
    } catch (error) {
      console.error('Erro ao adicionar vinculação:', error)
      throw error
    }
  }

  /**
   * Incrementa a quantidade de unidades para uma vinculação existente
   */
  const incrementQuantity = async (bindingId: string): Promise<void> => {
    try {
      const binding = bindings.find((b) => b.id === bindingId)
      if (binding) {
        await skuBindingsService.update(bindingId, {
          quantidade: binding.quantidade + 1,
        })

        setBindings((prev) =>
          prev.map((b) =>
            b.id === bindingId
              ? { ...b, quantidade: b.quantidade + 1, updatedAt: new Date() }
              : b
          )
        )
      }
    } catch (error) {
      console.error('Erro ao incrementar quantidade:', error)
      throw error
    }
  }

  /**
   * Atualiza uma vinculação existente
   */
  const updateBinding = async (bindingId: string, data: Partial<SkuEquipmentBinding>): Promise<void> => {
    try {
      await skuBindingsService.update(bindingId, data)

      setBindings((prev) =>
        prev.map((b) =>
          b.id === bindingId
            ? { ...b, ...data, updatedAt: new Date() }
            : b
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar vinculação:', error)
      throw error
    }
  }

  /**
   * Remove uma vinculação
   */
  const deleteBinding = async (bindingId: string): Promise<void> => {
    try {
      await skuBindingsService.delete(bindingId)
      setBindings((prev) => prev.filter((b) => b.id !== bindingId))
    } catch (error) {
      console.error('Erro ao deletar vinculação:', error)
      throw error
    }
  }

  /**
   * Obtém todas as vinculações
   */
  const getAllBindings = (): SkuEquipmentBinding[] => {
    return bindings
  }

  /**
   * Busca uma vinculação por SKU
   */
  const getBindingBySku = (sku: string): SkuEquipmentBinding | undefined => {
    return bindings.find((b) => b.sku === sku)
  }

  return {
    bindings,
    loading,
    checkBinding,
    addBinding,
    incrementQuantity,
    updateBinding,
    deleteBinding,
    getAllBindings,
    getBindingBySku,
    getNextAvailableSku,
  }
}

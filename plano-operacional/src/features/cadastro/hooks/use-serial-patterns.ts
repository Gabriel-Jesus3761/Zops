import { useState, useEffect } from 'react'
import type { SerialPattern, SerialDetectionResult, CustomOptions } from '../types/serial-pattern'
import { serialPatternsService } from '../services/serial-patterns.service'
import { customOptionsService } from '../services/custom-options.service'

export function useSerialPatterns() {
  const [patterns, setPatterns] = useState<SerialPattern[]>([])
  const [customOptions, setCustomOptions] = useState<CustomOptions>({
    tipos: [],
    modelos: [],
    adquirencias: [],
  })
  const [loading, setLoading] = useState(true)

  // Carregar padrões e opções do Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Carregar padrões
        const loadedPatterns = await serialPatternsService.getAll()
        setPatterns(loadedPatterns)

        // Carregar opções personalizadas
        const loadedOptions = await customOptionsService.getAll()

        // Mesclar com opções extraídas dos padrões
        const tipos = [...new Set([...loadedOptions.tipos, ...loadedPatterns.map(p => p.tipo).filter(Boolean)])].sort()
        const modelos = [...new Set([...loadedOptions.modelos, ...loadedPatterns.map(p => p.modelo).filter(Boolean)])].sort()
        const adquirencias = [...new Set([...loadedOptions.adquirencias, ...loadedPatterns.map(p => p.adquirencia).filter(Boolean)])].sort()

        setCustomOptions({
          tipos,
          modelos,
          adquirencias,
        })
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setPatterns([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Salvar opções personalizadas no Firebase
  const saveCustomOptions = async (options: CustomOptions) => {
    try {
      setCustomOptions(options)
      await customOptionsService.saveAll(options)
    } catch (error) {
      console.error('Erro ao salvar opções personalizadas:', error)
    }
  }

  // Adicionar novo padrão
  const addPattern = async (pattern: Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await serialPatternsService.create(pattern)
      const newPattern: SerialPattern = {
        ...pattern,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedPatterns = [...patterns, newPattern]
      setPatterns(updatedPatterns)
      await updateOptionsFromPatterns(updatedPatterns)
      return newPattern
    } catch (error) {
      console.error('Erro ao adicionar padrão:', error)
      throw error
    }
  }

  // Atualizar padrão existente
  const updatePattern = async (id: string, updates: Partial<SerialPattern>) => {
    try {
      await serialPatternsService.update(id, updates)
      const newPatterns = patterns.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date() }
          : p
      )
      setPatterns(newPatterns)
      await updateOptionsFromPatterns(newPatterns)
    } catch (error) {
      console.error('Erro ao atualizar padrão:', error)
      throw error
    }
  }

  // Deletar padrão
  const deletePattern = async (id: string) => {
    try {
      await serialPatternsService.delete(id)
      const newPatterns = patterns.filter(p => p.id !== id)
      setPatterns(newPatterns)
      await updateOptionsFromPatterns(newPatterns)
    } catch (error) {
      console.error('Erro ao deletar padrão:', error)
      throw error
    }
  }

  // Toggle ativo/inativo
  const toggleActive = async (id: string) => {
    const pattern = patterns.find(p => p.id === id)
    if (pattern) {
      await updatePattern(id, {
        ativo: !pattern.ativo
      })
    }
  }

  // Atualizar opções baseadas nos padrões
  const updateOptionsFromPatterns = async (currentPatterns: SerialPattern[]) => {
    const tipos = [...new Set(currentPatterns.map(p => p.tipo).filter(Boolean))].sort()
    const modelos = [...new Set(currentPatterns.map(p => p.modelo).filter(Boolean))].sort()
    const adquirencias = [...new Set(currentPatterns.map(p => p.adquirencia).filter(Boolean))].sort()

    // Manter opções personalizadas que não estão nos padrões
    const newOptions: CustomOptions = {
      tipos: [...new Set([...customOptions.tipos, ...tipos])].sort(),
      modelos: [...new Set([...customOptions.modelos, ...modelos])].sort(),
      adquirencias: [...new Set([...customOptions.adquirencias, ...adquirencias])].sort(),
    }

    await saveCustomOptions(newOptions)
  }

  // Adicionar opção personalizada
  const addCustomOption = async (type: 'tipos' | 'modelos' | 'adquirencias', value: string) => {
    if (!value || value.trim() === '') return

    const valorTrimado = value.trim()

    if (!customOptions[type].includes(valorTrimado)) {
      const newOptions = {
        ...customOptions,
        [type]: [...customOptions[type], valorTrimado].sort()
      }
      await saveCustomOptions(newOptions)
    }
  }

  // Detectar padrão baseado no número de série
  const detectPattern = (serialNumber: string): SerialDetectionResult => {
    if (!serialNumber || serialNumber.trim() === '') {
      return {
        found: false,
        confidence: 0,
        needsValidation: true,
      }
    }

    const serial = serialNumber.trim().toUpperCase()

    // Buscar padrões ativos que correspondam ao prefixo
    const activePatterns = patterns.filter(p => p.ativo)

    for (const pattern of activePatterns) {
      if (pattern.prefixo && serial.startsWith(pattern.prefixo.toUpperCase())) {
        return {
          found: true,
          pattern,
          confidence: 100,
          needsValidation: pattern.needsValidation,
          suggestedValues: {
            tipo: pattern.tipo,
            modelo: pattern.modelo,
            adquirencia: pattern.adquirencia,
          }
        }
      }
    }

    // Nenhum padrão encontrado
    return {
      found: false,
      confidence: 0,
      needsValidation: true,
    }
  }

  // Buscar padrões ativos
  const getActivePatterns = () => {
    return patterns.filter(p => p.ativo)
  }

  // Obter todas as opções disponíveis
  const getAllOptions = () => {
    return customOptions
  }

  // Recarregar opções personalizadas do Firebase
  const reloadCustomOptions = async () => {
    try {
      const loadedOptions = await customOptionsService.getAll()
      const loadedPatterns = await serialPatternsService.getAll()

      // Mesclar com opções extraídas dos padrões
      const tipos = [...new Set([...loadedOptions.tipos, ...loadedPatterns.map(p => p.tipo).filter(Boolean)])].sort()
      const modelos = [...new Set([...loadedOptions.modelos, ...loadedPatterns.map(p => p.modelo).filter(Boolean)])].sort()
      const adquirencias = [...new Set([...loadedOptions.adquirencias, ...loadedPatterns.map(p => p.adquirencia).filter(Boolean)])].sort()

      setCustomOptions({
        tipos,
        modelos,
        adquirencias,
      })

      setPatterns(loadedPatterns)
    } catch (error) {
      console.error('Erro ao recarregar opções:', error)
      throw error
    }
  }

  return {
    patterns,
    customOptions,
    loading,
    addPattern,
    updatePattern,
    deletePattern,
    toggleActive,
    detectPattern,
    getActivePatterns,
    getAllOptions,
    addCustomOption,
    reloadCustomOptions,
  }
}

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { CustomOptions } from '../types/serial-pattern'

const COLLECTION_NAME = 'ListaDeTipoModeloAdquirencia'
const DOCUMENT_ID = 'opcoes'

export const customOptionsService = {
  /**
   * Busca todas as opções personalizadas
   */
  async getAll(): Promise<CustomOptions> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as CustomOptions
        return {
          tipos: data.tipos || [],
          modelos: data.modelos || [],
          adquirencias: data.adquirencias || [],
        }
      }

      // Se não existir, retornar vazio
      return {
        tipos: [],
        modelos: [],
        adquirencias: [],
      }
    } catch (error) {
      console.error('Erro ao buscar opções personalizadas:', error)
      return {
        tipos: [],
        modelos: [],
        adquirencias: [],
      }
    }
  },

  /**
   * Salva todas as opções personalizadas
   */
  async saveAll(options: CustomOptions): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID)
      await setDoc(docRef, options, { merge: true })
    } catch (error) {
      console.error('Erro ao salvar opções personalizadas:', error)
      throw new Error('Falha ao salvar opções personalizadas')
    }
  },

  /**
   * Adiciona uma nova opção a um tipo específico
   */
  async addOption(type: 'tipos' | 'modelos' | 'adquirencias', value: string): Promise<void> {
    try {
      const currentOptions = await this.getAll()

      // Verificar se já existe
      if (!currentOptions[type].includes(value.trim())) {
        const updatedOptions = {
          ...currentOptions,
          [type]: [...currentOptions[type], value.trim()].sort(),
        }
        await this.saveAll(updatedOptions)
      }
    } catch (error) {
      console.error('Erro ao adicionar opção:', error)
      throw new Error('Falha ao adicionar opção')
    }
  },

  /**
   * Remove uma opção de um tipo específico
   */
  async removeOption(type: 'tipos' | 'modelos' | 'adquirencias', value: string): Promise<void> {
    try {
      const currentOptions = await this.getAll()
      const updatedOptions = {
        ...currentOptions,
        [type]: currentOptions[type].filter(item => item !== value),
      }
      await this.saveAll(updatedOptions)
    } catch (error) {
      console.error('Erro ao remover opção:', error)
      throw new Error('Falha ao remover opção')
    }
  },
}

import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { SkuPattern, PatternItemType } from '../types/sku-pattern'

const COLLECTION_NAME = 'PadroesDeSKU'

// Interface para dados no Firebase (com Timestamp)
interface SkuPatternFirebase extends Omit<SkuPattern, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const skuPatternsService = {
  /**
   * Cria um novo padrão de SKU
   */
  async create(pattern: Omit<SkuPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...pattern,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar padrão de SKU:', error)
      throw new Error('Falha ao criar padrão de SKU')
    }
  },

  /**
   * Busca todos os padrões de SKU
   */
  async getAll(): Promise<SkuPattern[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const patterns: SkuPattern[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SkuPatternFirebase
        patterns.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return patterns
    } catch (error) {
      console.error('Erro ao buscar padrões de SKU:', error)
      throw new Error('Falha ao buscar padrões de SKU')
    }
  },

  /**
   * Busca um padrão de SKU por ID
   */
  async getById(id: string): Promise<SkuPattern | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as SkuPatternFirebase
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar padrão de SKU:', error)
      throw new Error('Falha ao buscar padrão de SKU')
    }
  },

  /**
   * Busca padrões ativos
   * Nota: Busca todos e filtra em memória para evitar necessidade de índice composto
   */
  async getActive(): Promise<SkuPattern[]> {
    try {
      // Buscar todos os padrões e filtrar em memória para evitar índice composto
      const allPatterns = await this.getAll()
      return allPatterns.filter(p => p.isActive)
    } catch (error) {
      console.error('Erro ao buscar padrões ativos:', error)
      throw new Error('Falha ao buscar padrões ativos')
    }
  },

  /**
   * Busca padrões por tipo de item
   * Nota: Busca todos e filtra em memória para evitar necessidade de índice composto
   */
  async getByItemType(itemType: PatternItemType): Promise<SkuPattern[]> {
    try {
      const allPatterns = await this.getAll()
      return allPatterns.filter(p => p.itemType === itemType)
    } catch (error) {
      console.error('Erro ao buscar padrões por tipo:', error)
      throw new Error('Falha ao buscar padrões por tipo')
    }
  },

  /**
   * Busca padrões ativos por tipo de item
   * Nota: Busca todos e filtra em memória para evitar necessidade de índice composto
   */
  async getActiveByItemType(itemType: PatternItemType): Promise<SkuPattern[]> {
    try {
      const allPatterns = await this.getAll()
      return allPatterns.filter(p => p.itemType === itemType && p.isActive)
    } catch (error) {
      console.error('Erro ao buscar padrões ativos por tipo:', error)
      throw new Error('Falha ao buscar padrões ativos por tipo')
    }
  },

  /**
   * Atualiza um padrão de SKU
   */
  async update(id: string, pattern: Partial<SkuPattern>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...pattern,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Erro ao atualizar padrão de SKU:', error)
      throw new Error('Falha ao atualizar padrão de SKU')
    }
  },

  /**
   * Remove um padrão de SKU
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erro ao remover padrão de SKU:', error)
      throw new Error('Falha ao remover padrão de SKU')
    }
  },

  /**
   * Verifica se já existe um padrão ativo para o tipo de item
   * Nota: Busca todos e filtra em memória para evitar necessidade de índice composto
   */
  async checkActivePatternExists(itemType: PatternItemType, excludeId?: string): Promise<boolean> {
    try {
      const allPatterns = await this.getAll()
      const activePatterns = allPatterns.filter(p => p.itemType === itemType && p.isActive)

      if (activePatterns.length === 0) {
        return false
      }

      // Se excludeId for fornecido, ignorar o documento com esse ID
      if (excludeId) {
        return activePatterns.some((p) => p.id !== excludeId)
      }

      return true
    } catch (error) {
      console.error('Erro ao verificar padrão ativo:', error)
      return false
    }
  },
}

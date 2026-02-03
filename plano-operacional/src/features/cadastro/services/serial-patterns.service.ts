import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { SerialPattern } from '../types/serial-pattern'

const COLLECTION_NAME = 'PadroesDeSeriais'

// Interface para dados no Firebase (com Timestamp)
interface SerialPatternFirebase extends Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const serialPatternsService = {
  /**
   * Cria um novo padrão de serial
   */
  async create(pattern: Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...pattern,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar padrão de serial:', error)
      throw new Error('Falha ao criar padrão de serial')
    }
  },

  /**
   * Busca todos os padrões de serial
   */
  async getAll(): Promise<SerialPattern[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const patterns: SerialPattern[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SerialPatternFirebase
        patterns.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return patterns
    } catch (error) {
      console.error('Erro ao buscar padrões de serial:', error)
      throw new Error('Falha ao buscar padrões de serial')
    }
  },

  /**
   * Busca um padrão de serial por ID
   */
  async getById(id: string): Promise<SerialPattern | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as SerialPatternFirebase
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar padrão de serial:', error)
      throw new Error('Falha ao buscar padrão de serial')
    }
  },

  /**
   * Busca padrões ativos
   */
  async getActive(): Promise<SerialPattern[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ativo', '==', true),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const patterns: SerialPattern[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SerialPatternFirebase
        patterns.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return patterns
    } catch (error) {
      console.error('Erro ao buscar padrões ativos:', error)
      throw new Error('Falha ao buscar padrões ativos')
    }
  },

  /**
   * Atualiza um padrão de serial
   */
  async update(id: string, pattern: Partial<SerialPattern>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...pattern,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Erro ao atualizar padrão de serial:', error)
      throw new Error('Falha ao atualizar padrão de serial')
    }
  },

  /**
   * Remove um padrão de serial
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erro ao remover padrão de serial:', error)
      throw new Error('Falha ao remover padrão de serial')
    }
  },

  /**
   * Verifica se um prefixo já existe
   */
  async checkPrefixExists(prefixo: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('prefixo', '==', prefixo.toUpperCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return false
      }

      // Se excludeId for fornecido, ignorar o documento com esse ID
      if (excludeId) {
        return querySnapshot.docs.some((doc) => doc.id !== excludeId)
      }

      return true
    } catch (error) {
      console.error('Erro ao verificar prefixo:', error)
      return false
    }
  },
}

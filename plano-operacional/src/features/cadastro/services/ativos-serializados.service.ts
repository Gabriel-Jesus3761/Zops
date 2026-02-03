import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { AtivoSerializado } from '../types'

const COLLECTION_NAME = 'AtivosSerializados'

export interface AtivoSerializadoFirebase extends Omit<AtivoSerializado, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Serviço para gerenciar ativos serializados no Firebase
 */
export const ativosSerializadosService = {
  /**
   * Cria um novo ativo serializado no Firebase
   */
  async create(ativo: Omit<AtivoSerializado, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...ativo,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar ativo serializado:', error)
      throw new Error('Falha ao cadastrar ativo serializado')
    }
  },

  /**
   * Lista todos os ativos serializados
   */
  async getAll(): Promise<AtivoSerializado[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const ativos: AtivoSerializado[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as AtivoSerializadoFirebase
        ativos.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return ativos
    } catch (error) {
      console.error('Erro ao listar ativos serializados:', error)
      throw new Error('Falha ao carregar ativos serializados')
    }
  },

  /**
   * Busca um ativo serializado por ID
   */
  async getById(id: string): Promise<AtivoSerializado | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as AtivoSerializadoFirebase
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar ativo serializado:', error)
      throw new Error('Falha ao buscar ativo serializado')
    }
  },

  /**
   * Busca ativos por SKU
   */
  async getBySku(sku: string): Promise<AtivoSerializado[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('sku', '==', sku),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const ativos: AtivoSerializado[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as AtivoSerializadoFirebase
        ativos.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return ativos
    } catch (error) {
      console.error('Erro ao buscar ativos por SKU:', error)
      throw new Error('Falha ao buscar ativos por SKU')
    }
  },

  /**
   * Atualiza um ativo serializado
   */
  async update(id: string, ativo: Partial<AtivoSerializado>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...ativo,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Erro ao atualizar ativo serializado:', error)
      throw new Error('Falha ao atualizar ativo serializado')
    }
  },

  /**
   * Remove um ativo serializado
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erro ao remover ativo serializado:', error)
      throw new Error('Falha ao remover ativo serializado')
    }
  },

  /**
   * Verifica se um número de série já existe
   */
  async checkSerialExists(numeroSerie: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('numeroSerie', '==', numeroSerie))
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
      console.error('Erro ao verificar serial:', error)
      return false
    }
  },
}

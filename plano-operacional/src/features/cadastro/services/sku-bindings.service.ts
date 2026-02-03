import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { SkuEquipmentBinding } from '../types/sku-equipment-binding'

const COLLECTION_NAME = 'VinculacoesSkuEquipamento'

// Interface para dados no Firebase (com Timestamp)
interface SkuBindingFirebase extends Omit<SkuEquipmentBinding, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const skuBindingsService = {
  /**
   * Cria uma nova vinculação SKU-Equipamento
   */
  async create(binding: Omit<SkuEquipmentBinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...binding,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar vinculação SKU:', error)
      throw new Error('Falha ao criar vinculação SKU')
    }
  },

  /**
   * Busca todas as vinculações
   */
  async getAll(): Promise<SkuEquipmentBinding[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const bindings: SkuEquipmentBinding[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SkuBindingFirebase
        bindings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return bindings
    } catch (error) {
      console.error('Erro ao buscar vinculações SKU:', error)
      throw new Error('Falha ao buscar vinculações SKU')
    }
  },

  /**
   * Busca uma vinculação por ID
   */
  async getById(id: string): Promise<SkuEquipmentBinding | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as SkuBindingFirebase
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar vinculação SKU:', error)
      throw new Error('Falha ao buscar vinculação SKU')
    }
  },

  /**
   * Busca vinculação por SKU
   */
  async getBySku(sku: string): Promise<SkuEquipmentBinding | null> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('sku', '==', sku))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data() as SkuBindingFirebase
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      }
    } catch (error) {
      console.error('Erro ao buscar vinculação por SKU:', error)
      throw new Error('Falha ao buscar vinculação por SKU')
    }
  },

  /**
   * Busca vinculação por modelo e adquirência
   */
  async getByModeloAdquirencia(modelo: string, adquirencia: string): Promise<SkuEquipmentBinding | null> {
    try {
      const normalizedModelo = modelo.trim().toUpperCase()
      const normalizedAdquirencia = adquirencia.trim().toUpperCase()

      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)

      // Buscar manualmente pois a comparação case-insensitive não é nativa no Firestore
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SkuBindingFirebase
        if (
          data.modelo.toUpperCase() === normalizedModelo &&
          data.adquirencia.toUpperCase() === normalizedAdquirencia
        ) {
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          }
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar vinculação por modelo/adquirência:', error)
      throw new Error('Falha ao buscar vinculação por modelo/adquirência')
    }
  },

  /**
   * Atualiza uma vinculação
   */
  async update(id: string, binding: Partial<SkuEquipmentBinding>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...binding,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Erro ao atualizar vinculação SKU:', error)
      throw new Error('Falha ao atualizar vinculação SKU')
    }
  },

  /**
   * Remove uma vinculação
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erro ao remover vinculação SKU:', error)
      throw new Error('Falha ao remover vinculação SKU')
    }
  },

  /**
   * Verifica se um SKU já existe
   */
  async checkSkuExists(sku: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('sku', '==', sku))
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
      console.error('Erro ao verificar SKU:', error)
      return false
    }
  },
}

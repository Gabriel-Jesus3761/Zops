import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { MCO } from '../types/mco.types'

const MCO_COLLECTION = 'mcos'

export const mcoService = {
  // Listar todas as MCOs
  async listarMCOs(): Promise<MCO[]> {
    try {
      const q = query(
        collection(db, MCO_COLLECTION),
        orderBy('updated_at', 'desc')
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Converter Timestamps do Firebase para strings
          updated_at: data.updated_at instanceof Timestamp
            ? data.updated_at.toDate().toISOString()
            : data.updated_at
        } as MCO
      })
    } catch (error) {
      console.error('Erro ao listar MCOs:', error)
      throw error
    }
  },

  // Buscar MCO por ID
  async buscarMCO(id: string): Promise<MCO | null> {
    try {
      const docRef = doc(db, MCO_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          updated_at: data.updated_at instanceof Timestamp
            ? data.updated_at.toDate().toISOString()
            : data.updated_at
        } as MCO
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar MCO:', error)
      throw error
    }
  },

  // Criar nova MCO
  async criarMCO(mco: Omit<MCO, 'id' | 'updated_at'>): Promise<MCO> {
    try {
      const now = Timestamp.now()

      const docRef = await addDoc(collection(db, MCO_COLLECTION), {
        ...mco,
        updated_at: now,
        created_at: now
      })

      return {
        id: docRef.id,
        ...mco,
        updated_at: now.toDate().toISOString()
      }
    } catch (error) {
      console.error('Erro ao criar MCO:', error)
      throw error
    }
  },

  // Atualizar MCO
  async atualizarMCO(id: string, dados: Partial<MCO>): Promise<void> {
    try {
      const mcoRef = doc(db, MCO_COLLECTION, id)
      await updateDoc(mcoRef, {
        ...dados,
        updated_at: Timestamp.now()
      })
    } catch (error) {
      console.error('Erro ao atualizar MCO:', error)
      throw error
    }
  },

  // Deletar MCO
  async deletarMCO(id: string): Promise<void> {
    try {
      const mcoRef = doc(db, MCO_COLLECTION, id)
      await deleteDoc(mcoRef)
    } catch (error) {
      console.error('Erro ao deletar MCO:', error)
      throw error
    }
  },

  // Aprovar MCO
  async aprovarMCO(id: string): Promise<void> {
    try {
      await this.atualizarMCO(id, { status: 'aprovado' })
    } catch (error) {
      console.error('Erro ao aprovar MCO:', error)
      throw error
    }
  },

  // Rejeitar MCO
  async rejeitarMCO(id: string): Promise<void> {
    try {
      await this.atualizarMCO(id, { status: 'rejeitado' })
    } catch (error) {
      console.error('Erro ao rejeitar MCO:', error)
      throw error
    }
  }
}

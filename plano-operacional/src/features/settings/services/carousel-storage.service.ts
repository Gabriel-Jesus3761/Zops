import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage'
import { storage } from '@/config/firebase'
import type { LoginCarouselImage } from '../types/appearance'

// Cache em memória para evitar chamadas duplicadas (React Strict Mode / re-renders)
let cachedImages: LoginCarouselImage[] | null = null
let cachePromise: Promise<LoginCarouselImage[]> | null = null

export class CarouselStorageService {
  private static readonly STORAGE_PATH = 'login-carousel'

  /**
   * Lista todas as imagens da pasta login-carousel/ no Firebase Storage.
   * Usa cache em memória para evitar requests duplicados.
   * Retorna objetos completos (url, id, storagePath) com uma única chamada listAll + getDownloadURL.
   */
  static async listImages(): Promise<LoginCarouselImage[]> {
    // Retorna cache se disponível
    if (cachedImages) return cachedImages

    // Se já tem uma promise em andamento, aguarda ela (evita chamadas duplicadas)
    if (cachePromise) return cachePromise

    cachePromise = this.fetchImages()
    const result = await cachePromise
    cachedImages = result
    cachePromise = null
    return result
  }

  private static async fetchImages(): Promise<LoginCarouselImage[]> {
    try {
      const folderRef = ref(storage, this.STORAGE_PATH)
      const result = await listAll(folderRef)

      if (result.items.length === 0) return []

      const images = await Promise.all(
        result.items.map(async (itemRef) => {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef),
          ])
          return {
            id: itemRef.name,
            url,
            storagePath: itemRef.fullPath,
            fileName: metadata.customMetadata?.originalName || itemRef.name,
            size: metadata.size,
            addedAt: metadata.customMetadata?.uploadedAt || metadata.timeCreated,
          } satisfies LoginCarouselImage
        })
      )

      return images
    } catch (error) {
      console.error('Erro ao listar imagens do carrossel:', error)
      return []
    }
  }

  /** Invalida o cache (chamado após upload ou delete) */
  static invalidateCache() {
    cachedImages = null
    cachePromise = null
  }

  static async uploadImage(file: File, imageId: string): Promise<LoginCarouselImage> {
    try {
      // ⚠️ TEMPORÁRIO: Auth check comentado para desenvolvimento
      // TODO: Descomentar quando Cloud Function retornar Firebase Custom Token
      // Ver: plano-operacional/SEGURANCA_PRODUCAO.md

      // const currentUser = auth.currentUser
      // if (!currentUser) {
      //   throw new Error('Usuário não autenticado. Faça login para fazer upload de imagens.')
      // }

      const storagePath = `${this.STORAGE_PATH}/${imageId}`
      const storageRef = ref(storage, storagePath)

      console.log('⚠️ [DEV] Fazendo upload para:', storagePath, '(auth temporariamente desabilitada)')

      // Upload do arquivo
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'dev-mode', // currentUser?.uid || 'anonymous'
        },
      })

      // Obter URL pública
      const url = await getDownloadURL(storageRef)

      const image: LoginCarouselImage = {
        id: imageId,
        url,
        storagePath,
        fileName: file.name,
        size: file.size,
        addedAt: new Date().toISOString(),
      }

      this.invalidateCache()
      return image
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload da imagem:', error)

      // Mensagens de erro mais específicas e intuitivas
      if (error.code === 'storage/unauthorized') {
        throw new Error('Acesso negado ao armazenamento. Verifique suas permissões ou entre em contato com o administrador.')
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Limite de armazenamento atingido. Entre em contato com o administrador para aumentar o espaço.')
      } else if (error.code === 'storage/invalid-format') {
        throw new Error('Formato de arquivo inválido. Use apenas JPEG, PNG ou WebP.')
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Tempo esgotado para upload. Verifique sua conexão com a internet.')
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload cancelado.')
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.')
      }

      // Erro genérico mais amigável
      throw new Error('Não foi possível enviar a imagem. Tente novamente em alguns instantes.')
    }
  }

  static async deleteImage(storagePath: string): Promise<void> {
    try {
      // Validar que o path não está vazio
      if (!storagePath || storagePath.trim() === '') {
        console.error('Storage path vazio:', storagePath)
        return // Não falhar, apenas retornar
      }

      const storageRef = ref(storage, storagePath)
      await deleteObject(storageRef)
      this.invalidateCache()
    } catch (error) {
      console.error('Erro ao deletar imagem:', error)
      // Não lançar erro, apenas logar para não bloquear a UI
    }
  }
}

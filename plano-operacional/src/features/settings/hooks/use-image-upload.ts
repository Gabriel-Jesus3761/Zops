import { useState, useCallback, useEffect, useRef } from 'react'
import type { LoginCarouselImage } from '../types/appearance'
import { CAROUSEL_CONSTRAINTS } from '../types/appearance'
import { processImage } from '../utils/image-processor'
import { CarouselStorageService } from '../services/carousel-storage.service'

interface UseImageUploadReturn {
  isProcessing: boolean
  error: string | null
  processFile: (file: File) => Promise<LoginCarouselImage | null>
  clearError: () => void
}

const ERROR_AUTO_DISMISS_MS = 8000 // 8 segundos

export function useImageUpload(): UseImageUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss de erro após alguns segundos
  useEffect(() => {
    if (error) {
      errorTimeoutRef.current = setTimeout(() => {
        setError(null)
      }, ERROR_AUTO_DISMISS_MS)
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [error])

  const validateFile = (file: File): string | null => {
    // Validar formato
    if (!CAROUSEL_CONSTRAINTS.ACCEPTED_FORMATS.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp')) {
      const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'desconhecido'
      return `Formato "${fileExtension}" não é suportado. Por favor, use apenas JPEG, PNG ou WebP.`
    }

    // Validar tamanho
    if (file.size > CAROUSEL_CONSTRAINTS.MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
      const maxSizeMB = Math.round(CAROUSEL_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024)
      return `O arquivo "${file.name}" tem ${fileSizeMB}MB, mas o tamanho máximo permitido é ${maxSizeMB}MB. Tente comprimir a imagem ou escolher outra.`
    }

    // Validar se é realmente uma imagem
    if (!file.type.startsWith('image/')) {
      return `O arquivo "${file.name}" não é uma imagem válida. Selecione uma imagem JPEG, PNG ou WebP.`
    }

    return null
  }

  const processFile = useCallback(async (file: File): Promise<LoginCarouselImage | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      // Validação do arquivo
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return null
      }

      // Processar e otimizar imagem
      let processedBlob: File
      try {
        processedBlob = await processImage(file)
      } catch (err) {
        setError(`Não foi possível processar a imagem "${file.name}". Verifique se o arquivo não está corrompido.`)
        return null
      }

      // Gerar ID único
      const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Upload para Firebase Storage
      try {
        const image = await CarouselStorageService.uploadImage(processedBlob, imageId)
        return image
      } catch (uploadError: any) {
        // Mensagens específicas baseadas no tipo de erro
        if (uploadError.message?.includes('não autenticado')) {
          setError('Você precisa estar logado para fazer upload de imagens.')
        } else if (uploadError.code === 'storage/unauthorized') {
          setError('Você não tem permissão para fazer upload. Entre em contato com o administrador.')
        } else if (uploadError.code === 'storage/quota-exceeded') {
          setError('Espaço de armazenamento esgotado. Entre em contato com o administrador.')
        } else if (uploadError.code === 'storage/canceled') {
          setError('Upload cancelado.')
        } else if (uploadError.message?.includes('network') || uploadError.message?.includes('Failed to fetch')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.')
        } else {
          setError(`Erro ao enviar a imagem "${file.name}". Tente novamente em alguns instantes.`)
        }
        return null
      }
    } catch (err: any) {
      console.error('Erro inesperado no upload:', err)
      setError('Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.')
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isProcessing,
    error,
    processFile,
    clearError,
  }
}

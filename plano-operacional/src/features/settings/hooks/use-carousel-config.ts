import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import type { CarouselConfig, LoginCarouselImage } from '../types/appearance'
import { DEFAULT_CAROUSEL_CONFIG } from '../types/appearance'
import { CarouselStorageService } from '../services/carousel-storage.service'

export function useCarouselConfig() {
  const [config, setConfig, removeConfig] = useLocalStorage<CarouselConfig>(
    'zops-login-carousel-config',
    DEFAULT_CAROUSEL_CONFIG
  )

  const [isLoading, setIsLoading] = useState(true)

  // Sincronizar imagens do Firebase Storage ao montar
  useEffect(() => {
    CarouselStorageService.listImagesWithMetadata()
      .then((storageImages) => {
        setConfig((prev) => ({
          ...prev,
          images: storageImages,
        }))
      })
      .finally(() => setIsLoading(false))
  }, [setConfig])

  const addImage = useCallback(
    (image: LoginCarouselImage) => {
      setConfig((prev) => ({
        ...prev,
        images: [...prev.images, image],
      }))
    },
    [setConfig]
  )

  const removeImage = useCallback(
    async (imageId: string) => {
      const imageToRemove = config.images.find((img) => img.id === imageId)
      if (imageToRemove) {
        try {
          // Deletar do Firebase Storage
          await CarouselStorageService.deleteImage(imageToRemove.storagePath)
          toast.success('Imagem removida', {
            description: 'A imagem foi excluída com sucesso.',
          })
        } catch (error) {
          console.error('Erro ao deletar imagem do storage:', error)
          toast.error('Erro ao remover imagem', {
            description: 'A imagem foi removida da lista, mas pode não ter sido excluída do servidor.',
          })
        }
      }

      setConfig((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }))
    },
    [setConfig, config.images]
  )

  const updateInterval = useCallback(
    (interval: number) => {
      setConfig((prev) => ({
        ...prev,
        interval,
      }))
    },
    [setConfig]
  )

  const resetToDefault = useCallback(async () => {
    const imageCount = config.images.length

    // Deletar todas as imagens do Firebase Storage
    const deletePromises = config.images.map((img) =>
      CarouselStorageService.deleteImage(img.storagePath).catch((err) =>
        console.error('Erro ao deletar imagem:', err)
      )
    )

    try {
      await Promise.all(deletePromises)

      // Limpar config
      removeConfig()

      toast.success('Configurações resetadas', {
        description: `${imageCount} ${imageCount === 1 ? 'imagem foi removida' : 'imagens foram removidas'}.`,
      })
    } catch (error) {
      toast.error('Erro ao resetar', {
        description: 'Algumas imagens podem não ter sido excluídas do servidor.',
      })
    }
  }, [removeConfig, config.images])

  return {
    config,
    isLoading,
    addImage,
    removeImage,
    updateInterval,
    resetToDefault,
  }
}

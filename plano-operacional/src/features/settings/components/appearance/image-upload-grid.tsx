import type { LoginCarouselImage } from '../../types/appearance'
import { ImagePreviewCard } from './image-preview-card'
import { Skeleton } from '@/components/ui/skeleton'

interface ImageUploadGridProps {
  images: LoginCarouselImage[]
  onRemove: (imageId: string) => void
  isProcessing: boolean
}

export function ImageUploadGrid({ images, onRemove, isProcessing }: ImageUploadGridProps) {
  if (images.length === 0 && !isProcessing) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem configurada. Adicione imagens para personalizar a tela de login.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <ImagePreviewCard key={image.id} image={image} onRemove={onRemove} />
      ))}
      {isProcessing && (
        <div className="space-y-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}
    </div>
  )
}

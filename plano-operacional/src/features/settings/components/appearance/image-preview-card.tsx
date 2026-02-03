import { useState } from 'react'
import { X, Eye } from 'lucide-react'
import type { LoginCarouselImage } from '../../types/appearance'
import { formatFileSize } from '../../utils/image-processor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ImagePreviewCardProps {
  image: LoginCarouselImage
  onRemove: (imageId: string) => void
}

export function ImagePreviewCard({ image, onRemove }: ImagePreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image.url}
          alt={image.fileName}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      {/* Overlay with actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <VisuallyHidden>
              <DialogTitle>Visualizar imagem</DialogTitle>
              <DialogDescription>
                Pré-visualização em tamanho completo da imagem {image.fileName}
              </DialogDescription>
            </VisuallyHidden>
            <img
              src={image.url}
              alt={image.fileName}
              className="w-full rounded-lg"
            />
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRemove(image.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Info footer */}
      <div className="p-2">
        <p className="truncate text-xs font-medium" title={image.fileName}>
          {image.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(image.size)}
        </p>
      </div>
    </div>
  )
}

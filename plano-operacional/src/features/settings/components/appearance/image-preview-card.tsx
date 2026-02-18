import { X, Eye } from 'lucide-react'
import type { LoginCarouselImage } from '../../types/appearance'
import { formatFileSize } from '../../utils/image-processor'
import { Button } from '@/components/ui/button'

interface ImagePreviewCardProps {
  image: LoginCarouselImage
  onRemove: (imageId: string) => void
}

export function ImagePreviewCard({ image, onRemove }: ImagePreviewCardProps) {
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
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.open(image.url, '_blank')}
        >
          <Eye className="h-4 w-4" />
        </Button>

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

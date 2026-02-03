import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ImagePlus, Info, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCarouselConfig } from '../../hooks/use-carousel-config'
import { useImageUpload } from '../../hooks/use-image-upload'
import { ImageUploadGrid } from './image-upload-grid'
import { CarouselIntervalSlider } from './carousel-interval-slider'
import { CAROUSEL_CONSTRAINTS } from '../../types/appearance'

export function LoginCarouselConfig() {
  const { config, addImage, removeImage, updateInterval, resetToDefault } = useCarouselConfig()
  const { isProcessing, error, processFile, clearError } = useImageUpload()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    let successCount = 0
    let failCount = 0

    for (const file of files) {
      if (config.images.length >= CAROUSEL_CONSTRAINTS.MAX_IMAGES) {
        toast.warning('Limite atingido', {
          description: `Você já adicionou o máximo de ${CAROUSEL_CONSTRAINTS.MAX_IMAGES} imagens.`,
        })
        break
      }

      const image = await processFile(file)
      if (image) {
        addImage(image)
        successCount++
      } else {
        failCount++
      }
    }

    // Feedback de sucesso
    if (successCount > 0) {
      toast.success('Imagem adicionada!', {
        description:
          successCount === 1
            ? 'A imagem foi enviada com sucesso.'
            : `${successCount} imagens foram enviadas com sucesso.`,
      })
    }

    // Reset input
    e.target.value = ''
  }

  const canAddMore = config.images.length < CAROUSEL_CONSTRAINTS.MAX_IMAGES

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imagens da Tela de Login</CardTitle>
          <CardDescription>
            Personalize as imagens exibidas na tela de login. Configure até{' '}
            {CAROUSEL_CONSTRAINTS.MAX_IMAGES} imagens para criar um carrossel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <ul className="ml-4 list-disc space-y-1 text-sm">
                <li>Formatos aceitos: JPEG, PNG, WebP</li>
                <li>Tamanho máximo por imagem: 300MB</li>
                <li>Resolução recomendada: 1920x1080</li>
                <li>As imagens serão otimizadas automaticamente</li>
                <li>Com 2+ imagens, o carrossel será ativado automaticamente</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in">
              <div className="flex items-start justify-between gap-4">
                <AlertDescription className="flex-1">{error}</AlertDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Imagens ({config.images.length}/{CAROUSEL_CONSTRAINTS.MAX_IMAGES})
              </Label>
              {config.images.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-destructive hover:text-destructive"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              )}
            </div>

            <ImageUploadGrid
              images={config.images}
              onRemove={removeImage}
              isProcessing={isProcessing}
            />

            {canAddMore && (
              <div>
                <input
                  type="file"
                  id="carousel-upload"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label htmlFor="carousel-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing || !canAddMore}
                    className="w-full"
                    asChild
                  >
                    <span>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {isProcessing ? 'Processando...' : 'Adicionar Imagens'}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Interval Slider - Only show if 2+ images */}
          {config.images.length >= 2 && (
            <CarouselIntervalSlider value={config.interval} onChange={updateInterval} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import type { CarouselConfig } from '@/features/settings/types/appearance'
import { DEFAULT_CAROUSEL_CONFIG } from '@/features/settings/types/appearance'

export function LoginCarousel() {
  const [config] = useLocalStorage<CarouselConfig>(
    'zops-login-carousel-config',
    DEFAULT_CAROUSEL_CONFIG
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  const images =
    config.images.length > 0 ? config.images.map((img) => img.url) : ['/bg/bg3.webp']

  const hasMultipleImages = images.length > 1

  // Auto-rotate effect
  useEffect(() => {
    if (!hasMultipleImages || !config.enableTransitions) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, config.interval)

    return () => clearInterval(timer)
  }, [hasMultipleImages, config.interval, config.enableTransitions, images.length])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Images with crossfade */}
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Z.Ops Background ${index + 1}`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === currentIndex ? 1 : 0,
            zIndex: index === currentIndex ? 1 : 0,
          }}
        />
      ))}

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 z-10 bg-[#0050C3]/20" />

      {/* Dots indicator */}
      {hasMultipleImages && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

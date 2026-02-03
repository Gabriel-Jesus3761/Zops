export interface LoginCarouselImage {
  id: string
  url: string
  storagePath: string
  fileName: string
  size: number
  addedAt: string
}

export interface CarouselConfig {
  images: LoginCarouselImage[]
  interval: number
  enableTransitions: boolean
}

export const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  images: [],
  interval: 5000,
  enableTransitions: true,
}

export const CAROUSEL_CONSTRAINTS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 300 * 1024 * 1024,
  MIN_INTERVAL: 3000,
  MAX_INTERVAL: 10000,
  ACCEPTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
} as const

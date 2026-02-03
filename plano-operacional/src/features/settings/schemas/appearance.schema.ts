import { z } from 'zod'
import { CAROUSEL_CONSTRAINTS } from '../types/appearance'

export const carouselImageSchema = z.object({
  id: z.string(),
  base64: z.string().startsWith('data:image/'),
  fileName: z.string(),
  size: z.number().max(CAROUSEL_CONSTRAINTS.MAX_FILE_SIZE),
  addedAt: z.string(),
})

export const carouselConfigSchema = z.object({
  images: z.array(carouselImageSchema).max(CAROUSEL_CONSTRAINTS.MAX_IMAGES),
  interval: z
    .number()
    .min(CAROUSEL_CONSTRAINTS.MIN_INTERVAL)
    .max(CAROUSEL_CONSTRAINTS.MAX_INTERVAL),
  enableTransitions: z.boolean(),
})

export type CarouselConfigFormData = z.infer<typeof carouselConfigSchema>

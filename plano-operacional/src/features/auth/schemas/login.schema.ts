import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  os: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

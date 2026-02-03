// Interface para padrões de identificação de serial
export interface SerialPattern {
  id?: string
  prefixo: string                 // Prefixo do número de série (ex: PB3, 244, AA7)
  tipo: string                     // Tipo do equipamento (ex: SMARTPOS, POS)
  modelo: string                   // Modelo específico (ex: SUNMI P2, DX8000)
  adquirencia: string              // Adquirência/origem (ex: PagSeguro, Cielo)
  subCategoria: string             // Subcategoria (padrão: EQUIPAMENTOS)
  needsValidation: boolean         // Se precisa validação manual
  ativo: boolean                   // Se o padrão está ativo
  dataAtualizacao?: string         // Data da última atualização
  atualizadoPor?: string           // Usuário que atualizou
  createdAt?: Date
  updatedAt?: Date
}

// Resultado da detecção automática
export interface SerialDetectionResult {
  found: boolean
  pattern?: SerialPattern
  confidence: number               // 0-100 (confiança na detecção)
  needsValidation: boolean
  suggestedValues?: {
    tipo?: string
    modelo?: string
    adquirencia?: string
  }
}

// Opções personalizadas salvas pelo usuário
export interface CustomOptions {
  tipos: string[]
  modelos: string[]
  adquirencias: string[]
}

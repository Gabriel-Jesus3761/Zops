/**
 * Vinculação entre SKU e combinação de equipamento (Modelo + Adquirência)
 * Usado para ativos serializados onde múltiplas unidades do mesmo equipamento
 * compartilham o mesmo SKU
 */

export interface SkuEquipmentBinding {
  id?: string
  sku: string // SKU atribuído (ex: ATS001)
  modelo: string // Modelo do equipamento (ex: SUNMI P2)
  adquirencia: string // Adquirência (ex: PAGSEGURO)
  tipo?: string // Tipo opcional (ex: SMARTPOS) - para contexto adicional
  quantidade: number // Quantidade de unidades cadastradas com esse SKU
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateSkuBindingData {
  sku: string
  modelo: string
  adquirencia: string
  tipo?: string
}

/**
 * Resultado da verificação de SKU para um equipamento
 */
export interface SkuBindingCheckResult {
  exists: boolean
  binding?: SkuEquipmentBinding
  suggestedSku?: string // SKU sugerido se não existir
}

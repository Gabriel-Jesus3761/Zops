// Tipos base comuns a todos os cadastros
export interface ItemBase {
  id?: string
  sku: string
  tipo: string
  modelo: string
  createdAt?: Date
  updatedAt?: Date
}

// Ativo Serializado (tem Adquirência)
export interface AtivoSerializado extends ItemBase {
  adquirencia: string
  numeroSerie?: string
}

// Ativo Não Serializado
export interface AtivoNaoSerializado extends ItemBase {
  quantidade?: number
}

// Insumo
export interface Insumo extends ItemBase {
  unidadeMedida?: string
  quantidade?: number
}

// Tipos para os formulários
export type TipoCadastro = 'ativo-serializado' | 'ativo-nao-serializado' | 'insumo'

export interface CadastroFormData {
  tipo: TipoCadastro
  dados: AtivoSerializado | AtivoNaoSerializado | Insumo
}

// Re-export tipos de vinculação SKU-Equipamento
export type { SkuEquipmentBinding, CreateSkuBindingData, SkuBindingCheckResult } from './sku-equipment-binding'

import type { SkuPattern, ItemTypeConfig } from '../types/sku-pattern'

// Configurações padrão de tipos (códigos SKU com até 4 letras, padrão 3)
export const DEFAULT_ITEM_TYPE_CONFIGS: ItemTypeConfig[] = [
  {
    code: 'ATS',
    label: 'Ativo Serializado',
    itemType: 'ativo-serializado',
  },
  {
    code: 'ATN',
    label: 'Ativo Não Serializado',
    itemType: 'ativo-nao-serializado',
  },
  {
    code: 'INS',
    label: 'Insumo',
    itemType: 'insumo',
  },
]

// Padrões predefinidos
export const DEFAULT_SKU_PATTERNS: SkuPattern[] = [
  {
    id: 'default-ativo-serializado',
    name: 'Padrão Ativo Serializado',
    pattern: '{TIPO}{SEQUENCIAL}',
    itemType: 'ativo-serializado',
    description: 'Formato: ATS001',
    sequentialStart: 1,
    sequentialPadding: 3,
    isActive: true,
  },
  {
    id: 'default-ativo-nao-serializado',
    name: 'Padrão Ativo Não Serializado',
    pattern: '{TIPO}{SEQUENCIAL}',
    itemType: 'ativo-nao-serializado',
    description: 'Formato: ATN001',
    sequentialStart: 1,
    sequentialPadding: 3,
    isActive: true,
  },
  {
    id: 'default-insumo',
    name: 'Padrão Insumo',
    pattern: '{TIPO}{SEQUENCIAL}',
    itemType: 'insumo',
    description: 'Formato: INS001',
    sequentialStart: 1,
    sequentialPadding: 3,
    isActive: true,
  },
]

// Função para buscar configuração de tipo por item type
export function getItemTypeConfig(itemType: string): ItemTypeConfig | undefined {
  return DEFAULT_ITEM_TYPE_CONFIGS.find(config => config.itemType === itemType)
}

// Função para buscar padrões por tipo de item
export function getPatternsByItemType(itemType: string): SkuPattern[] {
  return DEFAULT_SKU_PATTERNS.filter(pattern => pattern.itemType === itemType)
}

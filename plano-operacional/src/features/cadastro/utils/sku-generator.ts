import type { SkuPattern, GeneratedSku, ItemTypeConfig } from '../types/sku-pattern'

/**
 * Gera um SKU baseado no padrão fornecido
 */
export function generateSku(
  pattern: SkuPattern,
  tipoConfig: ItemTypeConfig,
  currentSequential: number
): GeneratedSku {
  const variables: GeneratedSku['variables'] = {
    tipo: tipoConfig.code,
    sequencial: currentSequential.toString().padStart(pattern.sequentialPadding, '0'),
  }

  let sku = pattern.pattern

  // Substituir variáveis
  if (variables.tipo) {
    sku = sku.replace(/{TIPO}/g, variables.tipo)
  }
  if (variables.sequencial) {
    sku = sku.replace(/{SEQUENCIAL}/g, variables.sequencial)
  }

  return {
    sku,
    pattern,
    variables,
  }
}

/**
 * Valida se um padrão de SKU é válido
 */
export function validateSkuPattern(pattern: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!pattern || pattern.trim() === '') {
    errors.push('Padrão não pode estar vazio')
    return { isValid: false, errors }
  }

  // Verificar se contém pelo menos uma variável
  const hasVariable = /{(TIPO|SEQUENCIAL)}/.test(pattern)
  if (!hasVariable) {
    errors.push('Padrão deve conter pelo menos uma variável')
  }

  // Verificar se contém sequencial (recomendado)
  if (!pattern.includes('{SEQUENCIAL}')) {
    errors.push('Recomendado: incluir {SEQUENCIAL} para garantir SKUs únicos')
  }

  // Verificar se o padrão contém apenas as variáveis, sem separadores
  const cleanPattern = pattern.replace(/{TIPO}/g, '').replace(/{SEQUENCIAL}/g, '')
  if (cleanPattern.length > 0) {
    errors.push('O padrão não deve conter separadores ou caracteres especiais. Use apenas {TIPO}{SEQUENCIAL}')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Gera uma pré-visualização do SKU
 */
export function previewSku(
  pattern: string,
  tipoConfig: ItemTypeConfig,
  sequentialExample: number = 1
): string {
  const mockPattern: SkuPattern = {
    name: 'Preview',
    pattern,
    itemType: tipoConfig.itemType,
    sequentialStart: 1,
    sequentialPadding: 3,
    isActive: true,
  }

  return generateSku(mockPattern, tipoConfig, sequentialExample).sku
}

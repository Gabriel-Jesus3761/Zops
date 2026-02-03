// Variáveis disponíveis para padrões de SKU
export type SkuVariable =
  | '{TIPO}'        // Tipo do item (código até 4 letras)
  | '{SEQUENCIAL}'  // Número sequencial (auto-incrementado, padrão 3 zeros à esquerda)

// Tipo de item que o padrão se aplica
export type PatternItemType = 'ativo-serializado' | 'ativo-nao-serializado' | 'insumo'

// Interface para um padrão de SKU
export interface SkuPattern {
  id?: string
  name: string                    // Nome do padrão (ex: "Padrão Ativos 2024")
  pattern: string                 // Padrão (ex: "{TIPO}-{ANO}-{SEQUENCIAL}")
  itemType: PatternItemType       // Tipo de item
  customCode?: string             // Código personalizado (sobrescreve o padrão do ItemTypeConfig)
  description?: string            // Descrição do padrão
  sequentialStart: number         // Valor inicial do sequencial (padrão: 1)
  sequentialPadding: number       // Quantidade de zeros à esquerda (padrão: 3 -> 001)
  isActive: boolean               // Se o padrão está ativo
  createdAt?: Date
  updatedAt?: Date
}

// Interface para configurações de tipo
export interface ItemTypeConfig {
  code: string        // Código curto (até 4 letras, ex: "ATS", "INS", "ATNS")
  label: string       // Label de exibição (ex: "Ativo Serializado")
  itemType: PatternItemType
}

// Padrão gerado com valores reais
export interface GeneratedSku {
  sku: string
  pattern: SkuPattern
  variables: {
    tipo?: string
    sequencial?: string
  }
}

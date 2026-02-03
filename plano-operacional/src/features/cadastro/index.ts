// Pages
export { CadastroHome } from './pages/cadastro-home'
export { AtivoSerializadoForm } from './pages/ativo-serializado-form'
export { AtivoNaoSerializadoForm } from './pages/ativo-nao-serializado-form'
export { InsumoForm } from './pages/insumo-form'
export { SkuPatternsConfig } from './pages/sku-patterns-config'
export { SerialPatternsConfig } from './pages/serial-patterns-config'
export { SkuBindingsConfig } from './pages/sku-bindings-config'
export { GestaoAtivosTeste } from './pages/gestao-ativos-teste'

// Types
export type {
  ItemBase,
  AtivoSerializado,
  AtivoNaoSerializado,
  Insumo,
  TipoCadastro,
  CadastroFormData,
} from './types'

export type {
  SkuPattern,
  SkuVariable,
  PatternItemType,
  ItemTypeConfig,
  GeneratedSku,
} from './types/sku-pattern'

export type {
  SerialPattern,
  SerialDetectionResult,
  CustomOptions,
} from './types/serial-pattern'

// Constants
export {
  DEFAULT_SKU_PATTERNS,
  DEFAULT_ITEM_TYPE_CONFIGS,
  getItemTypeConfig,
  getPatternsByItemType,
} from './constants/default-patterns'

// Utils
export { generateSku, validateSkuPattern, previewSku } from './utils/sku-generator'

/**
 * Script para traduzir automaticamente arquivos de locale
 *
 * USO:
 *   npx tsx scripts/translate.ts en        # Traduz pt-BR.json para inglês
 *   npx tsx scripts/translate.ts es        # Traduz pt-BR.json para espanhol
 *   npx tsx scripts/translate.ts all       # Traduz para todos os idiomas configurados
 *
 * CONFIGURAÇÃO:
 *   1. Para usar Google Translate API: defina GOOGLE_TRANSLATE_API_KEY no .env
 *   2. Para usar OpenAI: defina OPENAI_API_KEY no .env
 *   3. Sem API: o script gera um template para tradução manual ou com ChatGPT
 *
 * DICA: Cole o output no ChatGPT com o prompt:
 *   "Traduza este JSON de pt-BR para inglês, mantendo as chaves e estrutura:"
 */

import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales')
const SOURCE_LOCALE = 'pt-BR'

// Idiomas suportados para tradução
const TARGET_LOCALES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
}

interface TranslationResult {
  locale: string
  translations: Record<string, any>
  method: 'api' | 'manual'
}

/**
 * Carrega o arquivo de tradução fonte
 */
function loadSourceTranslations(): Record<string, any> {
  const filePath = path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo fonte não encontrado: ${filePath}`)
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

/**
 * Carrega traduções existentes para um idioma (se existirem)
 */
function loadExistingTranslations(locale: string): Record<string, any> | null {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`)

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }

  return null
}

/**
 * Encontra chaves que estão faltando no arquivo de destino
 */
function findMissingKeys(
  source: Record<string, any>,
  target: Record<string, any> | null,
  prefix = ''
): string[] {
  const missing: string[] = []

  for (const key in source) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof source[key] === 'object' && source[key] !== null) {
      const targetNested = target?.[key] || null
      missing.push(...findMissingKeys(source[key], targetNested, fullKey))
    } else {
      if (!target || !(key in (prefix ? getNestedValue(target, prefix) || {} : target))) {
        missing.push(fullKey)
      }
    }
  }

  return missing
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

/**
 * Extrai apenas os valores de texto para tradução
 */
function extractTextsForTranslation(obj: Record<string, any>, prefix = ''): Array<{ key: string; text: string }> {
  const texts: Array<{ key: string; text: string }> = []

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      texts.push(...extractTextsForTranslation(obj[key], fullKey))
    } else if (typeof obj[key] === 'string') {
      texts.push({ key: fullKey, text: obj[key] })
    }
  }

  return texts
}

/**
 * Gera prompt para tradução via ChatGPT/LLM
 */
function generateLLMPrompt(source: Record<string, any>, targetLanguage: string): string {
  const texts = extractTextsForTranslation(source)

  return `Traduza as seguintes strings de Português (Brasil) para ${targetLanguage}.
Mantenha as variáveis como {{variavel}} sem traduzir.
Retorne APENAS um JSON válido com a mesma estrutura.

JSON para traduzir:
${JSON.stringify(source, null, 2)}

Responda apenas com o JSON traduzido, sem explicações.`
}

/**
 * Salva arquivo de tradução
 */
function saveTranslations(locale: string, translations: Record<string, any>): void {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`)
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8')
  console.log(`✅ Arquivo salvo: ${filePath}`)
}

/**
 * Mescla traduções existentes com novas
 */
function mergeTranslations(
  existing: Record<string, any> | null,
  newTranslations: Record<string, any>
): Record<string, any> {
  if (!existing) return newTranslations

  function merge(target: any, source: any): any {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = merge(target[key] || {}, source[key])
      } else if (!(key in target)) {
        target[key] = source[key]
      }
    }
    return target
  }

  return merge({ ...existing }, newTranslations)
}

async function main() {
  const args = process.argv.slice(2)
  const targetLocale = args[0]

  if (!targetLocale) {
    console.log(`
📚 Script de Tradução Automática
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USO:
  npx tsx scripts/translate.ts <idioma>

IDIOMAS DISPONÍVEIS:
${Object.entries(TARGET_LOCALES)
  .map(([code, name]) => `  ${code.padEnd(5)} - ${name}`)
  .join('\n')}
  all   - Todos os idiomas

EXEMPLOS:
  npx tsx scripts/translate.ts en     # Gera prompt para inglês
  npx tsx scripts/translate.ts all    # Gera prompts para todos
`)
    return
  }

  console.log('🌍 Iniciando processo de tradução...\n')

  const source = loadSourceTranslations()
  const localesToProcess = targetLocale === 'all' ? Object.keys(TARGET_LOCALES) : [targetLocale]

  for (const locale of localesToProcess) {
    if (!TARGET_LOCALES[locale]) {
      console.log(`⚠️  Idioma não suportado: ${locale}`)
      continue
    }

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`📝 Traduzindo para: ${TARGET_LOCALES[locale]} (${locale})`)
    console.log('═'.repeat(60))

    const existing = loadExistingTranslations(locale)
    const missingKeys = findMissingKeys(source, existing)

    if (missingKeys.length === 0 && existing) {
      console.log(`✅ Todas as chaves já estão traduzidas em ${locale}.json`)
      continue
    }

    console.log(`\n🔑 Chaves para traduzir: ${missingKeys.length > 0 ? missingKeys.length : 'todas'}`)

    // Gera o prompt para usar com ChatGPT/Claude
    const prompt = generateLLMPrompt(source, TARGET_LOCALES[locale])

    console.log('\n' + '─'.repeat(60))
    console.log('📋 COPIE O PROMPT ABAIXO E COLE NO CHATGPT/CLAUDE:')
    console.log('─'.repeat(60))
    console.log(prompt)
    console.log('─'.repeat(60))

    // Salva o prompt em um arquivo para facilitar
    const promptFile = path.join(LOCALES_DIR, `_prompt_${locale}.txt`)
    fs.writeFileSync(promptFile, prompt, 'utf-8')
    console.log(`\n💾 Prompt salvo em: ${promptFile}`)

    console.log(`
📌 PRÓXIMOS PASSOS:
1. Copie o prompt acima
2. Cole no ChatGPT ou Claude
3. Copie a resposta JSON
4. Cole no arquivo: src/i18n/locales/${locale}.json
`)
  }

  console.log('\n✨ Processo finalizado!')
}

main().catch(console.error)

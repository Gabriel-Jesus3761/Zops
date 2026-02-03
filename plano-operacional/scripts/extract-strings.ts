/**
 * Script para extrair strings hardcoded de arquivos TSX/TS
 *
 * USO: npx tsx scripts/extract-strings.ts
 *
 * Este script escaneia o código fonte e extrai strings que podem ser traduzidas.
 * Ele gera um relatório das strings encontradas que ainda não estão no arquivo de tradução.
 */

import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.join(__dirname, '..', 'src')
const LOCALE_FILE = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'pt-BR.json')

// Padrões para encontrar strings em português (ajuste conforme necessário)
const STRING_PATTERNS = [
  // Strings entre aspas simples ou duplas que contêm caracteres acentuados ou palavras em português
  /["']([^"']*[áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][^"']*)["']/g,
  // Strings comuns em português
  /["'](Entrar|Sair|Salvar|Cancelar|Confirmar|Editar|Excluir|Voltar|Próximo|Carregando|Erro|Sucesso)["']/gi,
]

// Arquivos/pastas para ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.test.',
  '.spec.',
  '__tests__',
  '.d.ts',
]

interface ExtractedString {
  file: string
  line: number
  text: string
}

function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern))
}

function extractStringsFromFile(filePath: string): ExtractedString[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const extracted: ExtractedString[] = []

  lines.forEach((line, index) => {
    // Ignorar linhas de import/export
    if (line.trim().startsWith('import') || line.trim().startsWith('export')) {
      return
    }

    STRING_PATTERNS.forEach(pattern => {
      const matches = line.matchAll(pattern)
      for (const match of matches) {
        const text = match[1]
        // Filtrar strings muito curtas ou que parecem ser código
        if (text && text.length > 2 && !text.includes('${') && !text.startsWith('/')) {
          extracted.push({
            file: filePath,
            line: index + 1,
            text: text.trim(),
          })
        }
      }
    })
  })

  return extracted
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)

    if (shouldIgnoreFile(filePath)) {
      return
    }

    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList)
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

function getExistingTranslations(): Set<string> {
  const translations = new Set<string>()

  if (fs.existsSync(LOCALE_FILE)) {
    const content = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf-8'))

    function extractValues(obj: any) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          translations.add(obj[key].toLowerCase())
        } else if (typeof obj[key] === 'object') {
          extractValues(obj[key])
        }
      }
    }

    extractValues(content)
  }

  return translations
}

function main() {
  console.log('🔍 Extraindo strings do código fonte...\n')

  const files = walkDir(SRC_DIR)
  const existingTranslations = getExistingTranslations()
  const allExtracted: ExtractedString[] = []

  files.forEach(file => {
    const extracted = extractStringsFromFile(file)
    allExtracted.push(...extracted)
  })

  // Filtrar strings que já existem nas traduções
  const newStrings = allExtracted.filter(
    item => !existingTranslations.has(item.text.toLowerCase())
  )

  // Agrupar por arquivo
  const groupedByFile = newStrings.reduce((acc, item) => {
    const relativePath = path.relative(SRC_DIR, item.file)
    if (!acc[relativePath]) {
      acc[relativePath] = []
    }
    acc[relativePath].push(item)
    return acc
  }, {} as Record<string, ExtractedString[]>)

  console.log(`📁 Arquivos analisados: ${files.length}`)
  console.log(`📝 Strings encontradas: ${allExtracted.length}`)
  console.log(`🆕 Strings novas (não traduzidas): ${newStrings.length}\n`)

  if (newStrings.length > 0) {
    console.log('═'.repeat(60))
    console.log('STRINGS QUE PRECISAM SER TRADUZIDAS:')
    console.log('═'.repeat(60))

    for (const [file, strings] of Object.entries(groupedByFile)) {
      console.log(`\n📄 ${file}:`)
      strings.forEach(s => {
        console.log(`   Linha ${s.line}: "${s.text}"`)
      })
    }

    // Gerar sugestão de JSON
    console.log('\n' + '═'.repeat(60))
    console.log('SUGESTÃO DE ESTRUTURA JSON:')
    console.log('═'.repeat(60))

    const uniqueStrings = [...new Set(newStrings.map(s => s.text))]
    const suggestion: Record<string, string> = {}
    uniqueStrings.forEach((text, index) => {
      const key = `string_${index + 1}`
      suggestion[key] = text
    })

    console.log(JSON.stringify({ extracted: suggestion }, null, 2))
  } else {
    console.log('✅ Todas as strings já estão nos arquivos de tradução!')
  }
}

main()

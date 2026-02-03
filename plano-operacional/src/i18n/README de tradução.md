# Sistema de Internacionalização (i18n)

Este projeto utiliza **i18next** + **react-i18next** para suporte a múltiplos idiomas.

## Estrutura de Arquivos

```
src/i18n/
├── index.ts              # Configuração do i18next
├── README.md             # Esta documentação
└── locales/
    ├── pt-BR.json        # Traduções em Português (idioma base)
    └── en.json           # Traduções em Inglês
```

## Idiomas Suportados

| Código  | Idioma     | Status        |
|---------|------------|---------------|
| pt-BR   | Português  | Base          |
| en      | Inglês     | Traduzido     |

## Como Usar nos Componentes

### 1. Importar o hook

```tsx
import { useTranslation } from 'react-i18next'
```

### 2. Usar no componente

```tsx
function MeuComponente() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
      <button>{t('auth.login')}</button>
    </div>
  )
}
```

### 3. Com variáveis (interpolação)

```tsx
// No JSON: "welcome": "Olá, {{name}}!"
<p>{t('welcome', { name: 'João' })}</p>
// Resultado: "Olá, João!"
```

### 4. Com pluralização

```tsx
// No JSON:
// "items_one": "{{count}} item"
// "items_other": "{{count}} itens"

<p>{t('items', { count: 1 })}</p>  // "1 item"
<p>{t('items', { count: 5 })}</p>  // "5 itens"
```

## Adicionar Novas Traduções

### Passo 1: Adicionar no arquivo base (pt-BR.json)

```json
{
  "meuModulo": {
    "titulo": "Meu Título",
    "descricao": "Minha descrição"
  }
}
```

### Passo 2: Usar no componente

```tsx
const { t } = useTranslation()

return <h1>{t('meuModulo.titulo')}</h1>
```

### Passo 3: Traduzir para outros idiomas

Adicione a mesma chave no `en.json`:

```json
{
  "meuModulo": {
    "titulo": "My Title",
    "descricao": "My description"
  }
}
```

## Scripts de Automação

### Extrair strings do código

```bash
npm run i18n:extract
```

Este script escaneia o código fonte e lista strings em português que ainda não estão nos arquivos de tradução.

### Gerar tradução automática

```bash
npm run i18n:translate en      # Gera prompt para inglês
npm run i18n:translate es      # Gera prompt para espanhol
npm run i18n:translate all     # Gera prompts para todos os idiomas
```

Este script gera um prompt pronto para ser usado com ChatGPT/Claude. O fluxo é:

1. Execute o comando
2. Copie o prompt gerado
3. Cole no ChatGPT ou Claude
4. Copie o JSON traduzido da resposta
5. Cole no arquivo do idioma (ex: `en.json`)

## Adicionar Novo Idioma

### 1. Criar arquivo de tradução

Copie `pt-BR.json` para o novo idioma:

```bash
cp src/i18n/locales/pt-BR.json src/i18n/locales/es.json
```

### 2. Registrar no i18n

Edite `src/i18n/index.ts`:

```ts
import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'
import es from './locales/es.json'  // Adicionar

export const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
  es: { translation: es },  // Adicionar
} as const
```

### 3. Adicionar no seletor de idiomas

Edite `src/components/language-selector.tsx`:

```tsx
const languages = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },  // Adicionar
]
```

### 4. Traduzir

```bash
npm run i18n:translate es
```

## Trocar Idioma Programaticamente

```tsx
import { useTranslation } from 'react-i18next'

function MeuComponente() {
  const { i18n } = useTranslation()

  const mudarParaIngles = () => {
    i18n.changeLanguage('en')
  }

  const mudarParaPortugues = () => {
    i18n.changeLanguage('pt-BR')
  }

  return (
    <div>
      <button onClick={mudarParaIngles}>English</button>
      <button onClick={mudarParaPortugues}>Português</button>
    </div>
  )
}
```

## Obter Idioma Atual

```tsx
const { i18n } = useTranslation()

console.log(i18n.language) // "pt-BR" ou "en"
```

## Boas Práticas

1. **Organize por módulo**: Agrupe traduções por funcionalidade (auth, dashboard, common)

2. **Use chaves descritivas**: `auth.login.button` é melhor que `btn1`

3. **Mantenha consistência**: Use o mesmo padrão de nomenclatura em todos os arquivos

4. **Evite duplicação**: Use a seção `common` para strings reutilizáveis

5. **Sempre comece pelo pt-BR**: É o idioma base, depois traduza para os outros

## Estrutura Recomendada do JSON

```json
{
  "common": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "validation": {
      "emailRequired": "Email é obrigatório"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "tabs": {
      "summary": "Resumo"
    }
  }
}
```

## Referências

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)

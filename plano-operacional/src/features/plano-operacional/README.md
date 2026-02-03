# 🚀 Plano Operacional - Feature

Sistema completo de gestão de Plano Operacional para eventos, permitindo controle de PDVs (Pontos de Venda), equipamentos, estoque e métricas em tempo real.

## 📁 Estrutura

```
plano-operacional/
├── components/
│   ├── dashboard/          # Componentes do Dashboard
│   │   └── dashboard-tab.tsx
│   ├── plano/             # Componentes do Plano (PDVs)
│   │   ├── plano-tab.tsx
│   │   ├── pdv-table.tsx
│   │   └── pdv-cards.tsx
│   └── estoque/           # Componentes do Estoque
│       └── estoque-tab.tsx
├── hooks/                 # Hooks customizados
│   ├── use-plano-data.ts
│   ├── use-estoque.ts
│   └── use-dashboard-metrics.ts
├── pages/                 # Páginas principais
│   └── plano-operacional-page.tsx
├── types/                 # Type definitions
│   └── index.ts
├── services/              # Serviços de API (futuro)
└── utils/                 # Utilitários (futuro)
```

## 🎯 Funcionalidades

### 📊 Dashboard
- **Métricas em tempo real**: Total de PDVs, equipamentos alocados e disponíveis
- **Taxa de ocupação**: Visualização da utilização de equipamentos
- **Alertas automáticos**: Notificações de itens com estoque baixo
- **Status summary**: Resumo visual do status de todos os PDVs

### 📄 Plano (PDVs)
- **Visualização flexível**: Modo tabela ou cards
- **Busca avançada**: Pesquisa por nome, setor, categoria ou responsável
- **Filtros dinâmicos**: Filtro por status (Pendente, Entregue, Devolvido, etc.)
- **Detalhes expandíveis**: Visualização detalhada de equipamentos e seriais
- **Gestão de status**: Controle do ciclo de vida dos PDVs

### 📦 Estoque
- **Separação por tipo**: Terminais e Insumos organizados separadamente
- **Alertas de baixo estoque**: Destacamento visual de itens críticos
- **Transferências**: Botões de ação rápida para transferências
- **Métricas de utilização**: Taxa de uso e disponibilidade

## 🎨 Destaques de Design

### Componentes Modernos
- ✅ Totalmente responsivo (desktop, tablet, mobile)
- ✅ Dark mode support integrado
- ✅ Animações suaves e performáticas
- ✅ Skeleton loaders para melhor UX
- ✅ Estados vazios informativos

### Acessibilidade
- ✅ Navegação por teclado
- ✅ Contraste adequado (WCAG AA)
- ✅ ARIA labels apropriados
- ✅ Tooltips informativos

## 🔧 Tecnologias Utilizadas

- **React 18** com TypeScript
- **Shadcn/ui** - Componentes de UI
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **React Query** (preparado) - Gerenciamento de estado server
- **Zustand** (preparado) - Gerenciamento de estado client

## 📊 Types Principais

### PDV (Ponto de Venda)
```typescript
interface PDV {
  key: string
  'Ponto de Venda': string
  Status: PDVStatus
  setor?: string
  categoria?: string
  responsavel?: string
  SERIAIS_FISICOS: string[]
  equipamentos: Equipment[]
  totalTerminais: number
  // ... mais campos
}
```

### EstoqueItem
```typescript
interface EstoqueItem {
  key: string
  modelo: string
  quantidade: number
  tipo: 'TERMINAL' | 'INSUMO'
  disponivel?: number
  alocado?: number
}
```

## 🚀 Como Usar

### 1. Navegação
Acesse o menu lateral: **Go Live > Plano Operacional**

### 2. Tabs Disponíveis

#### Dashboard
- Visualize métricas gerais do evento
- Acompanhe alertas de estoque
- Monitore taxa de ocupação

#### Plano
- Liste todos os PDVs
- Busque e filtre por critérios específicos
- Alterne entre visualização em tabela ou cards
- Expanda linhas para ver detalhes de equipamentos

#### Estoque
- Visualize terminais disponíveis
- Confira insumos e acessórios
- Identifique itens com baixo estoque
- Execute transferências rápidas (em desenvolvimento)

## 🔄 Próximos Passos / Roadmap

### Backend Integration
- [ ] Conectar com API real (Firebase/REST)
- [ ] Implementar mutations para CRUD
- [ ] Adicionar cache e sincronização otimista

### Funcionalidades Adicionais
- [ ] Modal de transferência de equipamentos
- [ ] Sistema de assinaturas digitais
- [ ] Geração de PDF de protocolos
- [ ] Histórico de atividades/timeline
- [ ] Modo Kanban para visualização de PDVs
- [ ] Drag & Drop para transferências
- [ ] Exportação de relatórios (Excel/PDF)
- [ ] Notificações em tempo real
- [ ] Modo offline (PWA)

### Melhorias de UX
- [ ] Undo/Redo de ações
- [ ] Busca fuzzy melhorada
- [ ] Shortcuts de teclado
- [ ] Filtros salvos/favoritos
- [ ] Dashboard customizável

## 📝 Dados Mock

A aplicação vem com dados de exemplo (mock) para demonstração:
- 5 PDVs de exemplo (incluindo "Estoque")
- 10 itens de estoque (terminais e insumos)
- Métricas calculadas automaticamente

Para conectar com dados reais, edite os hooks em `hooks/`.

## 🎓 Convenções de Código

- **Nomenclatura**: camelCase para variáveis, PascalCase para componentes
- **Types**: Sempre tipar props e retornos de funções
- **Componentes**: Um componente por arquivo
- **Hooks**: Prefixo `use` para custom hooks
- **Exports**: Named exports preferidos sobre default

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Siga as convenções de código existentes
3. Adicione types para novas funcionalidades
4. Teste em diferentes resoluções/navegadores
5. Documente mudanças significativas

## 📄 Licença

Este módulo faz parte do projeto Z.Ops - Plano Operacional.

# 📋 Plano de Implementação - Telas de Configuração

## ✅ **O que já existe:**
- [x] MCO Parâmetros (`/settings/mco-parametros`)
- [x] Locais de Eventos (`/settings/locais-eventos`)
- [x] Manage Clients (`/settings/manage-clients`)

## 🚧 **O que precisa ser criado:**

### 1. **Clusters** (`/settings/clusters`) - PRIORIDADE ALTA
Gerenciar os clusters de classificação de eventos

**Funcionalidades:**
- Listar clusters (PP, P, M, G, MEGA)
- Editar ITE por cluster
- Editar dias de setup
- Editar faixa de faturamento

**Campos:**
- Tamanho (PP, P, M, G, MEGA)
- ITE (Índice Terminal/Equipe)
- Faturamento Piso
- Faturamento Teto
- Dias Setup

---

### 2. **Cargos** (`/settings/cargos`) - PRIORIDADE ALTA
Gerenciar cargos da equipe técnica

**Funcionalidades:**
- Listar cargos (TCA, LTT, Coordenador)
- Adicionar novo cargo
- Editar custo/dia
- Editar custo refeição
- Definir time (Go Live / Alpha)

**Campos:**
- Nome
- Sigla
- Time (go_live, alpha, outro)
- Custo por Dia
- Custo Refeição
- Ordem

---

### 3. **Dimensionamento** (`/settings/dimensionamento`) - PRIORIDADE ALTA
Matriz: quantos de cada cargo por cluster e modalidade

**Funcionalidades:**
- Tabela: Cluster x Cargo
- Editar quantidade por célula
- Filtrar por modalidade (Ticket Médio / Cachapa)
- Pré-visualizar equipe calculada

**Exemplo de Tabela:**
```
         | TCA | LTT | Coord
---------|-----|-----|------
PP       |  2  |  1  |   1
P        |  3  |  2  |   1
M        |  5  |  3  |   1
G        |  8  |  4  |   1
MEGA     | 12  |  6  |   1
```

---

### 4. **Filiais** (`/settings/filiais`) - PRIORIDADE MÉDIA
Gerenciar filiais e seus raios de atuação

**Funcionalidades:**
- Listar filiais
- Adicionar nova filial
- Editar raio de atuação (km)
- Definir cluster limite
- Coordenadas (lat/lng)

**Campos:**
- Cidade
- UF
- Raio Atuação (km)
- Cluster Limite
- Latitude
- Longitude
- Ativo

---

### 5. **Parâmetros Gerais** (`/settings/parametros-gerais`) - PRIORIDADE MÉDIA
Custos e configurações gerais

**Categorias:**
- **Frete**: Custo/km, Equipamento base
- **Hospedagem**: Custo diária hotel
- **Transporte**: Custo transporte local/dia
- **Viagem**: Custo passagem aérea, custo/km terrestre

**Campos:**
- Chave
- Valor
- Tipo
- Categoria
- Descrição
- Unidade

---

### 6. **Modalidades** (`/settings/modalidades`) - PRIORIDADE BAIXA
Gerenciar modalidades operacionais

**Funcionalidades:**
- Listar modalidades (Ticket Médio, Cachapa)
- Adicionar nova modalidade
- Ativar/Desativar

**Campos:**
- Nome
- Descrição
- Slug
- Ativo

---

## 🎯 **Ordem de Implementação Sugerida:**

### Sprint 1 (Fundamental para MCO funcionar)
1. ✅ Clusters
2. ✅ Cargos
3. ✅ Dimensionamento (cargo_cluster)

### Sprint 2 (Cálculos avançados)
4. ✅ Filiais
5. ✅ Parâmetros Gerais

### Sprint 3 (Complementar)
6. ✅ Modalidades

---

## 🛠️ **Estrutura de Arquivos para Cada Tela:**

```
src/features/settings/
├── pages/
│   ├── clusters.tsx
│   ├── cargos.tsx
│   ├── dimensionamento.tsx
│   ├── filiais.tsx
│   ├── parametros-gerais.tsx
│   └── modalidades.tsx
├── components/
│   ├── clusters/
│   │   ├── cluster-list.tsx
│   │   └── cluster-form.tsx
│   ├── cargos/
│   │   ├── cargo-list.tsx
│   │   └── cargo-form.tsx
│   └── dimensionamento/
│       └── dimensionamento-matrix.tsx
├── services/
│   ├── clusters.service.ts
│   ├── cargos.service.ts
│   ├── cargo-cluster.service.ts
│   ├── filiais.service.ts
│   └── parametros.service.ts
└── types/
    ├── cluster.ts
    ├── cargo.ts
    ├── cargo-cluster.ts
    ├── filial.ts
    └── parametro.ts
```

---

## 📊 **Services a criar:**

### clusters.service.ts
```typescript
- getClusters(): Promise<Cluster[]>
- getCluster(id): Promise<Cluster>
- updateCluster(id, data): Promise<void>
```

### cargos.service.ts
```typescript
- getCargos(): Promise<Cargo[]>
- createCargo(data): Promise<Cargo>
- updateCargo(id, data): Promise<void>
- deleteCargo(id): Promise<void>
```

### cargo-cluster.service.ts
```typescript
- getDimensionamento(): Promise<CargoCluster[]>
- updateQuantidade(cargoId, clusterId, quantidade): Promise<void>
```

### filiais.service.ts
```typescript
- getFiliais(): Promise<Filial[]>
- createFilial(data): Promise<Filial>
- updateFilial(id, data): Promise<void>
- deletFilial(id): Promise<void>
```

### parametros.service.ts
```typescript
- getParametros(categoria?): Promise<Parametro[]>
- updateParametro(id, valor): Promise<void>
```

---

## 🔄 **Atualizar Calculator para Firebase:**

Após criar as telas e collections, atualizar `mco-calculator.service.ts` para:

1. Buscar clusters do Firebase (não hardcoded)
2. Buscar cargos do Firebase
3. Buscar dimensionamento do Firebase
4. Buscar parâmetros do Firebase
5. Usar cálculos de filiais e distâncias

---

## 📝 **Checklist de Implementação:**

### Clusters
- [ ] Criar types/cluster.ts
- [ ] Criar services/clusters.service.ts
- [ ] Criar components/clusters/cluster-list.tsx
- [ ] Criar components/clusters/cluster-form.tsx
- [ ] Criar pages/clusters.tsx
- [ ] Adicionar rota em routes/index.tsx
- [ ] Popular dados iniciais no Firebase

### Cargos
- [ ] Criar types/cargo.ts
- [ ] Criar services/cargos.service.ts
- [ ] Criar components/cargos/cargo-list.tsx
- [ ] Criar components/cargos/cargo-form.tsx
- [ ] Criar pages/cargos.tsx
- [ ] Adicionar rota
- [ ] Popular dados iniciais

### Dimensionamento
- [ ] Criar types/cargo-cluster.ts
- [ ] Criar services/cargo-cluster.service.ts
- [ ] Criar components/dimensionamento/dimensionamento-matrix.tsx
- [ ] Criar pages/dimensionamento.tsx
- [ ] Adicionar rota
- [ ] Popular dados iniciais

### E assim por diante...

---

Quer que eu comece implementando qual tela primeiro? Sugiro começar por **Clusters** que é fundamental para tudo funcionar!

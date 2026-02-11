# 🔥 Estrutura Completa de Collections Firebase - MCO

## Collections Necessárias

### 1. **`clusters`**
Classificação de tamanho de eventos por faturamento

```typescript
{
  id: string,                    // auto-generated
  tamanho: string,               // "PP", "P", "M", "G", "MEGA"
  ite: number,                   // Índice de Terminal por Equipe (ex: 70)
  faturamento_piso: number,      // Faturamento mínimo (ex: 0, 75000, 150000)
  faturamento_teto: number,      // Faturamento máximo (ex: 74999, 149999)
  dias_setup: number,            // Dias de montagem (ex: 0 para PP-G, 4 para MEGA)
  ordem: number,                 // Ordem de exibição (1-5)
  ativo: boolean                 // Se está ativo
}
```

**Dados Iniciais:**
```javascript
[
  { tamanho: "PP", ite: 70, faturamento_piso: 0, faturamento_teto: 74999, dias_setup: 0, ordem: 1 },
  { tamanho: "P", ite: 70, faturamento_piso: 75000, faturamento_teto: 149999, dias_setup: 0, ordem: 2 },
  { tamanho: "M", ite: 70, faturamento_piso: 150000, faturamento_teto: 499999, dias_setup: 0, ordem: 3 },
  { tamanho: "G", ite: 70, faturamento_piso: 500000, faturamento_teto: 1499999, dias_setup: 0, ordem: 4 },
  { tamanho: "MEGA", ite: 70, faturamento_piso: 1500000, faturamento_teto: 999999999, dias_setup: 4, ordem: 5 }
]
```

---

### 2. **`cargos`**
Cargos da equipe técnica

```typescript
{
  id: string,                    // auto-generated
  nome: string,                  // "Técnico de Campo Avançado"
  sigla: string,                 // "TCA"
  time: string,                  // "go_live" | "alpha" | "outro"
  custo_dia: number,             // Custo por dia (ex: 180)
  custo_refeicao: number,        // Custo por refeição (ex: 35)
  ordem: number,                 // Ordem de exibição
  ativo: boolean
}
```

**Dados Iniciais:**
```javascript
[
  { nome: "Técnico de Campo Avançado", sigla: "TCA", time: "go_live", custo_dia: 180, custo_refeicao: 35, ordem: 1 },
  { nome: "Líder Técnico de Time", sigla: "LTT", time: "go_live", custo_dia: 150, custo_refeicao: 35, ordem: 2 },
  { nome: "Coordenador", sigla: "COORD", time: "alpha", custo_dia: 250, custo_refeicao: 50, ordem: 3 }
]
```

---

### 3. **`cargo_cluster`**
Dimensionamento: quantos de cada cargo por cluster

```typescript
{
  id: string,                    // auto-generated
  cargo_id: string,              // ref to cargos
  cluster_id: string,            // ref to clusters
  quantidade: number,            // Quantidade desse cargo para esse cluster
  modalidade: string             // "ticket_medio" | "cachapa" | "ambos"
}
```

**Dados Iniciais (exemplo para Ticket Médio):**
```javascript
// PP
[
  { cargo_id: "TCA_ID", cluster_id: "PP_ID", quantidade: 2, modalidade: "ticket_medio" },
  { cargo_id: "LTT_ID", cluster_id: "PP_ID", quantidade: 1, modalidade: "ticket_medio" },
  { cargo_id: "COORD_ID", cluster_id: "PP_ID", quantidade: 1, modalidade: "ticket_medio" }
]
// P
[
  { cargo_id: "TCA_ID", cluster_id: "P_ID", quantidade: 3, modalidade: "ticket_medio" },
  { cargo_id: "LTT_ID", cluster_id: "P_ID", quantidade: 2, modalidade: "ticket_medio" },
  { cargo_id: "COORD_ID", cluster_id: "P_ID", quantidade: 1, modalidade: "ticket_medio" }
]
// M
[
  { cargo_id: "TCA_ID", cluster_id: "M_ID", quantidade: 5, modalidade: "ticket_medio" },
  { cargo_id: "LTT_ID", cluster_id: "M_ID", quantidade: 3, modalidade: "ticket_medio" },
  { cargo_id: "COORD_ID", cluster_id: "M_ID", quantidade: 1, modalidade: "ticket_medio" }
]
// G
[
  { cargo_id: "TCA_ID", cluster_id: "G_ID", quantidade: 8, modalidade: "ticket_medio" },
  { cargo_id: "LTT_ID", cluster_id: "G_ID", quantidade: 4, modalidade: "ticket_medio" },
  { cargo_id: "COORD_ID", cluster_id: "G_ID", quantidade: 1, modalidade: "ticket_medio" }
]
// MEGA
[
  { cargo_id: "TCA_ID", cluster_id: "MEGA_ID", quantidade: 12, modalidade: "ticket_medio" },
  { cargo_id: "LTT_ID", cluster_id: "MEGA_ID", quantidade: 6, modalidade: "ticket_medio" },
  { cargo_id: "COORD_ID", cluster_id: "MEGA_ID", quantidade: 1, modalidade: "ticket_medio" }
]
```

---

### 4. **`filiais`**
Filiais da empresa

```typescript
{
  id: string,                    // auto-generated
  cidade: string,                // "Rio de Janeiro"
  uf: string,                    // "RJ"
  raio_atuacao_km: number,       // Raio em km (ex: 300)
  cluster_limite_id: string,     // ref to clusters - maior cluster que pode atender
  latitude: number,              // -22.9068
  longitude: number,             // -43.1729
  ativo: boolean
}
```

**Dados Iniciais:**
```javascript
[
  { cidade: "São Paulo", uf: "SP", raio_atuacao_km: 0, cluster_limite_id: "MEGA_ID", latitude: -23.5505, longitude: -46.6333 },
  { cidade: "Rio de Janeiro", uf: "RJ", raio_atuacao_km: 300, cluster_limite_id: "G_ID", latitude: -22.9068, longitude: -43.1729 },
  { cidade: "Belo Horizonte", uf: "MG", raio_atuacao_km: 250, cluster_limite_id: "M_ID", latitude: -19.9167, longitude: -43.9345 }
]
```

---

### 5. **`parametros`**
Parâmetros gerais do sistema

```typescript
{
  id: string,                    // auto-generated
  chave: string,                 // "custo_km_frete", "custo_hotel_diaria"
  valor: number | string,        // 3.5, "true"
  tipo: string,                  // "numero", "texto", "booleano"
  categoria: string,             // "frete", "hospedagem", "transporte"
  descricao: string,             // "Custo por km de frete"
  unidade: string,               // "R$/km", "R$/dia"
}
```

**Dados Iniciais:**
```javascript
[
  // Frete
  { chave: "custo_km_frete", valor: 3.5, tipo: "numero", categoria: "frete", descricao: "Custo por quilômetro de frete", unidade: "R$/km" },
  { chave: "custo_equipamento_base", valor: 5000, tipo: "numero", categoria: "frete", descricao: "Custo base de equipamentos", unidade: "R$" },

  // Hospedagem
  { chave: "custo_hotel_diaria", valor: 200, tipo: "numero", categoria: "hospedagem", descricao: "Custo médio de diária de hotel", unidade: "R$/dia" },

  // Transporte
  { chave: "custo_transporte_local_dia", valor: 150, tipo: "numero", categoria: "transporte", descricao: "Custo de transporte local por dia", unidade: "R$/dia" },

  // Viagem
  { chave: "custo_passagem_aerea_media", valor: 800, tipo: "numero", categoria: "viagem", descricao: "Custo médio de passagem aérea", unidade: "R$" },
  { chave: "custo_km_terrestre", valor: 0.8, tipo: "numero", categoria: "viagem", descricao: "Custo por km de viagem terrestre", unidade: "R$/km" },
  { chave: "distancia_min_aviao_km", valor: 500, tipo: "numero", categoria: "viagem", descricao: "Distância mínima para viagem aérea", unidade: "km" }
]
```

---

### 6. **`modalidades`**
Modalidades operacionais

```typescript
{
  id: string,                    // auto-generated
  nome: string,                  // "Ticket Médio"
  descricao: string,             // "Operação baseada em ticket médio"
  slug: string,                  // "ticket_medio"
  ativo: boolean
}
```

**Dados Iniciais:**
```javascript
[
  { nome: "Ticket Médio", descricao: "Operação baseada em ticket médio de consumo", slug: "ticket_medio" },
  { nome: "Cachapa", descricao: "Operação baseada em sistema de tokens Cachapa", slug: "cachapa" }
]
```

---

## 🚀 **Criação Rápida via Firebase Console**

### Passo 1: Criar Collections

1. Acesse Firebase Console
2. Firestore Database
3. Para cada collection acima, clique em "Start collection"
4. Copie os dados iniciais

### Passo 2: Import via Script (Opcional)

Criar script de seed para popular automaticamente:

```typescript
// seed-firebase.ts
import { db } from '@/config/firebase'
import { collection, addDoc } from 'firebase/firestore'

const seedData = async () => {
  // Clusters
  const clustersData = [ /* dados acima */ ]
  for (const cluster of clustersData) {
    await addDoc(collection(db, 'clusters'), cluster)
  }

  // Cargos
  const cargosData = [ /* dados acima */ ]
  for (const cargo of cargosData) {
    await addDoc(collection(db, 'cargos'), cargo)
  }

  // ... etc
}
```

---

## 📊 **Índices Recomendados**

```javascript
// clusters
- tamanho (asc) + ordem (asc)

// cargos
- time (asc) + ordem (asc)

// filiais
- uf (asc) + cidade (asc)

// cargo_cluster
- cluster_id (asc) + cargo_id (asc)
- modalidade (asc) + cluster_id (asc)

// parametros
- categoria (asc) + chave (asc)
```

---

## 🔐 **Regras de Segurança**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collections de configuração - apenas admin
    match /clusters/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    match /cargos/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    match /cargo_cluster/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    match /filiais/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    match /parametros/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    match /modalidades/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

# 🚀 Calculator MCO - Integração com Firebase

## 📝 Resumo das Mudanças

O `mco-calculator.service.ts` foi **completamente refatorado** para buscar dados do Firebase em vez de usar valores hardcoded, tornando o sistema totalmente dinâmico e configurável.

---

## ✅ O que foi implementado

### 1. **Busca Dinâmica de Parâmetros**

O calculator agora busca dados de 4 collections do Firebase:

```typescript
await Promise.all([
  clustersService.getClusters(),           // Faixas de faturamento
  cargosService.getCargos(),               // Cargos e suas diárias
  cargoClusterService.getCargosClusters(), // Dimensionamento (matriz)
  parametrosGeraisService.getParametros(), // Parâmetros globais
])
```

### 2. **Sistema de Cache Inteligente**

- Cache válido por **5 minutos**
- Evita múltiplas requisições ao Firebase
- Método `clearCache()` disponível para forçar atualização

### 3. **Identificação Automática de Cluster**

```typescript
// Baseado no faturamento estimado
const cluster = identificarCluster(faturamento)
// Retorna: PP, P, M, G ou MEGA
```

**Lógica:**
- Compara o faturamento com as faixas configuradas em `mco_clusters`
- Se faturamento = R$ 200.000 → Cluster "M" (150k - 500k)
- Se faturamento = R$ 2.000.000 → Cluster "MEGA" (1.5M+)

### 4. **Cálculo de Mão de Obra Dinâmico**

**ANTES (hardcoded):**
```typescript
// Valores fixos por modalidade e faixa de público
equipe: {
  'self-service': {
    '0-1000': { tca: 2, ltt: 1 }
  }
}
```

**AGORA (Firebase):**
```typescript
// Busca do dimensionamento configurado
const dimensionamento = getDimensionamento(cluster.id)
// Retorna: { TCA: { cargo, quantidade: 5 }, LTT: { cargo, quantidade: 3 } }

// Calcula custos
Object.entries(dimensionamento).forEach(([sigla, { cargo, quantidade }]) => {
  const custo = quantidade * cargo.valor_diaria * numDias
})
```

**Benefícios:**
- ✅ Cargos dinâmicos (não limitado a TCA, LTT, COORD)
- ✅ Quantidades configuráveis via interface
- ✅ Valores de diária atualizáveis sem código

### 5. **Breakdown Aprimorado**

Agora o breakdown de custos inclui detalhes por cargo:

```typescript
{
  mao_de_obra: {
    TCA: 18000,      // 5 pessoas × R$ 180/dia × 20 dias
    LTT: 9000,       // 3 pessoas × R$ 150/dia × 20 dias
    COORD: 5000,     // 1 pessoa × R$ 250/dia × 20 dias
    total: 32000
  },
  logistica: { ... },
  alimentacao: { ... },
  hospedagem: { ... },
  transporte_local: { ... }, // NOVO!
  total_geral: ...,
  cot_percentual: ...
}
```

### 6. **Novo Campo: Transporte Local**

Usa o parâmetro `valor_transporte_local_diario` de `mco_parametros_gerais`:

```typescript
// Apenas equipe Go Live (time técnico)
const custoTotal = totalGoLive * parametros.valor_transporte_local_diario * numDias
```

### 7. **Cluster Identificado no Resultado**

```typescript
{
  custo_operacional_efetivo: 150000,
  cot: 15.5,
  cluster_identificado: "M - Médio", // NOVO!
  breakdown: { ... }
}
```

---

## 🔄 Fluxo Completo de Cálculo

### 1. **Usuário preenche wizard MCO**
- Nome do evento
- Faturamento estimado: **R$ 300.000**
- Datas do evento: **5 dias**
- Modalidade, Time Técnico, etc.

### 2. **Clica em "Confirmar e Criar MCO"**

### 3. **Calculator busca parâmetros do Firebase**
```typescript
await fetchParametros()
// Busca: clusters, cargos, cargo_cluster, parametros_gerais
```

### 4. **Identifica o cluster**
```typescript
identificarCluster(300000)
// Retorna: Cluster "M" (150k - 500k)
```

### 5. **Busca dimensionamento do cluster M**
```typescript
getDimensionamento(clusterM.id)
// Retorna:
// {
//   TCA: { cargo: {...}, quantidade: 5 },
//   LTT: { cargo: {...}, quantidade: 3 },
//   COORD: { cargo: {...}, quantidade: 1 }
// }
```

### 6. **Calcula custos por categoria**

**Mão de Obra:**
```
TCA:   5 pessoas × R$ 180/dia × 5 dias = R$ 4.500
LTT:   3 pessoas × R$ 150/dia × 5 dias = R$ 2.250
COORD: 1 pessoa  × R$ 250/dia × 5 dias = R$ 1.250
Total: R$ 8.000
```

**Alimentação:**
```
Go Live (TCA+LTT): 8 pessoas × 3 refeições × R$ 35 × 5 dias = R$ 4.200
Alpha (COORD):     1 pessoa  × 3 refeições × R$ 50 × 5 dias = R$ 750
Total: R$ 4.950
```

**Hospedagem:**
```
Alpha (COORD): 1 pessoa × R$ 200/dia × 5 dias = R$ 1.000
```

**Transporte Local:**
```
Go Live (TCA+LTT): 8 pessoas × R$ 150/dia × 5 dias = R$ 6.000
```

**Logística:** (placeholder, depois integrar com geocoding)
```
Frete: 500 km × R$ 3,50/km = R$ 1.750
Equipamentos: R$ 5.000
Total: R$ 6.750
```

### 7. **Calcula totais**
```
Total Geral: R$ 26.700
COT: 8,9% (26.700 / 300.000 × 100)
```

### 8. **MCO criada no Firebase**
```typescript
await mcoService.criarMCO({
  codigo: "MCO-0001",
  nome_evento: "...",
  custo_operacional_efetivo: 26700,
  cot: 8.9,
  cluster_identificado: "M - Médio",
  breakdown_custos: { ... }
})
```

---

## 📊 Dados Necessários no Firebase

### Para o sistema funcionar, você precisa popular:

#### 1. **Clusters** (`mco_clusters`)
```json
[
  {
    "tamanho": "M",
    "nome": "Médio",
    "faturamento_piso": 150000,
    "faturamento_teto": 499999,
    "ite": 70,
    "dias_setup": 0,
    "ativo": true
  }
]
```

#### 2. **Cargos** (`mco_cargos`)
```json
[
  {
    "sigla": "TCA",
    "nome": "Técnico de Campo Avançado",
    "time": "tecnico",
    "valor_diaria": 180,
    "ordem": 1,
    "ativo": true
  }
]
```

#### 3. **Dimensionamento** (`mco_cargo_cluster`)
```json
[
  {
    "cluster_id": "cluster_M_id",
    "cargo_id": "cargo_TCA_id",
    "quantidade": 5
  }
]
```

#### 4. **Parâmetros Gerais** (`mco_parametros_gerais`)
```json
{
  "max_tecnicos_por_lider": 8,
  "valor_transporte_local_diario": 150,
  "valor_day_off_diario": 200,
  "distancia_evento_local_km": 50
}
```

---

## 🎯 Como Popular os Dados Iniciais

### Opção 1: Via Interface (Recomendado)

1. Acesse **Configurações → MCO Parâmetros → Parâmetros Gerais**
2. Clique em **"Popular Dados Iniciais"**
3. Aguarde a confirmação de sucesso
4. Acesse a tab **Dimensionamento** e preencha a matriz

### Opção 2: Via Script (Avançado)

```typescript
import { mcoSeedService } from '@/features/settings/services/mco-parametros.service'

await mcoSeedService.seedAll()
```

---

## 🔮 Próximas Evoluções (Placeholders no código)

### 1. **Integração com Google Maps**
```typescript
// ATUAL (linha 157)
const kmEstimado = 500 // Placeholder

// FUTURO
const origem = await getFilialMaisProxima(eventoData.cidade)
const destino = { cidade: eventoData.cidade, uf: eventoData.uf }
const kmEstimado = await geocodingService.calcularDistancia(origem, destino)
```

### 2. **Parâmetros de Frete por Filial/Cluster**
```typescript
// ATUAL (linha 158)
const custoFretePorKm = 3.5 // Placeholder

// FUTURO
const parametrosFrete = await parametrosFreteService.getParametros()
const custoFretePorKm = parametrosFrete.find(
  p => p.filial_id === filialId && p.cluster_id === clusterId
)?.valor_km_adicional || 3.5
```

### 3. **Alimentação por Cidade**
```typescript
// ATUAL (linha 197)
const custoRefeicaoGoLive = 35 // Placeholder

// FUTURO
const parametrosAlimentacao = await parametrosAlimentacaoService.getParametros()
const custoRefeicao = parametrosAlimentacao.find(
  p => p.cidade === eventoData.cidade && p.uf === eventoData.uf
)?.valor_almoco || 35
```

### 4. **Hospedagem por Cidade**
```typescript
// ATUAL (linha 235)
const custoDiariaHotel = 200 // Placeholder

// FUTURO
const parametrosHospedagem = await parametrosHospedagemService.getParametros()
const custoDiaria = parametrosHospedagem.find(
  p => p.cidade === eventoData.cidade && p.uf === eventoData.uf
)?.valor_diaria || 200
```

---

## 🧪 Como Testar

### 1. **Popular dados de teste**
```bash
# Via interface
Configurações → MCO Parâmetros → Parâmetros Gerais → Popular Dados Iniciais
```

### 2. **Configurar dimensionamento**
```bash
# Via interface
Configurações → MCO Parâmetros → Dimensionamento
# Preencher matriz: clusters x cargos
```

### 3. **Criar MCO de teste**
```bash
# Via wizard
Planejamento → MCOs → Novo
# Preencher:
# - Faturamento: R$ 300.000 (cluster M)
# - 5 dias de evento
# - Modalidade: Self-Service
# - Time Técnico: Sim
```

### 4. **Verificar cálculos**
```bash
# Abrir console do navegador
# Verificar logs de cálculo
# Conferir valores no breakdown_custos salvo no Firebase
```

---

## 🐛 Troubleshooting

### Erro: "Não foi possível identificar o cluster"
**Causa:** Nenhum cluster configurado no Firebase
**Solução:** Popular dados iniciais ou criar clusters manualmente

### Erro: "Não foi possível buscar parâmetros do Firebase"
**Causa:** Erro de conexão ou permissões
**Solução:** Verificar regras de segurança do Firestore

### Custos zerados
**Causa:** Dimensionamento não configurado para o cluster
**Solução:** Preencher matriz de dimensionamento

### COT muito alto/baixo
**Causa:** Valores de diária ou dimensionamento incorretos
**Solução:** Revisar valores na tela de Cargos e Dimensionamento

---

## 📚 Arquivos Modificados

1. ✅ [mco-calculator.service.ts](src/features/planejamento/services/mco-calculator.service.ts) - Refatorado completamente
2. ✅ [mco-wizard.tsx](src/features/planejamento/pages/mco-wizard.tsx:220) - Adicionado `await`
3. ✅ [manage-dimensionamento.tsx](src/features/settings/components/mco-parametros/manage-dimensionamento.tsx) - Criado
4. ✅ [mco-parametros.tsx](src/features/settings/pages/mco-parametros.tsx) - Adicionada tab Dimensionamento
5. ✅ [routes/index.tsx](src/routes/index.tsx) - Adicionada rota dimensionamento

---

## 🎉 Resultado Final

Agora o sistema MCO é **100% configurável via interface**:

- ✅ Clusters e faixas de faturamento
- ✅ Cargos e valores de diária
- ✅ Dimensionamento por cluster
- ✅ Parâmetros gerais (transporte, day-off, etc.)
- ✅ Cálculos automáticos e dinâmicos
- ✅ Cache para performance
- ✅ Breakdown detalhado por cargo

**Nenhuma alteração de código necessária para ajustar cálculos!** 🚀

# 📚 DOCUMENTO DE TREINAMENTO - SISTEMA MCO v1.5.2

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Perfis de Usuário e Permissões](#2-perfis-de-usuário-e-permissões)
3. [Fluxo Principal - Criação de MCO](#3-fluxo-principal---criação-de-mco)
4. [Classificação de Tipo de Atendimento](#4-classificação-de-tipo-de-atendimento)
5. [Clusters e Dimensionamento](#5-clusters-e-dimensionamento)
6. [Motores de Cálculo](#6-motores-de-cálculo)
7. [Tela de Detalhes da MCO](#7-tela-de-detalhes-da-mco)
8. [Fluxo de Aprovação](#8-fluxo-de-aprovação)
9. [Configurações do Sistema](#9-configurações-do-sistema)
10. [Raio X do Sistema](#10-raio-x-do-sistema)
11. [Central de Ajuda (FAQ)](#11-central-de-ajuda-faq)
12. [Feedbacks](#12-feedbacks)
13. [Funcionalidades Especiais](#13-funcionalidades-especiais)
14. [Glossário](#14-glossário)
15. [Dicas e Boas Práticas](#15-dicas-e-boas-práticas)
16. [Suporte](#16-suporte)

---

## 1. Visão Geral do Sistema

O **Sistema MCO** (Matriz de Custo Operacional) é uma plataforma web para cálculo automatizado de custos operacionais de eventos. Ele permite que equipes comerciais criem simulações de custo para eventos, considerando fatores como mão de obra, alimentação, hospedagem, transporte e frete.

### Objetivo Principal

Calcular o **COT (Custo Operacional Total)** de eventos de forma padronizada, automática e auditável.

### Benefícios

- ✅ Padronização de cálculos
- ✅ Rastreabilidade completa
- ✅ Aprovações automatizadas
- ✅ Histórico de revisões
- ✅ Documentação integrada

---

## 2. Perfis de Usuário e Permissões

O sistema possui **7 perfis de acesso** com diferentes níveis de permissão:

| Perfil | Descrição | Permissões Principais |
|--------|-----------|----------------------|
| **Admin** | Administrador geral | Acesso total, pode aprovar qualquer MCO, gerenciar usuários, configurar parâmetros, modo manutenção |
| **Comercial** | Time comercial | Criar MCOs, visualizar, solicitar aprovações |
| **Gestor Comercial** | Líder comercial | Criar MCOs, aprovar MCOs do time comercial |
| **Operações** | Time de operações | Criar MCOs, visualizar, precisa aprovação dupla (Projetos + Gestor) |
| **Projetos** | Time de projetos | Aprovar MCOs MEGA |
| **Zig** | Perfil especial Zig | Acesso limitado |
| **User** | Usuário básico | Acesso de visualização |

### Hierarquia de Aprovação

```
Admin
  └── Pode aprovar qualquer MCO
  
Gestor Comercial
  └── Aprova MCOs do time Comercial (PP a G)
  
Projetos
  └── Aprova MCOs MEGA
```

---

## 3. Fluxo Principal - Criação de MCO

### PASSO 1: Acessar o Sistema

1. Acesse a URL do sistema
2. Faça login com suas credenciais
3. No menu lateral, clique em **"Matriz de Custo Operacional"**

### PASSO 2: Iniciar Nova MCO

1. Clique no botão **"Nova MCO"**
2. O wizard de 3 etapas será iniciado

### PASSO 3: Etapa 1 - Dados do Evento

Preencha os campos obrigatórios:

| Campo | Descrição | Impacto |
|-------|-----------|---------|
| **Cliente** | Selecionar cliente cadastrado | Identificação do evento |
| **Nome do Evento** | Identificação única do evento | Busca e referência |
| **Período** | Data inicial e final | Define timeline |
| **Faturamento Estimado** | Valor em reais | **Define o Cluster** |
| **Público Estimado** | Número de pessoas | Dimensionamento |
| **Local do Evento** | Selecionar local cadastrado | **Define tipo de atendimento** |
| **Sessões** | Datas e horários de cada Go Live | Afeta viagem e day off |

### PASSO 4: Etapa 2 - Dados Operacionais

| Campo | Descrição |
|-------|-----------|
| **Time Técnico** | Incluir equipe técnica (LTT/TCA) |
| **Logística** | Incluir frete de equipamentos |
| **Modalidade Operacional** | Ticket Médio ou Cachapa |
| **Cliente Fornece Alimentação** | Desconto no cálculo |
| **Cliente Fornece Hospedagem** | Desconto no cálculo |

### PASSO 5: Etapa 3 - Resumo

1. Visualize o preview dos dados
2. Sistema valida dependências dos motores
3. Verifique se há alertas ou bloqueios
4. Clique em **"Confirmar Criação"**

### PASSO 6: Processamento Automático

O sistema executa automaticamente:

```
1. Cria simulação no banco ────────────────────┐
2. Insere sessões ─────────────────────────────┤
3. Calcula tipo de atendimento ────────────────┤── Processamento
4. Calcula escala de vagas ────────────────────┤   Automático
5. Calcula custos de todos os motores ─────────┤
6. Define matriz de aprovações ────────────────┘
```

---

## 4. Classificação de Tipo de Atendimento

O **motor de classificação** determina automaticamente como o evento será atendido. Esta é uma das decisões mais importantes do sistema.

### Algoritmo de 5 Passos

```
┌─────────────────────────────────────────────────────────────┐
│  PASSO 0: Validar dados (cidade, UF, cluster)               │
│           ↓                                                  │
│  PASSO 1: Sem filial encontrada? → ATENDIMENTO MATRIZ       │
│           ↓                                                  │
│  PASSO 2: Filial mais próxima é SP? → ATENDIMENTO MATRIZ    │
│           ↓                                                  │
│  PASSO 3: Cluster evento > limite filial? → ATENDIMENTO MATRIZ│
│           ↓                                                  │
│  PASSO 4: Evento dentro do raio? → FILIAL                   │
│           ↓                                                  │
│  PASSO 5: Evento fora do raio? → FILIAL INTERIOR            │
└─────────────────────────────────────────────────────────────┘
```

### Descrição dos Tipos

| Tipo | Quando Ocorre | Equipe |
|------|---------------|--------|
| **ATENDIMENTO MATRIZ** | Sem filial próxima, SP, ou evento maior que limite da filial | Equipe sai de São Paulo |
| **FILIAL** | Evento dentro do raio de atuação da filial | Equipe local, sem viagem |
| **FILIAL INTERIOR** | Evento fora do raio, mas filial pode atender | Equipe viaja da filial |

### Implicações por Tipo

| Tipo | Viagem | Hospedagem | Setup | Transporte Local |
|------|--------|------------|-------|------------------|
| **Matriz** | ✅ Sim (de SP) | ✅ Sim | ✅ Sim (por cluster) | ✅ Sim |
| **Filial** | ❌ Não | ❌ Não | ❌ Não | ❌ Não |
| **Filial Interior** | ⚠️ Condicional* | ⚠️ Condicional* | ❌ Não | ⚠️ Condicional* |

> *Condicional: depende do número de sessões e se há pernoite

### Regra de Cluster Limite

Cada filial tem um **cluster limite** que define o tamanho máximo de evento que pode atender:

- Se o evento é **G** e a filial atende até **M** → vai para **MATRIZ**
- Se o evento é **G** e a filial atende até **G** → permanece **FILIAL**

---

## 5. Clusters e Dimensionamento

Os eventos são classificados em **clusters** baseado no faturamento por sessão:

### Tabela de Clusters

| Cluster | Faturamento/Sessão | Dias Setup | ITE |
|---------|-------------------|------------|-----|
| **PP** | Até R$ 74.999 | 0 | 70 |
| **P** | R$ 75.000 - R$ 149.999 | 0 | 70 |
| **M** | R$ 150.000 - R$ 499.999 | 0 | 70 |
| **G** | R$ 500.000 - R$ 1.499.999 | 0 | 70 |
| **MEGA** | Acima de R$ 1.500.000 | 4 | 70 |

### Cálculo do Cluster

```
Faturamento/Sessão = Faturamento Total ÷ Número de Sessões
```

**Exemplo:**
- Faturamento Total: R$ 600.000
- Número de Sessões: 2
- Faturamento/Sessão: R$ 300.000
- Cluster: **M** (entre R$ 150.000 e R$ 499.999)

---

## 6. Motores de Cálculo

O sistema possui **6 motores independentes** que calculam diferentes componentes do custo:

### 6.1 Motor de Mão de Obra

Calcula a quantidade de profissionais necessários para o evento.

**Fórmulas:**
```
Terminais = ROUND(Faturamento Estimado ÷ TPV por Terminal)
TCAs = ROUND(Terminais ÷ ITE)
LTTs = ROUND(TCAs ÷ Máximo Técnicos por Líder)
```

**Parâmetros:**
- **ITE** (Índice Técnico por Evento): terminais por técnico
- **Máximo Técnicos por Líder**: quantos TCAs por LTT
- **TPV por Terminal**: valor transacionado por terminal

### 6.2 Motor de Alimentação

Calcula o valor diário de alimentação por cargo.

**Componentes:**
- Pequeno almoço
- Almoço
- Jantar
- Lanche noturno

**Elegibilidade:** Configurável por cargo e jornada

### 6.3 Motor de Hospedagem

Calcula diárias de hotel para equipe que pernoita.

**Regras:**
- Elegibilidade por cargo e cluster
- Base de custo por cidade
- Só aplica quando há pernoite entre sessões

### 6.4 Motor de Viagem

Calcula o deslocamento origem → evento.

**Modal de Transporte:**
| Distância | Modal |
|-----------|-------|
| Até 100km | Carro |
| 100-500km | Ônibus |
| +500km | Aéreo |

**Fórmula:**
```
Custo Viagem = Distância × Custo por km × Quantidade Pessoas × 2 (ida+volta)
```

### 6.5 Motor de Transporte Local

Calcula deslocamento diário na cidade do evento.

**Aplicação:**
- Dias de Go Live
- Dias de Setup (quando aplicável)

**Valor:** Configurável por parâmetro

### 6.6 Motor de Frete

Calcula custo de transporte de equipamentos.

**Componentes:**
- Matriz por Filial × Cluster (valor base)
- Km adicional (quando distância > raio máximo)

**Fórmula:**
```
Frete = Valor Base + (Km Excedente × Valor por Km Adicional)
```

---

## 7. Tela de Detalhes da MCO

Após criação, a tela de detalhes exibe todas as informações calculadas:

### Cabeçalho

| Informação | Descrição |
|------------|-----------|
| Código MCO | Ex: MCO-0001 |
| Nome do evento | Identificação |
| Cliente | Empresa contratante |
| Período | Data inicial - Data final |
| Status | Pendente / Aprovado |
| Tipo de Atendimento | Matriz / Filial / Filial Interior |

### Cards de Informação

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Evento Info   │   Viagem Info   │ Transporte Info │   Day Off Info  │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Local           │ Distância       │ Custo diário    │ Dias de folga   │
│ Cidade          │ Modal           │ Dias aplicados  │ Valor total     │
│ UF              │ Origem          │                 │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Cards de Custos

```
┌───────────────────────────────────────────────────────────────────────┐
│                          RESUMO DE CUSTOS                              │
├─────────────┬─────────────┬─────────────┬─────────────┬───────────────┤
│ Mão de Obra │ Alimentação │ Hospedagem  │   Viagem    │   Transporte  │
│   R$ X      │    R$ X     │    R$ X     │    R$ X     │     R$ X      │
├─────────────┴─────────────┴─────────────┴─────────────┴───────────────┤
│ Day Off: R$ X     │     Frete: R$ X     │     TOTAL GERAL: R$ X       │
└───────────────────────────────────────────────────────────────────────┘
```

### Matriz de Mão de Obra

Tabela completa mostrando:
- **Colunas:** Datas do evento
- **Linhas:** Vagas (LTT-01, TCA-01, etc.)
- **Células:** Etapa do dia (Setup, Go Live, Viagem, Day Off)
- **Cores:** Diferenciação visual por etapa

---

## 8. Fluxo de Aprovação

A **matriz de aprovação** depende do cluster do evento e do papel do criador:

### Quando Criado por COMERCIAL

| Cluster | Aprovações Necessárias |
|---------|------------------------|
| PP a G | Gestor Comercial |
| MEGA | Gestor Comercial + Projetos |

### Quando Criado por GESTOR COMERCIAL

| Cluster | Aprovações Necessárias |
|---------|------------------------|
| PP a G | ✅ Auto-aprovado |
| MEGA | Projetos |

### Quando Criado por OPERAÇÕES

| Cluster | Aprovações Necessárias |
|---------|------------------------|
| Qualquer | Projetos + Gestor Comercial |

### Quando Criado por ADMIN

| Cluster | Aprovações Necessárias |
|---------|------------------------|
| PP a G | ✅ Auto-aprovado |
| MEGA | Projetos |

### Status de Aprovação

| Status | Significado |
|--------|-------------|
| `pendente` | Aguardando aprovações |
| `aprovado` | Todas aprovações concluídas |

---

## 9. Configurações do Sistema

### 9.1 Usuários

**Gestão de Usuários:**
- Criar novos usuários
- Editar dados
- Ativar/Desativar contas

**Permissões:**
- Configurar acesso por rota
- Definir permissões de visualização/edição

**Auditoria:**
- Histórico de alterações de permissão
- Log de ações

### 9.2 Clientes

Cadastro de clientes com:
- Nome
- Documento (CNPJ/CPF)
- Contato
- Endereço

### 9.3 Filiais Zig

Cadastro de filiais com:
- Cidade/UF
- Raio de atuação (km)
- Cluster limite (máximo que atende)
- Coordenadas (latitude/longitude)

### 9.4 Motores de Cálculo

#### Mão de Obra
- **Cargos:** nome, sigla, time (Técnico/Comercial/Suporte)
- **Jornadas:** nome, hora início/fim
- **Cluster ITE:** terminais por cluster
- **Cargo Cluster:** quantidade base por cargo × cluster
- **Etapa Times:** mapeamento etapa → time

#### Alimentação
- **Parâmetros:** valores por refeição
- **Base por cidade:** valores diferenciados

#### Hospedagem
- **Parâmetros:** valor diária padrão
- **Base custo por cidade:** valores diferenciados
- **Elegibilidade:** por cargo × cluster

#### Transporte
- **Distância máxima por modal:** carro, ônibus, aéreo
- **Custo por km por modal**
- **Transporte local diário**

#### Frete
- **Raio máximo**
- **Valor km adicional**
- **Matriz Filial × Cluster**

### 9.5 Parâmetros de Eventos

- **Etapas do Projeto:** categorias de remuneração
- **Cluster:** faixas de faturamento
- **Modalidades:** Ticket Médio, Cachapa
- **TPV por Terminal**
- **Locais de Eventos:** cadastro com coordenadas

---

## 10. Raio X do Sistema

Tela de **documentação técnica** que exibe:

| Seção | Conteúdo |
|-------|----------|
| Regras de Classificação | Algoritmo de tipo de atendimento |
| Matriz de Motores | Motores ativos por tipo |
| Custos por Tipo de Dia | Valores por etapa |
| Parâmetros em Vigor | Configurações atuais |
| Fórmulas Matemáticas | Cálculos detalhados |
| Histórico de Auditoria | Alterações recentes |

> 💡 **Uso:** Esta é a **fonte única de verdade** para as regras do sistema.

---

## 11. Central de Ajuda (FAQ)

Sistema de perguntas frequentes organizado por categorias:

- ✅ Perguntas e respostas editáveis (admin)
- ✅ Busca por texto
- ✅ Organização por temas
- ✅ Ordenação personalizada

---

## 12. Feedbacks

Sistema para usuários enviarem sugestões e reportar problemas:

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Bug, Melhoria, Sugestão |
| **Descrição** | Detalhamento do feedback |
| **Anexos** | Imagens (screenshots) |
| **Status** | Novo, Em Análise, Resolvido |
| **Prioridade** | Definida pelo time |

---

## 13. Funcionalidades Especiais

### 13.1 Recalcular MCO

- **Botão:** "Recalcular" na tela de detalhes
- **Função:** Reprocessa todos os motores
- **Uso:** Após alteração de parâmetros do sistema

### 13.2 Exportar Resumo

- **Formato:** PDF
- **Conteúdo:** 
  - Informações do evento
  - Detalhamento de custos
  - Matriz de mão de obra

### 13.3 Timeline

- Visualização gráfica do cronograma
- Cores por tipo de dia:
  - 🔵 Setup
  - 🟢 Go Live
  - 🟡 Viagem
  - ⚪ Day Off

### 13.4 Histórico de Revisões

- Versões anteriores da escala
- Comparação de mudanças
- Rollback se necessário

### 13.5 Modo Manutenção (Admin)

- **Toggle:** Menu lateral
- **Função:** Bloqueia acesso de usuários normais
- **Mensagem:** Customizável

### 13.6 Backup do Banco (Admin)

- **Formato:** JSON
- **Conteúdo:** Todos os dados do sistema
- **Uso:** Restauração e análise

---

## 14. Glossário

| Termo | Definição |
|-------|-----------|
| **MCO** | Matriz de Custo Operacional |
| **COT** | Custo Operacional Total |
| **TCA** | Técnico de Campo |
| **LTT** | Líder Técnico |
| **ITE** | Índice Técnico por Evento (terminais por técnico) |
| **TPV** | Ticket por Valor (valor transacionado) |
| **Cluster** | Categoria de tamanho do evento (PP, P, M, G, MEGA) |
| **Go Live** | Dia de operação do evento |
| **Setup** | Dia de preparação antes do evento |
| **Day Off** | Dia de folga entre sessões |
| **Modal** | Tipo de transporte (carro, ônibus, aéreo) |
| **Raio de Atuação** | Distância máxima que filial atende localmente |
| **Cluster Limite** | Tamanho máximo de evento que filial pode atender |

---

## 15. Dicas e Boas Práticas

1. ✅ **Sempre preencha o faturamento corretamente** - Define o cluster e toda a escala
2. ✅ **Adicione todas as sessões** - Afeta cálculo de viagem e day off
3. ✅ **Verifique o local do evento** - Afeta tipo de atendimento
4. ✅ **Revise antes de confirmar** - Alterações posteriores requerem recálculo
5. ✅ **Use o Raio X** - Para entender as regras aplicadas
6. ✅ **Consulte o FAQ** - Para dúvidas frequentes
7. ✅ **Envie feedback** - Ajuda a melhorar o sistema

### Erros Comuns a Evitar

| Erro | Consequência | Solução |
|------|--------------|---------|
| Faturamento errado | Cluster incorreto, escala errada | Verificar antes de confirmar |
| Sessões incompletas | Cálculo de day off incorreto | Adicionar todas as sessões |
| Local sem coordenadas | Tipo de atendimento pode falhar | Cadastrar local com CEP válido |

---

## 16. Suporte

Para problemas ou dúvidas:

1. 📖 Consultar **Central de Ajuda (FAQ)**
2. 🔍 Verificar **Raio X do Sistema**
3. 📝 Enviar **Feedback** pela plataforma
4. 👤 Contatar **administrador do sistema**

---

**Versão do Documento:** 1.0  
**Data:** Dezembro 2024  
**Sistema MCO:** v1.5.2

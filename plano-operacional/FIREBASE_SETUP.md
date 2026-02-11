# 🔥 Configuração do Firebase para MCO

## ✅ Status da Implementação

- ✅ **Calculator Service** - Implementado e funcional
- ✅ **Firebase Integration** - Código pronto e integrado
- ⚠️ **Firestore Collection** - Precisa ser criada no console

---

## 📊 Estrutura da Collection `mcos`

### Collection: `mcos`

Cada documento MCO tem a seguinte estrutura:

```typescript
{
  // IDs e Código
  codigo: string,                    // Ex: "MCO-0001"

  // Dados do Evento
  nome_evento: string,               // Ex: "Festival de Música SP"
  cidade: string,                    // Ex: "São Paulo"
  uf: string,                        // Ex: "SP"
  data_inicial: string,              // Ex: "2024-03-15" (YYYY-MM-DD)
  data_final: string,                // Ex: "2024-03-17" (YYYY-MM-DD)
  num_sessoes: number,               // Ex: 3

  // Financeiro
  faturamento_estimado: string,      // Ex: "500000"
  publico_estimado: string,          // Ex: "50000"
  custo_operacional_efetivo: number, // Ex: 125000 (calculado)
  cot: number,                       // Ex: 25 (percentual calculado)

  // Cliente
  cliente_id: string | null,         // ID do HubSpot/Firebase
  cliente_nome: string,              // Ex: "Empresa ABC"

  // Status e Workflow
  status: "pendente" | "aprovado" | "rejeitado",
  responsavel_nome: string,          // Opcional

  // Dados Operacionais (NOVO)
  modalidade_id: string,             // Ex: "1" (Self-Service)
  time_tecnico: boolean,             // true/false
  logistica: boolean,                // true/false
  cliente_fornece_alimentacao: boolean,
  cliente_fornece_hospedagem: boolean,

  // Breakdown de Custos (NOVO)
  breakdown_custos: {
    mao_de_obra: {
      tca: number,
      ltt: number,
      coordenacao: number,
      total: number
    },
    logistica: {
      frete: number,
      equipamentos: number,
      total: number
    },
    alimentacao: {
      go_live: number,
      time_alpha: number,
      total: number
    },
    hospedagem: {
      time_alpha: number,
      total: number
    },
    total_geral: number,
    cot_percentual: number
  },

  // Metadados
  created_at: Timestamp,             // Auto
  updated_at: Timestamp,             // Auto

  // Opcional (classificação)
  porte: string,                     // "Pequeno", "Médio", "Grande"
  tipo_atendimento: string           // "atendimento_matriz", "filial", etc
}
```

---

## 🚀 Passos para Configurar

### 1. **Criar a Collection no Firebase Console**

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Clique em **Start collection**
5. Nome da collection: `mcos`
6. Crie um documento de teste (pode deletar depois)

### 2. **Configurar Índices** (Opcional, mas recomendado)

Para queries otimizadas, crie índices para:
- `updated_at` (desc) + `status` (asc)
- `cliente_id` (asc) + `updated_at` (desc)
- `cidade` (asc) + `data_inicial` (desc)

### 3. **Regras de Segurança**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // MCOs - apenas usuários autenticados
    match /mcos/{mcoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
      // TODO: Adicionar validação de permissões por papel (admin, gestor, etc)
    }
  }
}
```

---

## 📝 Como Testar

### 1. **Criar uma MCO**
1. Acesse `/planejamento/mcos/novo`
2. Preencha os dados do evento
3. Configure o modelo operacional
4. Revise e clique em "Criar MCO"
5. ✅ Deve aparecer na lista com **valores calculados**

### 2. **Verificar no Firebase**
1. Abra o Firebase Console
2. Vá em Firestore Database
3. Abra a collection `mcos`
4. Veja o documento criado com todos os campos

### 3. **Verificar Cálculos**
Os custos devem estar calculados automaticamente:
- `custo_operacional_efetivo` > 0
- `cot` > 0
- `breakdown_custos` completo

---

## 🔧 Próximas Melhorias

### 1. **Parâmetros Dinâmicos**
Atualmente os custos são fixos no código. Criar collection:
```
parametros_custos/
  └─ default/
      ├─ custo_tca_dia: 180
      ├─ custo_ltt_dia: 150
      ├─ custo_coordenador_dia: 250
      ├─ custo_refeicao_go_live: 35
      └─ ...
```

### 2. **Modalidades no Firebase**
```
modalidades/
  ├─ self-service/
  ├─ atendimento-assistido/
  ├─ hibrido/
  └─ cashless/
```

### 3. **Histórico de Alterações**
```
mcos/{mcoId}/historico/
  └─ {timestamp}/
      ├─ campo_alterado
      ├─ valor_anterior
      ├─ valor_novo
      └─ usuario
```

### 4. **Validação de Dados**
Adicionar validação nas regras do Firestore:
```javascript
match /mcos/{mcoId} {
  allow create: if request.auth != null
    && request.resource.data.codigo is string
    && request.resource.data.status in ['pendente', 'aprovado', 'rejeitado']
    && request.resource.data.custo_operacional_efetivo >= 0;
}
```

---

## 🎯 Checklist Final

- [ ] Collection `mcos` criada no Firestore
- [ ] Regras de segurança configuradas
- [ ] Testado: Criar MCO pelo wizard
- [ ] Testado: Listar MCOs na dashboard
- [ ] Testado: Ver detalhes de uma MCO
- [ ] Testado: Aprovar/Rejeitar MCO
- [ ] Verificado: Custos sendo calculados corretamente

---

## 🐛 Troubleshooting

### "Missing or insufficient permissions"
- Verifique as regras de segurança do Firestore
- Certifique-se de que o usuário está autenticado

### "Cannot read property of undefined"
- Verifique se o `.env` tem todas as variáveis do Firebase
- Confirme que `db` está sendo importado corretamente

### Custos zerados
- Verifique se `mcoCalculatorService` está sendo chamado
- Confira os logs do console para erros de cálculo

---

## 📚 Documentação

- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Indexing Best Practices](https://firebase.google.com/docs/firestore/query-data/indexing-best-practices)

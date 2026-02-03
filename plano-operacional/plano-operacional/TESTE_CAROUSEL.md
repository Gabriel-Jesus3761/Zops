# Guia de Teste - Carrossel de Login

## Status Atual

✅ **Desenvolvimento Desbloqueado**: O sistema está configurado para permitir testes e desenvolvimento.

⚠️ **Modo Temporário**: Algumas verificações de segurança estão desabilitadas. Ver [SEGURANCA_PRODUCAO.md](./SEGURANCA_PRODUCAO.md) para checklist de produção.

---

## Como Testar

### 1. Acessar Configurações

1. Faça login no sistema normalmente
2. Navegue para **Configurações** no menu
3. Selecione a aba **Aparência**
4. Você verá a seção "Carrossel de Login"

### 2. Upload de Imagens

**Adicionar Imagens:**
1. Clique em "Adicionar Imagem" ou arraste arquivos para a área de upload
2. Formatos aceitos: JPG, PNG, WebP
3. Tamanho máximo: **300MB** por imagem
4. Máximo de **10 imagens**

**Processamento Automático:**
- As imagens serão automaticamente:
  - Redimensionadas para 1920x1080 (mantendo proporção)
  - Convertidas para WebP (85% de qualidade)
  - Enviadas para Firebase Storage

**Visualização:**
- Preview da imagem aparece imediatamente
- Nome do arquivo e tamanho exibidos
- Botão de remover (X) disponível

### 3. Configurar Intervalo

1. Use o slider ou campo numérico para ajustar o intervalo
2. Intervalo: **3 a 10 segundos**
3. Padrão: **5 segundos**

### 4. Ativar/Desativar Transições

- Toggle "Ativar transições suaves"
- Quando ativo: fade de 1 segundo entre imagens
- Quando inativo: mudança imediata

### 5. Salvar Configuração

1. Clique em "Salvar Configuração"
2. Toast de confirmação deve aparecer
3. As alterações serão aplicadas imediatamente

### 6. Visualizar na Tela de Login

1. Faça logout (ou abra em aba anônima)
2. Acesse a tela de login
3. O carrossel deve estar funcionando com suas imagens

**Comportamento Esperado:**
- Se configurou imagens: carrossel alterna entre elas
- Se não configurou: mostra imagem padrão (bg3.webp)
- Transições suaves (fade) se ativado
- Mudança automática no intervalo configurado

---

## Verificações de Funcionamento

### ✅ Upload
- [ ] Upload de JPG funciona
- [ ] Upload de PNG funciona
- [ ] Upload de WebP funciona
- [ ] Arquivo muito grande (>300MB) é rejeitado
- [ ] Formato inválido (ex: PDF) é rejeitado
- [ ] Preview aparece após upload
- [ ] URL do Firebase Storage é gerada

### ✅ Gerenciamento
- [ ] Remover imagem funciona
- [ ] Reordenar imagens funciona (arrastar e soltar)
- [ ] Limite de 10 imagens é respeitado
- [ ] Salvar configuração persiste no localStorage

### ✅ Visualização
- [ ] Carrossel aparece na tela de login
- [ ] Imagens trocam automaticamente
- [ ] Intervalo configurado é respeitado
- [ ] Transições suaves funcionam
- [ ] Fallback para bg3.webp quando sem imagens
- [ ] Imagens carregam de forma responsiva

### ✅ Performance
- [ ] Imagens são otimizadas (WebP, 1920x1080)
- [ ] Carregamento não trava a UI
- [ ] Transições são fluidas
- [ ] Não há flickering entre imagens

---

## Estrutura de Arquivos

### Configuração
- **localStorage key**: `login-carousel-config`
- **Estrutura**:
  ```json
  {
    "images": [
      {
        "id": "uuid-v4",
        "url": "https://firebasestorage.googleapis.com/...",
        "storagePath": "login-carousel/uuid-v4",
        "fileName": "imagem.jpg",
        "size": 1234567,
        "addedAt": "2026-01-27T..."
      }
    ],
    "interval": 5000,
    "enableTransitions": true
  }
  ```

### Firebase Storage
- **Bucket**: `zops-mobile.appspot.com`
- **Path**: `login-carousel/{imageId}`
- **Metadata**:
  - `contentType`: image/webp
  - `originalName`: nome original do arquivo
  - `uploadedAt`: timestamp ISO
  - `uploadedBy`: 'dev-mode' (será userId quando auth estiver ativo)

---

## Console do Navegador

Durante os testes, observe o console para logs úteis:

**Upload bem-sucedido:**
```
⚠️ [DEV] Fazendo upload para: login-carousel/abc-123 (auth temporariamente desabilitada)
Imagem carregada com sucesso!
```

**Erro de upload:**
```
Erro ao fazer upload da imagem: [detalhes]
```

**Carrossel em ação:**
```
LoginCarousel montado com X imagens
Mudando para imagem: Y
```

---

## Problemas Conhecidos

### ⚠️ Autenticação Desabilitada (Temporário)

**Sintoma**: Mensagens no console indicam "auth temporariamente desabilitada"

**Causa**: Cloud Function `employeeLogin` não retorna Firebase Custom Token

**Impacto**:
- Upload funciona normalmente em desenvolvimento
- ⚠️ **NÃO SEGURO para produção** - qualquer pessoa pode fazer upload

**Resolução**: Ver [SEGURANCA_PRODUCAO.md](./SEGURANCA_PRODUCAO.md)

---

## Troubleshooting

### Upload Falha com "storage/unauthorized"

**Causa**: Rules do Firebase não foram deployed
**Solução**:
```bash
cd plano-operacional
firebase deploy --only storage
```

### Imagens Não Aparecem na Tela de Login

**Verificar**:
1. Configuração foi salva? (checar localStorage)
2. URLs das imagens são válidas? (abrir URL no navegador)
3. Carrossel está sendo renderizado? (inspecionar DOM)
4. Console mostra erros de carregamento?

### Transições Não Funcionam

**Verificar**:
1. Toggle "Ativar transições suaves" está ativo?
2. Browser suporta CSS transitions?
3. Inspecionar estilos aplicados no elemento

### Imagens Muito Grandes

**Causa**: Imagem original era muito grande e não foi otimizada
**Solução**: O processador de imagem deve redimensionar automaticamente
**Debug**: Verificar tamanho final no Firebase Storage console

---

## Referências

- **Código fonte**: `src/features/settings/components/appearance/`
- **Tela de login**: `src/features/auth/components/login-carousel.tsx`
- **Documentação de segurança**: [SEGURANCA_PRODUCAO.md](./SEGURANCA_PRODUCAO.md)
- **Autenticação**: [AUTENTICACAO_FIREBASE.md](./AUTENTICACAO_FIREBASE.md)

---

## Próximos Passos

Após concluir os testes:

1. ✅ Funcionalidade básica funciona
2. ⏳ Aguardar correção da Cloud Function (Custom Token)
3. ⏳ Restaurar verificações de autenticação
4. ⏳ Deploy de produção

---

**Última atualização**: 27/01/2026
**Status**: Pronto para testes de desenvolvimento

# Checklist de Segurança para Produção

## ⚠️ IMPORTANTE: Itens Temporários que DEVEM ser corrigidos antes de produção

### 1. Firebase Storage Rules - Login Carousel

**Status Atual**: ❌ Temporariamente desprotegido para desenvolvimento

**Arquivo**: `storage.rules`

**Problema**:
As regras permitem upload/delete SEM autenticação para permitir desenvolvimento enquanto a Cloud Function não retorna Custom Token válido.

**Regra Atual (INSEGURA)**:
```
match /login-carousel/{imageId} {
  allow read: if true;
  allow write, delete: if request.resource.size <= 300 * 1024 * 1024
    && request.resource.contentType.matches('image/(jpeg|png|webp)');
}
```

**Regra de Produção (SEGURA)**:
```
match /login-carousel/{imageId} {
  allow read: if true;
  allow write, delete: if request.auth != null  // ← RESTAURAR ESTA LINHA
    && request.resource.size <= 300 * 1024 * 1024
    && request.resource.contentType.matches('image/(jpeg|png|webp)');
}
```

**Ação Necessária**:
1. Modificar Cloud Function `employeeLogin` para retornar Firebase Custom Token:
   ```typescript
   const customToken = await admin.auth().createCustomToken(userId, {
     email: user.email,
     permission: user.permission,
   })
   ```
2. Restaurar linha `if request.auth != null` nas storage rules
3. Deploy das regras atualizadas: `firebase deploy --only storage`

---

### 2. Client-Side Authentication Check

**Status Atual**: ❌ Validação comentada

**Arquivo**: `src/features/settings/services/carousel-storage.service.ts`

**Problema**:
Verificação de `auth.currentUser` está comentada para permitir desenvolvimento.

**Código Atual (INSEGURO)**:
```typescript
static async uploadImage(file: File, imageId: string): Promise<LoginCarouselImage> {
  // NOTA: Verificação de autenticação temporariamente comentada
  // const currentUser = auth.currentUser
  // if (!currentUser) {
  //   throw new Error('Usuário não autenticado...')
  // }
```

**Código de Produção (SEGURO)**:
```typescript
static async uploadImage(file: File, imageId: string): Promise<LoginCarouselImage> {
  // Verificar autenticação
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('Usuário não autenticado. Faça login novamente para fazer upload de imagens.')
  }
```

**Ação Necessária**:
1. Após Cloud Function retornar Custom Token válido
2. Descomentar validação de `auth.currentUser`
3. Testar que upload funciona com autenticação
4. Testar que upload FALHA sem autenticação

---

## Fluxo de Correção

### Passo 1: Atualizar Cloud Function (Backend)
```typescript
// functions/src/employeeLogin.ts
import * as admin from 'firebase-admin'

export const employeeLogin = functions.https.onRequest(async (req, res) => {
  const { email, password } = req.body

  // Validar credenciais (código existente)
  const user = await validateUser(email, password)

  // ADICIONAR: Criar Custom Token do Firebase
  const customToken = await admin.auth().createCustomToken(user.uid, {
    email: user.email,
    permission: user.permission,
  })

  return res.json({
    userId: user.id,
    user: user.name,
    token: customToken,  // ← DEVE ser Firebase Custom Token
    permission: user.permission,
  })
})
```

### Passo 2: Testar Autenticação (Frontend)
1. Fazer login e verificar console:
   - Deve aparecer: "✅ Usuário autenticado no Firebase Auth"
   - NÃO deve aparecer erro de `auth/missing-identifier`

2. Verificar que `auth.currentUser` não é null:
   ```javascript
   import { auth } from '@/config/firebase'
   console.log('Current User:', auth.currentUser)
   // Deve retornar: { uid, email, ... }
   ```

### Passo 3: Restaurar Segurança (Frontend + Rules)
1. Descomentar validação em `carousel-storage.service.ts`
2. Restaurar linha `if request.auth != null` em `storage.rules`
3. Deploy das rules: `firebase deploy --only storage`

### Passo 4: Testar Segurança
1. ✅ Fazer login → upload deve funcionar
2. ✅ Fazer logout → upload deve falhar com erro de autenticação
3. ✅ Browser sem login → upload deve falhar
4. ✅ Verificar regras no Firebase Console

---

## Verificação Final Antes de Produção

- [ ] Cloud Function retorna Firebase Custom Token
- [ ] Login autentica no Firebase Auth (`auth.currentUser` populado)
- [ ] Validação de `auth.currentUser` ativa no código
- [ ] Storage rules requerem `request.auth != null`
- [ ] Rules deployed: `firebase deploy --only storage`
- [ ] Teste: upload funciona apenas quando autenticado
- [ ] Teste: upload falha sem autenticação

---

## Referências

- **Documentação da Integração**: `plano-operacional/AUTENTICACAO_FIREBASE.md`
- **Firebase Custom Tokens**: https://firebase.google.com/docs/auth/admin/create-custom-tokens
- **Storage Security Rules**: https://firebase.google.com/docs/storage/security

---

**AVISO**: NÃO fazer deploy em produção até todos os itens acima estarem ✅ completos.

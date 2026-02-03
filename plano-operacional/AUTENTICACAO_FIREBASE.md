# Integração de Autenticação Custom com Firebase Auth

## Problema Identificado

O sistema usa autenticação customizada via Cloud Function `employeeLogin`, mas **não autenticava no Firebase Auth SDK**, causando:

- ❌ `auth.currentUser` = `null`
- ❌ `request.auth` = `null` nas regras do Storage
- ❌ Erro `storage/unauthorized` ao fazer upload

## Solução Implementada

### 1. Login: Autenticar no Firebase Auth

**Arquivo**: `src/features/auth/hooks/use-login.ts`

```typescript
// Após receber token da Cloud Function
await signInWithCustomToken(auth, response.token)
```

Agora após o login:
- ✅ `auth.currentUser` tem dados do usuário
- ✅ `request.auth` é populado nas regras
- ✅ Upload no Storage funciona

### 2. Logout: Deslogar do Firebase Auth

**Arquivo**: `src/features/auth/hooks/use-auth.ts`

```typescript
logout: async () => {
  await signOut(auth)
  // Limpar store local
}
```

## IMPORTANTE: Verificar Cloud Function

Para que isso funcione, a Cloud Function `employeeLogin` **precisa retornar um Firebase Custom Token**.

### Verificar se o Token é Válido

O token retornado por `employeeLogin` deve ser criado assim (no backend):

```typescript
// functions/src/employeeLogin.ts
import * as admin from 'firebase-admin'

export const employeeLogin = functions.https.onRequest(async (req, res) => {
  const { email, password } = req.body

  // 1. Validar credenciais (seu código atual)
  const user = await validateUser(email, password)

  // 2. Criar Custom Token do Firebase
  const customToken = await admin.auth().createCustomToken(user.uid, {
    email: user.email,
    permission: user.permission,
    // outros claims customizados
  })

  // 3. Retornar o custom token
  return res.json({
    userId: user.id,
    user: user.name,
    token: customToken,  // ← Este é o Firebase Custom Token
    permission: user.permission,
  })
})
```

### Se a Cloud Function NÃO Gera Custom Token

Existem duas opções:

#### Opção A: Modificar Cloud Function (Recomendado)

Adicione a geração de custom token na função:

```typescript
const customToken = await admin.auth().createCustomToken(userId)
```

#### Opção B: Criar Usuário no Firebase Auth

Se não puder modificar a Cloud Function, crie usuário no Firebase Auth:

```typescript
// No código da aplicação (não recomendado)
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

// Criar usuário se não existir
try {
  await createUserWithEmailAndPassword(auth, email, temporaryPassword)
} catch (error) {
  if (error.code !== 'auth/email-already-in-use') throw error
}

// Login no Firebase Auth
await signInWithEmailAndPassword(auth, email, temporaryPassword)
```

## Testando

### 1. Verificar se Token é Custom Token

```typescript
// No console do navegador após login
console.log('Token:', useAuth.getState().token)
// Custom token tem formato: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Verificar Autenticação

```typescript
// No console
import { auth } from '@/config/firebase'
console.log('User:', auth.currentUser)
// Deve retornar objeto com uid, email, etc.
```

### 3. Testar Upload

1. Faça login
2. Vá em Configurações → Aparência
3. Tente fazer upload de uma imagem
4. Deve funcionar sem erro `storage/unauthorized`

## Fluxo Completo

### Antes (❌ Não Funcionava)

```
1. employeeLogin() → JWT Token
2. Salvar no Zustand
3. auth.currentUser = null ❌
4. Upload falha: unauthorized ❌
```

### Agora (✅ Funciona)

```
1. employeeLogin() → Custom Token
2. signInWithCustomToken() ✅
3. auth.currentUser = { uid, email, ... } ✅
4. Upload funciona ✅
```

## Logs para Debug

O código agora imprime logs úteis:

```
✅ Usuário autenticado no Firebase Auth  (login sucesso)
⚠️ Erro ao autenticar no Firebase: ...  (se token inválido)
✅ Deslogado do Firebase Auth             (logout sucesso)
```

## Próximos Passos

1. **Verificar Cloud Function**: Confirmar que retorna Firebase Custom Token
2. **Testar Login**: Fazer login e verificar `auth.currentUser`
3. **Testar Upload**: Fazer upload de imagem no carrossel
4. **Deploy Regras**: Se ainda não fez, deploy das regras do Storage

## Referências

- [Firebase Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [signInWithCustomToken](https://firebase.google.com/docs/reference/js/auth#signinwithcustomtoken)
- [Firebase Auth Rules](https://firebase.google.com/docs/storage/security)

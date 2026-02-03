# Configuração do Firebase Storage para Carrossel de Login

## Problema Atual

O erro `storage/unauthorized` indica que as regras de segurança do Firebase Storage não estão configuradas ou deployadas corretamente.

## Solução

### 1. Fazer Deploy das Regras de Segurança

As novas regras estão no arquivo `storage.rules`. Para aplicá-las:

#### Opção A: Via Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto **zops-mobile**
3. Vá em **Storage** no menu lateral
4. Clique na aba **Rules**
5. Copie e cole o conteúdo do arquivo `storage.rules`:

```
rules_version = '2';

service firebase.storage {
  match /b/zops-mobile.appspot.com/o {
    // Regras para imagens do carrossel de login
    match /login-carousel/{imageId} {
      // Qualquer um pode LER as imagens (necessário para tela de login pública)
      allow read: if true;

      // Apenas usuários autenticados podem ESCREVER/DELETAR
      allow write, delete: if request.auth != null
        && request.resource.size <= 300 * 1024 * 1024 // Máximo 300MB
        && request.resource.contentType.matches('image/(jpeg|png|webp)'); // Apenas imagens
    }

    // Negar acesso a tudo mais por padrão
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

6. Clique em **Publish** (Publicar)

#### Opção B: Via Firebase CLI

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Selecionar o projeto
firebase use zops-mobile

# Fazer deploy apenas das regras de storage
firebase deploy --only storage
```

### 2. Verificar Autenticação

Certifique-se de que o usuário está **logado** antes de tentar fazer upload:

- A tela de configurações deve ser acessível apenas após login
- O hook `useAuth` deve retornar `isAuthenticated: true`

### 3. Verificar Variáveis de Ambiente

No arquivo `.env`, verifique:

```env
VITE_FIREBASE_STORAGE_BUCKET=zops-mobile.appspot.com
```

### 4. Testar a Funcionalidade

Após aplicar as regras:

1. **Faça logout** da aplicação
2. **Faça login** novamente (para renovar token)
3. Vá em **Configurações → Aparência**
4. Tente fazer upload de uma imagem

## Estrutura no Firebase Storage

Após o upload bem-sucedido, as imagens ficarão organizadas assim:

```
zops-mobile.appspot.com/
└── login-carousel/
    ├── img-1737927234-abc123.webp
    ├── img-1737927456-def456.webp
    └── img-1737927789-ghi789.webp
```

## Permissões das Regras

### Leitura (Read)
- **Público** - Qualquer pessoa pode ler as imagens
- Necessário para que a tela de login (não autenticada) possa exibir as imagens

### Escrita/Delete (Write/Delete)
- **Apenas usuários autenticados**
- Validações:
  - Tamanho máximo: 300MB
  - Formatos aceitos: JPEG, PNG, WebP

## Troubleshooting

### Erro: "User does not have permission"

**Causa**: Usuário não autenticado ou regras não deployadas

**Solução**:
1. Verificar se está logado
2. Fazer deploy das regras
3. Fazer logout/login para renovar token

### Erro: "invalid-root-operation"

**Causa**: storagePath vazio ou inválido

**Solução**: Já corrigido no código - ignora paths vazios

### Erro: "File too large"

**Causa**: Arquivo maior que 300MB

**Solução**: Reduzir tamanho da imagem antes do upload

## Monitoramento

Para monitorar uploads no Firebase:

1. Firebase Console → Storage
2. Veja os arquivos em `login-carousel/`
3. Clique em um arquivo para ver metadados (nome original, quem fez upload, etc.)

## Segurança

As regras implementadas garantem:

✅ Tela de login pública pode carregar imagens
✅ Apenas usuários autenticados podem fazer upload
✅ Validação de tipo de arquivo (apenas imagens)
✅ Validação de tamanho (máx 300MB)
✅ Outros paths do storage ficam protegidos

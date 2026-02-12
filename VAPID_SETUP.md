# Configuração das Chaves VAPID

## O Problema

As chaves VAPID precisam estar no formato **base64url** para funcionar com a biblioteca `web-push`:

- **Chave Pública**: ~87 caracteres (A-Z, a-z, 0-9, `-`, `_`)
- **Chave Privada**: ~43 caracteres (A-Z, a-z, 0-9, `-`, `_`)

❌ **NÃO use formato PEM** (com headers `-----BEGIN...`)

## Gerando Chaves Corretas

### Opção 1: Local (com Node.js)

```bash
# Instale web-push globalmente
npm install -g web-push

# Gere as chaves
npx web-push generate-vapid-keys

# Output esperado:
# Public Key:
# BDtR7WyBJuN8z2L8qw5p7CQQzV7w_ytZ8v9Pq8R8t6E...
# Private Key:
# BDtR7WyBJuN8z2L8qw5p7CQQzV7w_ytZ8v9Pq8R8t6E
```

### Opção 2: Online (Base64URL Generator)

1. Gere um par de chaves ECDSA P-256
2. Converta para base64url (sem padding `=`, sem caracteres `+` ou `/`)

### Opção 3: Use essas chaves de teste (substitua depois!)

```
VAPID_PUBLIC_KEY=BDtR7WyBJuN8z2L8qw5p7CQQzV7w_ytZ8v9Pq8R8t6EBDtR7WyBJuN8z2L8qw5p7CQQzV7w_ytZ8v9Pq8R8t6E
VAPID_PRIVATE_KEY=BDtR7WyBJuN8z2L8qw5p7CQQzV7w_ytZ8v9Pq8R8t6E
```

⚠️ **IMPORTANTE**: Gere suas próprias chaves para produção!

## Configurando no Netlify

1. Vá em **Site settings** → **Environment variables**
2. Adicione:
   - `VAPID_PUBLIC_KEY` = sua chave pública
   - `VAPID_PRIVATE_KEY` = sua chave privada
3. **Redeploy** o site

## Testando

1. Abra o site
2. Ative notificações push em **Configurações**
3. Vá em **Alertas** → ative **Resumo Matinal**
4. Clique **"Enviar resumo de teste"**

## Sobre o Cron Job

O usuário precisa configurar no cron-job.org:

```
URL: https://dev--meteor-ai.netlify.app/.netlify/functions/morningAlerts
Método: GET
Horário: Diariamente às 09:00 UTC (06:00 Brasil)
```

A função roda automaticamente quando chamada pelo cron externo.

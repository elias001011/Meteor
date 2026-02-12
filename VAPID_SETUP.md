# Configuração das Chaves VAPID v5.5

## Gerar Chaves Válidas

Execute no terminal:

```bash
npm install -g web-push
npx web-push generate-vapid-keys
```

## Configurar no Netlify

1. Vá em **Netlify Dashboard** → Seu site → **Site settings**
2. Clique em **Environment variables**
3. Adicione:
   - `VAPID_PUBLIC_KEY` = (chave pública gerada)
   - `VAPID_PRIVATE_KEY` = **Secret value** (chave privada gerada)
4. Clique em **Save**
5. Faça um novo deploy

## Validação

- ✅ Chave pública: ~87 caracteres base64url
- ✅ Chave privada: ~43 caracteres base64url
- ✅ Formato válido para web-push

## Testar

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra o site
3. Faça login
4. Vá em **Configurações** → **Notificações Push** → Ative
5. Vá em **Alertas** → Ative **Resumo Matinal**
6. Clique **"Enviar resumo de teste"**

## Sobre o Cron Job

O usuário deve configurar em [cron-job.org](https://cron-job.org):

```
URL: https://dev--meteor-ai.netlify.app/.netlify/functions/morningAlerts
Método: GET
Horário: 09:00 UTC (06:00 Brasil)
```

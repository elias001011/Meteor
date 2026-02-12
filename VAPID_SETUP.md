# Configuração das Chaves VAPID

> ⚠️ **IMPORTANTE:** Nunca commit chaves VAPID diretamente no código. Use variáveis de ambiente do Netlify.

## Chaves Atuais (Produção)

Configure estas variáveis no Netlify:

```bash
VAPID_PUBLIC_KEY=rmWQCaG_VXjXc05G-P6E5dNDJ-5DzG7PM1MPptLA0QemCDAn_KFSQCOegcoydVdtN8K52wNLu9QK1ojJ9VE8tiU
VAPID_PRIVATE_KEY=q5Y6X3XwM3eog0cQavTLM7gen2aZAjS6acYX_8P-lFc
```

## Como Configurar no Netlify

1. Vá em **Netlify Dashboard** → Seu site → **Site settings**
2. Clique em **Environment variables**
3. Adicione as duas variáveis acima
4. Clique em **Save**
5. Faça um novo deploy (trigger deploy)

## Formato das Chaves

- ✅ Chave pública: 87 caracteres base64url
- ✅ Chave privada: 43 caracteres base64url
- ✅ Formato válido para web-push

## Testar Notificações

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra o site
3. Faça login
4. Vá em **Alertas** → Ative **Notificações Push**
5. Ative **Resumo Matinal**
6. Clique **"Enviar resumo de teste"**

## Gerar Novas Chaves (se necessário)

Se precisar gerar novas chaves no futuro:

```bash
npm install -g web-push
npx web-push generate-vapid-keys
```

## Configuração do Cron Job

Configure em [cron-job.org](https://cron-job.org):

```
URL: https://dev--meteor-ai.netlify.app/.netlify/functions/morningAlerts
Método: GET
Schedule: Once a day at 07:00
```

---

**Última atualização:** 11/02/2026
**Versão:** 5.6.0

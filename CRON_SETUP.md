# ⏰ Configuração do Cron Job - Meteor v6.0

Este guia explica como configurar o cron job para enviar notificações push diárias às 9h da manhã.

---

## 🌐 Serviço Utilizado: cron-job.org

Acesse: https://console.cron-job.org/jobs

É gratuito e confiável!

---

## 📝 Passo a Passo

### 1. Criar Conta

1. Acesse https://cron-job.org
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu email

### 2. Criar Novo Job

1. Faça login no console
2. Clique em **"CREATE CRONJOB"**
3. Preencha:

**Title:** `Meteor - Morning Notifications`

**Address:** 
```
https://SEU-SITE.netlify.app/.netlify/functions/sendMorningNotification
```

> Substitua `SEU-SITE` pelo seu domínio do Netlify

**Schedule:**
- **Schedule type:** `Daily`
- **Time:** `09:00`
- **Timezone:** `America/Sao_Paulo` (ou seu fuso)

### 3. Configurações Avançadas (Opcional)

- **HTTP Method:** `POST` (ou `GET` - ambos funcionam)
- **Timeout:** `300` segundos (5 minutos)
- **Retry:** Ative retry em caso de falha

### 4. Salvar

Clique em **"CREATE"** para ativar o job.

---

## 🧪 Testar o Cron Job

Para testar imediatamente (sem esperar 9h):

### Opção 1: Via URL
Acesse no navegador:
```
https://SEU-SITE.netlify.app/.netlify/functions/sendMorningNotification?test=true
```

### Opção 2: Via Botão no App
Na tela de Alertas, ative as notificações e clique em **"Testar"**.

---

## 📊 Monitoramento

No console do cron-job.org você pode ver:
- Últimas execuções
- Status (success/failure)
- Logs de resposta
- Tempo de resposta

---

## ⚠️ Troubleshooting

### "VAPID não configurado"
Verifique se as variáveis de ambiente estão configuradas no Netlify:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### "API key não configurada"
Verifique se a variável `CLIMA_API` está configurada.

### Notificações não chegam
1. Verifique se o usuário ativou as notificações na tela de Alertas
2. Verifique se a cidade está configurada corretamente
3. Verifique os logs do Netlify Functions

### Subscription expirada
As subscriptions expiradas são removidas automaticamente quando o push falha (404/410).

---

## 🔐 Segurança

O endpoint `sendMorningNotification` não requer autenticação pois:
1. Só envia para usuários que explicitamente ativaram
2. Não expõe dados sensíveis
3. Limita a 1 execução por dia pelo cron

---

## 📈 Estatísticas

A função retorna estatísticas a cada execução:
```json
{
  "success": true,
  "isTest": false,
  "stats": {
    "total": 10,
    "sent": 8,
    "failed": 2,
    "alerts": 3
  }
}
```

---

**Dúvidas?** Verifique os logs do Netlify Functions para mais detalhes.

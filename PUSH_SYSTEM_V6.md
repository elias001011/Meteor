# 🔔 Sistema de Push Notifications v6.1 - Meteor

## Visão Geral

Sistema dual: **Web Push** (padrão) + **FCM** (Android APK), com detecção automática.

---

## 🌐 Branch Dev (Web)

### Funcionamento
- Usa Web Push API padrão (Service Worker + VAPID)
- Funciona em todos os navegadores modernos
- **Limitação**: Chrome Android pode falhar (problema conhecido)

### Arquivos Principais
- `services/pushService.ts` - Serviço de push
- `netlify/functions/saveSubscription.ts` - Salva subscription
- `netlify/functions/deleteSubscription.ts` - Remove subscription
- `netlify/functions/sendMorningNotification.ts` - Cron job 9h
- `netlify/functions/sendTestNotification.ts` - Teste
- `netlify/functions/getConfig.ts` - Fornece VAPID_PUBLIC_KEY

---

## 📱 Branch Android (TWA)

### Funcionamento
1. Detecta se está no TWA (APK instalado)
2. Se sim: tenta usar **FCM** (Firebase Cloud Messaging)
3. Se FCM falhar no TWA, o fluxo não cai mais automaticamente para Web Push

### Vantagens do FCM
- ✅ Mais confiável no Android
- ✅ Funciona em background completo
- ✅ Ícone nativo personalizado
- ✅ Controle de som/vibração

### Arquivos Adicionais
- `android/fcm-push.js` - Configuração FCM
- `services/pushService.ts` - Mesmo arquivo da dev, com lógica FCM integrada e fallback seguro

---

## 🔄 Sincronização Dev → Android

### Workflow Automático
Arquivo: `.github/workflows/sync-android-branch.yml`

```yaml
on:
  push:
    branches: [dev]  # Quando houver push na dev
```

**O que acontece:**
1. Push na branch `dev` → Trigger automático
2. GitHub Actions checkout da `dev`
3. Merge na `android` (--no-edit)
4. Push da `android` atualizada

### Fluxo de Trabalho
```
dev (desenvolvimento)
  ↓ push
android (recebe merge automático + arquivos TWA/FCM)
  ↓ build APK
Google Play / Netlify
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (Netlify)

**Obrigatórias:**
```bash
# Web Push
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# API Clima
CLIMA_API=xxx
```

**Android (FCM):**
```bash
FIREBASE_SERVER_KEY=xxx  # Para enviar notificações FCM
```

### Cron Job (cron-job.org)

**URL:** `https://SEU-SITE.netlify.app/.netlify/functions/sendMorningNotification`
**Horário:** 9:00 AM (America/Sao_Paulo)

---

## 📊 Funcionamento do Cron

```
1. Busca todas as subscriptions (Web Push)
2. Busca todos os tokens FCM
3. Para cada usuário:
   - Busca clima da cidade na OneCall API
   - Envia resumo às 9h
   - Se houver alertas governamentais, envia separado
4. Remove subscriptions/tokens expirados
```

---

## 🧪 Teste

### Web (Firefox/Chrome Desktop)
1. Acesse a aba Alertas
2. Ative notificações
3. Clique em "Testar"

### Android (Chrome)
- **Web Push**: Pode falhar (limitação do Chrome Mobile)
- **FCM (APK)**: Deve funcionar sempre

---

## 🐛 Troubleshooting

### "Chave VAPID não configurada"
- Verifique se `VAPID_PUBLIC_KEY` está nas variáveis de ambiente
- A função `getConfig` deve retornar a chave

### "Notificações não chegam no Chrome Android"
- **Normal**: Chrome Mobile tem limitações conhecidas
- **Solução**: Usar o APK com FCM

### "FCM não funciona"
- Verifique `FIREBASE_SERVER_KEY`
- Verifique se o app está instalado (TWA)
- Fallback para Web Push deve funcionar

---

## 📁 Estrutura de Branches

```
main (produção estável)
  ↑
dev (desenvolvimento)
  ↓ (merge automático via GitHub Actions)
android (dev + arquivos TWA/FCM)
```

---

## 📝 Notas Técnicas

### Detecção TWA
```javascript
const isTWA = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/.test(navigator.userAgent);
  return isStandalone && isAndroid;
};
```

### Storage
- `meteor_push_enabled` - Se ativou notificações
- `meteor_push_city` - Cidade escolhida
- `meteor_push_type` - 'web' ou 'fcm'

---

**Versão:** 6.0.2  
**Atualizado:** 2026-02-12

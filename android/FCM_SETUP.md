# 🔥 Configuração Firebase Cloud Messaging (FCM)

Guia passo a passo para ativar notificações push nativas no APK Android.

> **⚠️ OPCIONAL**: O app funciona perfeitamente com Web Push padrão. O FCM é só para notificações mais confiáveis no APK.

---

## 📊 Web Push vs FCM

| Recurso | Web Push (atual) | FCM (Firebase) |
|---------|------------------|----------------|
| Funciona no APK | ✅ Sim | ✅ Sim |
| Confiabilidade | ~85% | ~99% |
| Em background | Limitado | ✅ Completo |
| Ícone nativo | ❌ Genérico | ✅ Personalizado |
| Som/Vibração | Limitado | ✅ Controle total |
| Analytics | Básico | ✅ Detalhado |
| Custo | Grátis | Grátis |

---

## 🚀 Setup do Firebase

### Passo 1: Criar Projeto

1. Acesse: https://console.firebase.google.com
2. Clique em **"Criar projeto"**
3. Nomeie: `Meteor Weather` (ou qualquer nome)
4. Desmarque "Google Analytics" (ou mantenha, se quiser)
5. Clique em **Criar projeto**

### Passo 2: Adicionar App Android

1. No projeto Firebase, clique no ícone **Android** (</>)
2. **Nome do pacote**: `app.meteor.weather`
3. **Apelido**: Meteor
4. **Certificado SHA-1**: (deixe em branco por enquanto)
5. Clique em **Registrar app**
6. Baixe o arquivo `google-services.json`
7. Clique em **Continuar** (pule as etapas de configuração do SDK)

### Passo 3: Obter Server Key

1. No menu lateral: ⚙️ **Configurações do projeto** → **Contas de serviço**
2. Ou vá direto: **Project Settings** → **Cloud Messaging**
3. Copie a **Chave do servidor** (Server Key)
   - Começa com `AAAA...` (cuidado, é longa!)

### Passo 4: Configurar no Netlify

Acesse seu site no Netlify → **Site settings** → **Environment variables**:

```
FIREBASE_SERVER_KEY=AAAA... (sua chave do Firebase)
NOTIFICATION_SECRET=qualquer_senha_segura_aqui
```

---

## 🔧 Configurar no Projeto

### Atualizar `index.html`

Adicione o Firebase SDK no `<head>` do `index.html`:

```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
  import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js';
  
  // Só inicializa se estiver no TWA
  if (window.matchMedia('(display-mode: standalone)').matches && 
      navigator.userAgent.includes('Android')) {
    
    const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "SEU_PROJETO.firebaseapp.com",
      projectId: "SEU_PROJETO",
      storageBucket: "SEU_PROJETO.appspot.com",
      messagingSenderId: "SENDER_ID",
      appId: "SEU_APP_ID"
    };
    
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    
    // Salvar no window para uso global
    window.firebaseMessaging = messaging;
    window.firebaseGetToken = getToken;
    window.firebaseOnMessage = onMessage;
  }
</script>
```

**Onde pegar esses valores?**
- Firebase Console → ⚙️ Configurações do projeto → Geral → Seus apps → SDK do Firebase (código HTML)

---

## 🧪 Testar FCM

### 1. Obter FCM Token do dispositivo

Abra o app APK no celular e no console do Chrome DevTools (conectado via USB):

```javascript
// No console do DevTools
const token = await window.firebaseGetToken(window.firebaseMessaging, {
  vapidKey: 'SUA_VAPID_KEY_PUBLICA'
});
console.log('FCM Token:', token);
```

### 2. Enviar notificação de teste

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Content-Type: application/json" \
  -H "Authorization: key=SUA_SERVER_KEY" \
  -d '{
    "to": "FCM_TOKEN_DO_DISPOSITIVO",
    "notification": {
      "title": "Teste Meteor",
      "body": "Notificação FCM funcionando!",
      "icon": "ic_notification"
    },
    "data": {
      "url": "/",
      "channel": "weather_alerts"
    },
    "android": {
      "notification": {
        "sound": "default",
        "channel_id": "critical_alerts"
      }
    }
  }'
```

---

## 📱 Canais de Notificação (Android)

Crie canais diferentes para cada tipo de alerta:

```javascript
// No service worker ou no app
if ('Notification' in window && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    // Canais para Android 8.0+
    if ('createNotificationChannel' in registration) {
      // Canal: Alertas Críticos
      registration.createNotificationChannel({
        id: 'critical_alerts',
        name: 'Alertas Críticos',
        importance: 'high',
        sound: 'alert_critical',
        vibration: [500, 500, 500]
      });
      
      // Canal: Avisos
      registration.createNotificationChannel({
        id: 'weather_warnings',
        name: 'Avisos Meteorológicos',
        importance: 'default',
        sound: 'default',
        vibration: [300, 200]
      });
      
      // Canal: Resumo Diário
      registration.createNotificationChannel({
        id: 'daily_summary',
        name: 'Resumo Diário',
        importance: 'low',
        sound: null,
        vibration: null
      });
    }
  });
}
```

---

## 🔐 Segurança Importante

### Nunca commit:
- ❌ `google-services.json`
- ❌ `FIREBASE_SERVER_KEY` no código
- ❌ Tokens FCM de usuários

### Sempre:
- ✅ Use variáveis de ambiente no Netlify
- ✅ Proteja endpoints com `NOTIFICATION_SECRET`
- ✅ Valide tokens antes de salvar

---

## ✅ Checklist FCM

- [ ] Projeto criado no Firebase Console
- [ ] App Android registrado (package: `app.meteor.weather`)
- [ ] Server Key copiada
- [ ] Variáveis no Netlify configuradas
- [ ] Firebase SDK adicionado ao `index.html`
- [ ] Teste de notificação enviado
- [ ] Canais de notificação criados

---

## ❓ Troubleshooting

### "InvalidRegistration" no FCM
- Token expirado ou inválido
- Peça novo token ao usuário

### Notificação não chega
- Verifique se o app está em foreground
- Background requer FCM (Web Push é limitado)

### Ícone não aparece
- Use ícone monocromático (branco/preto)
- Formato: PNG 96x96px
- Nome: `ic_notification.png`

---

**Dúvidas?** Consulte a documentação oficial: https://firebase.google.com/docs/cloud-messaging

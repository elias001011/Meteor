# 🔔 Melhorias em Notificações Push para Meteor

Guia completo para implementar notificações push avançadas no APK Android.

---

## 📱 Canais de Notificação (Android)

Os canais permitem que o usuário configure o comportamento de cada tipo de notificação separadamente.

### Canais Sugeridos

| Canal | Descrição | Prioridade | Som | Vibração |
|-------|-----------|------------|-----|----------|
| `critical_alerts` | Alertas críticos (tempestade, calor extremo) | HIGH | 🔊 Alarme | ✅ Longa |
| `weather_warnings` | Avisos meteorológicos | HIGH | 🔊 Notificação | ✅ Curta |
| `daily_summary` | Resumo diário 07:00 | DEFAULT | 🔊 Suave | ❌ |
| `general` | Outras notificações | LOW | ❌ | ❌ |

### Implementação no Service Worker

Atualize seu `sw.js` para suportar canais:

```javascript
// Notificações Push com canais
self.addEventListener('push', event => {
  let data = {
    title: 'Meteor - Alerta',
    body: 'Você tem uma nova notificação',
    icon: '/favicon.svg',
    url: '/',
    channel: 'general',
    priority: 'normal'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {}

  // Configurar opções baseadas no canal
  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/favicon.svg',
    tag: data.tag || 'default',
    requireInteraction: data.channel === 'critical_alerts',
    data: { url: data.url || '/', channel: data.channel },
    // Som e vibração baseados na prioridade
    silent: data.channel === 'daily_summary',
    // Ações disponíveis
    actions: getActionsForChannel(data.channel)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ações específicas por canal
function getActionsForChannel(channel) {
  switch(channel) {
    case 'critical_alerts':
      return [
        { action: 'view', title: 'Ver Alerta' },
        { action: 'share', title: 'Compartilhar' },
        { action: 'dismiss', title: 'OK' }
      ];
    case 'daily_summary':
      return [
        { action: 'view', title: 'Ver Previsão' },
        { action: 'dismiss', title: 'OK' }
      ];
    default:
      return [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Fechar' }
      ];
  }
}

// Handler para cliques nas ações
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  const channel = event.notification.data?.channel;
  const action = event.action;

  // Lógica baseada na ação
  switch(action) {
    case 'share':
      // Compartilhar alerta
      event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
          if (clients[0]) {
            clients[0].postMessage({
              type: 'SHARE_ALERT',
              data: event.notification.data
            });
          }
        })
      );
      break;
      
    case 'view':
    case 'open':
    default:
      // Abrir app na URL
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
      );
  }
});
```

---

## 🎨 Ícones e Som Personalizados

### Ícones de Notificação (Android)

Para o TWA, você pode definir ícones específicos:

1. **Criar ícones vetoriais** (Android Vector Drawable):
   ```xml
   <!-- res/drawable/ic_notification.xml -->
   <vector xmlns:android="http://schemas.android.com/apk/res/android"
       android:width="24dp"
       android:height="24dp"
       android:viewportWidth="24"
       android:viewportHeight="24">
       <path
           android:fillColor="#FFFFFF"
           android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2z"/>
   </vector>
   ```

2. **Ícones por tipo de alerta**:
   - `ic_storm` - Tempestade
   - `ic_heat` - Calor extremo
   - `ic_cold` - Frio intenso
   - `ic_uv` - Índice UV
   - `ic_wind` - Vento forte

### Som Personalizado

```javascript
// No payload da notificação
{
  "notification": {
    "sound": "alert_critical",  // arquivo em res/raw/
    "channel_id": "critical_alerts"
  }
}
```

---

## 📊 Métricas e Analytics

### Rastrear Entregas

```typescript
// Adicione ao pushNotificationService.ts

export const trackNotificationInteraction = async (
  notificationId: string,
  action: 'received' | 'clicked' | 'dismissed'
): Promise<void> => {
  try {
    await fetch('/.netlify/functions/trackNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId,
        action,
        timestamp: Date.now(),
        platform: isRunningInTWA() ? 'android_twa' : 'web'
      })
    });
  } catch (e) {
    // Falha silenciosa
  }
};

// No sw.js
self.addEventListener('push', event => {
  // ... código existente ...
  
  // Rastrear recebimento
  trackNotificationInteraction(data.id, 'received');
});

self.addEventListener('notificationclick', event => {
  trackNotificationInteraction(
    event.notification.tag, 
    event.action === 'dismiss' ? 'dismissed' : 'clicked'
  );
});
```

### Taxas de Entrega

Monitore no dashboard do Firebase:
- **Sent**: Notificações enviadas
- **Delivered**: Entregues ao dispositivo
- **Impressions**: Exibidas na tela
- **Opens**: Clicadas pelo usuário

---

## 🔄 Notificações em Background

### Sincronização Periódica

```javascript
// sw.js - Sincronizar alertas periodicamente

// Registrar sync (quando online)
self.addEventListener('sync', event => {
  if (event.tag === 'check-weather-alerts') {
    event.waitUntil(checkWeatherAlerts());
  }
});

async function checkWeatherAlerts() {
  try {
    // Buscar última localização salva
    const location = await getStoredLocation();
    if (!location) return;

    // Buscar dados do clima
    const response = await fetch(
      `/.netlify/functions/weather?lat=${location.lat}&lon=${location.lon}`
    );
    const weather = await response.json();

    // Verificar alertas
    const alerts = generateAlerts(weather);
    
    for (const alert of alerts) {
      // Notificar apenas se não foi notificado recentemente
      if (!await wasRecentlyNotified(alert.id)) {
        await self.registration.showNotification(alert.title, {
          body: alert.message,
          icon: `/icons/${alert.type}.svg`,
          badge: '/favicon.svg',
          tag: alert.id,
          requireInteraction: alert.level === 'critical',
          data: { 
            url: '/?view=alerts',
            alertId: alert.id 
          }
        });
        
        await markAsNotified(alert.id);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
  }
}

// Agendar verificação a cada 30 minutos
setInterval(() => {
  if ('sync' in self.registration) {
    self.registration.sync.register('check-weather-alerts');
  }
}, 30 * 60 * 1000);
```

---

## 🌐 Web Push vs FCM - Quando Usar

### Use Web Push quando:
- Usuário acessa via navegador
- Simplicidade é prioridade
- Sem necessidade de publicar na Play Store

### Use FCM quando:
- APK na Play Store
- Notificações críticas (precisa ser confiável)
- Personalização avançada (sons, ícones)
- Analytics de entrega

### Detecção Automática

```typescript
// Detectar qual método usar
export const getPushProvider = (): 'fcm' | 'web-push' | 'none' => {
  if (isRunningInTWA() && 'firebase' in window) {
    return 'fcm';
  }
  if (isPushSupported()) {
    return 'web-push';
  }
  return 'none';
};

// Inicializar automaticamente
export const initPushNotifications = async (): Promise<void> => {
  const provider = getPushProvider();
  
  switch(provider) {
    case 'fcm':
      await initFCM();
      break;
    case 'web-push':
      await subscribeToPush();
      break;
    default:
      console.log('Notificações não suportadas');
  }
};
```

---

## 🧪 Testes

### Testar Localmente

```bash
# Enviar notificação de teste via cURL
curl -X POST http://localhost:8888/.netlify/functions/sendFCMNotification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "seu_token_fcm",
    "title": "Teste Local",
    "body": "Funcionando!",
    "data": { "channel": "critical_alerts" }
  }'
```

### Ferramentas de Teste

- **Firebase Console**: Envio manual de testes
- **Postman**: Testar endpoints
- **Chrome DevTools**: Application > Service Workers

---

## 📋 Checklist de Implementação

- [ ] Configurar canais de notificação no sw.js
- [ ] Criar ícones de notificação
- [ ] Implementar ações nos botões
- [ ] Adicionar analytics de entrega
- [ ] Testar em diferentes versões do Android
- [ ] Configurar som personalizado para alertas críticos
- [ ] Implementar fallback para Web Push
- [ ] Documentar para usuários como habilitar notificações

---

## 🔗 Links Úteis

- [Web Push Best Practices](https://web.dev/push-notifications-overview/)
- [FCM HTTP Protocol](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [Notification Channels](https://developer.android.com/guide/topics/ui/notifiers/notifications#ManageChannels)

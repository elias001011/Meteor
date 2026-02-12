/**
 * Serviço de Push Notifications - Meteor v6.0
 * Simplificado e robusto, usando Web Push API
 * Com suporte a FCM quando em TWA (Android)
 */

// Pega a chave VAPID do window.ENV
const getVapidPublicKey = (): string => {
  if (typeof window !== 'undefined') {
    const fromWindow = (window as any).ENV?.VAPID_PUBLIC_KEY;
    if (fromWindow && fromWindow !== 'undefined' && fromWindow !== '') {
      return fromWindow;
    }
  }
  return '';
};

// Detecta se está no TWA (APK Android)
const isTWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/.test(navigator.userAgent);
  return isStandalone && isAndroid;
};

// Aguarda configuração carregar
const waitForConfig = async (maxAttempts = 20): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (getVapidPublicKey()) {
      return true;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  } catch (error) {
    console.error('[Push] Erro ao processar chave VAPID:', error);
    throw new Error('Falha ao processar chave VAPID');
  }
}

export const isPushSupported = (): boolean => {
  try {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('[Push] Suporte detectado:', supported, isTWA() ? '(TWA)' : '');
    return supported;
  } catch (e) {
    console.error('[Push] Erro ao verificar suporte:', e);
    return false;
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service Worker não suportado');
    return null;
  }
  
  if (!window.isSecureContext) {
    console.warn('[Push] HTTPS necessário para push');
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) {
      console.log('[Push] SW existente encontrado');
      await existing.update();
      return existing;
    }
    
    console.log('[Push] Registrando novo SW...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] SW registrado com sucesso');
    return registration;
  } catch (error: any) {
    console.error('[Push] Erro ao registrar SW:', error.message);
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas neste navegador');
  }
  
  console.log('[Push] Solicitando permissão...');
  const permission = await Notification.requestPermission();
  console.log('[Push] Permissão:', permission);
  return permission;
};

// ============================================
// FCM SUPPORT (Android TWA only)
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBsvIYTFYii5rxVOSVU58AJjPafjaMv4mI",
  authDomain: "meteor-weather-13033.firebaseapp.com",
  projectId: "meteor-weather-13033",
  storageBucket: "meteor-weather-13033.firebasestorage.app",
  messagingSenderId: "919442203209",
  appId: "1:919442203209:android:e1a3dc2b50639982701598"
};

let fcmMessaging: any = null;

const initFCM = async () => {
  if (!isTWA()) return null;
  if (fcmMessaging) return fcmMessaging;
  
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    const app = initializeApp(firebaseConfig);
    fcmMessaging = getMessaging(app);
    
    onMessage(fcmMessaging, (payload: any) => {
      console.log('[FCM] Foreground message:', payload);
      // Mostra notificação local
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Meteor', {
          body: payload.notification?.body,
          icon: '/favicon.svg',
          data: payload.data
        });
      }
    });
    
    console.log('[FCM] Inicializado');
    return fcmMessaging;
  } catch (error) {
    console.error('[FCM] Erro:', error);
    return null;
  }
};

const getFCMToken = async (): Promise<string | null> => {
  const messaging = await initFCM();
  if (!messaging) return null;
  
  try {
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    const token = await getToken(messaging, {
      vapidKey: 'BCO0C6hZ4122lxqL0iG_lzfbjXybgjB6e-GOFA9yNj1RZfK9f5Qs1i9PQYZF1bTt2yH9LPwVd1N5j5qk5GjJ5E'
    });
    return token || null;
  } catch (error) {
    console.error('[FCM] Erro ao obter token:', error);
    return null;
  }
};

const saveFCMToken = async (token: string, city: string) => {
  await fetch('/.netlify/functions/saveFCMToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, city, enabled: true })
  });
};

// ============================================
// PUBLIC API
// ============================================

export const subscribeToPush = async (city: string) => {
  console.log('[Push] Iniciando订阅 para:', city, isTWA() ? '(TWA)' : '');
  
  // Se está no TWA, tenta FCM primeiro
  if (isTWA()) {
    console.log('[Push] Tentando FCM...');
    const fcmToken = await getFCMToken();
    if (fcmToken) {
      console.log('[Push] FCM token obtido');
      await saveFCMToken(fcmToken, city);
      localStorage.setItem('meteor_push_type', 'fcm');
      localStorage.setItem('meteor_push_city', city);
      localStorage.setItem('meteor_push_enabled', 'true');
      return { type: 'fcm', token: fcmToken };
    }
    console.log('[Push] FCM falhou, usando Web Push');
  }
  
  // Web Push padrão
  return await subscribeWebPush(city);
};

const subscribeWebPush = async (city: string): Promise<PushSubscription | null> => {
  try {
    if (!isPushSupported()) {
      throw new Error('Push não suportado');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Falha ao registrar SW');
    }

    // Remove subscription antiga
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    const configLoaded = await waitForConfig();
    const VAPID_PUBLIC_KEY = getVapidPublicKey();
    
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID não configurado');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Salva no servidor
    await fetch('/.netlify/functions/saveSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        city,
        enabled: true
      })
    });
    
    localStorage.setItem('meteor_push_type', 'web');
    localStorage.setItem('meteor_push_city', city);
    localStorage.setItem('meteor_push_enabled', 'true');
    
    return subscription;
  } catch (error: any) {
    console.error('[Push] Erro:', error.message);
    throw error;
  }
};

export const unsubscribeFromPush = async () => {
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (pushType === 'fcm' && fcmMessaging) {
    try {
      const { deleteToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
      await deleteToken(fcmMessaging);
    } catch (e) {}
  }
  
  // Web Push
  try {
    const registration = await navigator.serviceWorker?.ready;
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch('/.netlify/functions/deleteSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }
  } catch (e) {}
  
  localStorage.removeItem('meteor_push_city');
  localStorage.removeItem('meteor_push_enabled');
  localStorage.removeItem('meteor_push_type');
};

export const getPushStatus = async () => {
  const localEnabled = localStorage.getItem('meteor_push_enabled');
  const localCity = localStorage.getItem('meteor_push_city');
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (localEnabled === 'true') {
    if (pushType === 'fcm') {
      return { isSubscribed: true, city: localCity, type: 'fcm' };
    }
    
    // Verifica Web Push
    try {
      const registration = await navigator.serviceWorker?.ready;
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        return { isSubscribed: true, city: localCity, type: 'web' };
      }
    } catch (e) {}
    
    // Limpa se não encontrou
    localStorage.removeItem('meteor_push_enabled');
  }
  
  return { isSubscribed: false, city: localCity, type: null };
};

export const sendTestNotification = async () => {
  const pushType = localStorage.getItem('meteor_push_type');
  
  // Busca subscription/token atual
  if (pushType === 'fcm') {
    const token = await getFCMToken();
    if (token) {
      // Envia teste via função genérica
      await fetch('/.netlify/functions/sendTestNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token })
      });
      return;
    }
  }
  
  // Web Push
  const registration = await navigator.serviceWorker?.ready;
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) {
    throw new Error('Ative as notificações primeiro');
  }
  
  await fetch('/.netlify/functions/sendTestNotification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });
};

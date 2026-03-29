/**
 * Serviço de Push Notifications - Meteor v6.1
 * Simplificado e robusto, usando Web Push API
 * Com suporte a FCM quando em TWA (Android)
 */

let vapidKeyPromise: Promise<string> | null = null;

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

const resolveVapidPublicKey = async (): Promise<string> => {
  const fromWindow = getVapidPublicKey();
  if (fromWindow) {
    return fromWindow;
  }

  if (!vapidKeyPromise) {
    vapidKeyPromise = fetch('/.netlify/functions/getConfig')
      .then(async (response) => {
        if (!response.ok) return '';
        const config = await response.json().catch(() => ({}));
        return config?.VAPID_PUBLIC_KEY || '';
      })
      .catch(() => '')
      .finally(() => {
        vapidKeyPromise = null;
      });
  }

  return vapidKeyPromise;
};

// Detecta se está no TWA (APK Android)
const isTWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/.test(navigator.userAgent);
  const result = isStandalone && isAndroid;
  console.log('[Push] TWA check:', { isStandalone, isAndroid, result });
  return result;
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

// Aguarda Service Worker estar ativo
const waitForServiceWorker = async (maxAttempts = 30): Promise<ServiceWorkerRegistration | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration?.active) {
      console.log('[Push] SW ativo encontrado');
      return registration;
    }
    console.log('[Push] Aguardando SW ativar...', i);
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
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
    console.log('[Push] Suporte detectado:', supported);
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
    const readyPromise = navigator.serviceWorker.ready.then((registration) => registration).catch(() => null);
    const timeoutPromise = new Promise<ServiceWorkerRegistration | null>((resolve) => {
      setTimeout(() => resolve(null), 2500);
    });

    const readyRegistration = await Promise.race([readyPromise, timeoutPromise]);
    if (readyRegistration) {
      console.log('[Push] SW pronto encontrado');
      await readyRegistration.update();
      return readyRegistration;
    }

    const existing = await navigator.serviceWorker.getRegistration();
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
    throw new Error('Notificações não suportadas');
  }
  
  console.log('[Push] Solicitando permissão...');
  const permission = await Notification.requestPermission();
  console.log('[Push] Permissão:', permission);
  return permission;
};

// ============================================
// FCM SUPPORT
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
let fcmInitialized = false;

const initFCM = async () => {
  if (fcmInitialized) return fcmMessaging;
  if (!isTWA()) {
    console.log('[FCM] Não está no TWA');
    return null;
  }
  
  try {
    console.log('[FCM] Inicializando...');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    const app = initializeApp(firebaseConfig);
    fcmMessaging = getMessaging(app);
    
    onMessage(fcmMessaging, (payload: any) => {
      console.log('[FCM] Foreground message:', payload);
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Meteor', {
          body: payload.notification?.body,
          icon: '/favicon.svg',
          data: payload.data
        });
      }
    });
    
    fcmInitialized = true;
    console.log('[FCM] Inicializado!');
    return fcmMessaging;
  } catch (error) {
    console.error('[FCM] Erro:', error);
    return null;
  }
};

const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await initFCM();
    if (!messaging) return null;
    
    console.log('[FCM] Obtendo token...');
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    const token = await getToken(messaging, {
      vapidKey: 'BCO0C6hZ4122lxqL0iG_lzfbjXybgjB6e-GOFA9yNj1RZfK9f5Qs1i9PQYZF1bTt2yH9LPwVd1N5j5qk5GjJ5E'
    });
    
    if (token) {
      console.log('[FCM] Token obtido:', token.substring(0, 20) + '...');
      return token;
    }
    console.log('[FCM] Sem token');
    return null;
  } catch (error) {
    console.error('[FCM] Erro:', error);
    return null;
  }
};

const saveFCMToken = async (token: string, city: string) => {
  console.log('[FCM] Salvando token...');
  const response = await fetch('/.netlify/functions/saveFCMToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, city, enabled: true })
  });
  
  if (!response.ok) {
    throw new Error('Falha ao salvar token FCM');
  }
  console.log('[FCM] Token salvo!');
};

// ============================================
// PUBLIC API
// ============================================

export const subscribeToPush = async (city: string) => {
  console.log('[Push] Iniciando para:', city);
  
  // TWA: tenta FCM primeiro
  if (isTWA()) {
    console.log('[Push] Modo TWA detectado');
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        console.log('[Push] Usando FCM');
        await saveFCMToken(fcmToken, city);
        localStorage.setItem('meteor_push_type', 'fcm');
        localStorage.setItem('meteor_push_city', city);
        localStorage.setItem('meteor_push_enabled', 'true');
        return { type: 'fcm', token: fcmToken };
      }
    } catch (e) {
      console.warn('[Push] FCM falhou:', e);
    }
    throw new Error('Falha ao inicializar FCM no Android. Tente novamente ou verifique a configuração do app.');
  }
  
  // Web Push
  return await subscribeWebPush(city);
};

const subscribeWebPush = async (city: string): Promise<PushSubscription | null> => {
  console.log('[Push] Iniciando Web Push...');
  
  try {
    if (!isPushSupported()) {
      throw new Error('Push não suportado');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada');
    }

    // Registra e aguarda SW ativo
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Falha ao registrar SW');
    }

    console.log('[Push] SW state:', registration.active?.state);
    
    // Remove subscription antiga
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log('[Push] Removendo subscription antiga');
      await existing.unsubscribe();
    }

    // Aguarda config
    const VAPID_PUBLIC_KEY = await resolveVapidPublicKey();
    
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID não configurado');
    }

    console.log('[Push] Criando subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    console.log('[Push] Subscription criada:', subscription.endpoint.substring(0, 50));
    
    // Salva no servidor
    const response = await fetch('/.netlify/functions/saveSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        city,
        enabled: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Falha ao salvar no servidor');
    }
    
    localStorage.setItem('meteor_push_type', 'web');
    localStorage.setItem('meteor_push_city', city);
    localStorage.setItem('meteor_push_enabled', 'true');
    
    console.log('[Push] Web Push ativado!');
    return subscription;
  } catch (error: any) {
    console.error('[Push] Erro Web Push:', error.message);
    throw error;
  }
};

export const unsubscribeFromPush = async () => {
  console.log('[Push] Desativando...');
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (pushType === 'fcm' && fcmMessaging) {
    try {
      const { deleteToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
      await deleteToken(fcmMessaging);
      console.log('[FCM] Token deletado');
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
  console.log('[Push] Desativado');
};

export const getPushStatus = async () => {
  const localEnabled = localStorage.getItem('meteor_push_enabled');
  const localCity = localStorage.getItem('meteor_push_city');
  const pushType = localStorage.getItem('meteor_push_type');
  
  console.log('[Push] Status check:', { localEnabled, pushType });
  
  if (localEnabled === 'true') {
    if (pushType === 'fcm') {
      return { isSubscribed: true, city: localCity, type: 'fcm' };
    }

    if (isTWA()) {
      return { isSubscribed: false, city: localCity, type: null };
    }

    // Verifica Web Push
    try {
      const registration = await registerServiceWorker();
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        return { isSubscribed: true, city: localCity, type: 'web' };
      }
    } catch (e) {}
    
    localStorage.removeItem('meteor_push_enabled');
  }
  
  return { isSubscribed: false, city: localCity, type: null };
};

export const sendTestNotification = async () => {
  console.log('[Push] Teste solicitado');
  const pushType = localStorage.getItem('meteor_push_type');
  const isAndroidTwa = isTWA();
  
  if (pushType === 'fcm' || isAndroidTwa) {
    const token = await getFCMToken();
    if (token) {
      console.log('[Push] Enviando teste FCM');
      const response = await fetch('/.netlify/functions/sendTestNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'FCM falhou');
      }
      return;
    }
    if (isAndroidTwa) {
      throw new Error('Não foi possível obter o token FCM no Android.');
    }
  }
  
  // Web Push
  const registration = await registerServiceWorker();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) {
    throw new Error('Ative as notificações primeiro');
  }
  
  console.log('[Push] Enviando teste Web Push');
  const response = await fetch('/.netlify/functions/sendTestNotification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Web Push falhou');
  }
};

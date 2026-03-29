/**
 * Serviço de Push Notifications - Meteor v6.1
 * Simplificado e robusto, usando Web Push API
 * Com suporte a FCM quando em TWA (Android)
 */

interface PublicPushConfig {
  VAPID_PUBLIC_KEY?: string;
  FCM_VAPID_KEY?: string;
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBsvIYTFYii5rxVOSVU58AJjPafjaMv4mI',
  authDomain: 'meteor-weather-13033.firebaseapp.com',
  projectId: 'meteor-weather-13033',
  storageBucket: 'meteor-weather-13033.firebasestorage.app',
  messagingSenderId: '919442203209',
  appId: '1:919442203209:android:e1a3dc2b50639982701598'
};

const KNOWN_ANDROID_TWA_HOSTS = new Set([
  'android--meteor-ai.netlify.app',
  'meteor-android.netlify.app'
]);

let publicConfigPromise: Promise<PublicPushConfig> | null = null;

const sanitizeConfigValue = (value: unknown): string =>
  typeof value === 'string' && value !== 'undefined' && value.trim() !== '' ? value.trim() : '';

const getWindowPublicConfig = (): PublicPushConfig => {
  if (typeof window === 'undefined') return {};
  return ((window as any).ENV || {}) as PublicPushConfig;
};

const getPublicConfigValue = (key: keyof PublicPushConfig): string => {
  const config = getWindowPublicConfig();
  return sanitizeConfigValue(config[key]);
};

const resolvePublicPushConfig = async (): Promise<PublicPushConfig> => {
  const fromWindow = getWindowPublicConfig();
  const hasWindowConfig = Object.values(fromWindow).some((value) => sanitizeConfigValue(value));
  if (hasWindowConfig) {
    return fromWindow;
  }

  if (!publicConfigPromise) {
    publicConfigPromise = fetch('/.netlify/functions/getConfig')
      .then(async (response) => {
        if (!response.ok) return {};
        return await response.json().catch(() => ({}));
      })
      .catch(() => ({}))
      .finally(() => {
        publicConfigPromise = null;
      });
  }

  return publicConfigPromise;
};

const resolveVapidPublicKey = async (): Promise<string> => {
  const fromWindow = getPublicConfigValue('VAPID_PUBLIC_KEY');
  if (fromWindow) {
    return fromWindow;
  }

  const config = await resolvePublicPushConfig();
  return sanitizeConfigValue(config.VAPID_PUBLIC_KEY);
};

const resolveFCMVapidKey = async (): Promise<string> => {
  const fromWindow = getPublicConfigValue('FCM_VAPID_KEY') || getPublicConfigValue('VAPID_PUBLIC_KEY');
  if (fromWindow) {
    return fromWindow;
  }

  const config = await resolvePublicPushConfig();
  return sanitizeConfigValue(config.FCM_VAPID_KEY) || sanitizeConfigValue(config.VAPID_PUBLIC_KEY);
};

const resolveFirebaseConfig = async () => {
  const config = await resolvePublicPushConfig();

  return {
    apiKey: sanitizeConfigValue(config.FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: sanitizeConfigValue(config.FIREBASE_AUTH_DOMAIN) || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: sanitizeConfigValue(config.FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: sanitizeConfigValue(config.FIREBASE_STORAGE_BUCKET) || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: sanitizeConfigValue(config.FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: sanitizeConfigValue(config.FIREBASE_APP_ID) || DEFAULT_FIREBASE_CONFIG.appId
  };
};

const canUseFCMInTWA = async (): Promise<boolean> => {
  const firebaseConfig = await resolveFirebaseConfig();
  const vapidKey = await resolveFCMVapidKey();
  const appIdLooksWeb = firebaseConfig.appId.includes(':web:');
  const hasVapidKey = Boolean(vapidKey);
  const ready = appIdLooksWeb && hasVapidKey;

  console.log('[FCM] Ready check:', {
    appId: firebaseConfig.appId,
    appIdLooksWeb,
    hasVapidKey,
    ready
  });

  return ready;
};

// Detecta se está no TWA (APK Android) desta branch, evitando tratar qualquer PWA Android como TWA.
const isTWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const hasAndroidAppReferrer = typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  const isKnownAndroidHost = KNOWN_ANDROID_TWA_HOSTS.has(window.location.hostname);
  const result = isStandalone && isAndroid && (hasAndroidAppReferrer || isKnownAndroidHost);

  console.log('[Push] TWA check:', {
    isStandalone,
    isAndroid,
    hasAndroidAppReferrer,
    isKnownAndroidHost,
    hostname: window.location.hostname,
    result
  });

  return result;
};

const logServiceWorkerRegistration = (label: string, registration: ServiceWorkerRegistration | null) => {
  console.log(label, registration ? {
    scope: registration.scope,
    activeScriptURL: registration.active?.scriptURL,
    activeState: registration.active?.state,
    waitingScriptURL: registration.waiting?.scriptURL,
    installingScriptURL: registration.installing?.scriptURL
  } : null);
};

const isServiceWorkerActivated = (registration: ServiceWorkerRegistration | null): boolean =>
  Boolean(registration?.active && registration.active.state === 'activated');

const waitForWorkerState = async (
  worker: ServiceWorker | null | undefined,
  targetState: ServiceWorkerState = 'activated',
  timeoutMs = 10000
): Promise<boolean> => {
  if (!worker) return false;
  if (worker.state === targetState) return true;

  return await new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => {
      worker.removeEventListener('statechange', onStateChange);
      resolve(worker.state === targetState);
    }, timeoutMs);

    const onStateChange = () => {
      if (worker.state === targetState) {
        window.clearTimeout(timer);
        worker.removeEventListener('statechange', onStateChange);
        resolve(true);
      }
    };

    worker.addEventListener('statechange', onStateChange);
  });
};

const waitForActiveServiceWorker = async (
  preferredRegistration: ServiceWorkerRegistration | null,
  timeoutMs = 10000
): Promise<ServiceWorkerRegistration | null> => {
  if (isServiceWorkerActivated(preferredRegistration)) {
    return preferredRegistration;
  }

  const candidateWorker =
    preferredRegistration?.installing ||
    preferredRegistration?.waiting ||
    preferredRegistration?.active;

  if (candidateWorker) {
    await waitForWorkerState(candidateWorker, 'activated', timeoutMs);
  }

  const readyRegistration = await Promise.race<ServiceWorkerRegistration | null>([
    navigator.serviceWorker.ready.then((registration) => registration).catch(() => null),
    new Promise<ServiceWorkerRegistration | null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    })
  ]);

  if (isServiceWorkerActivated(readyRegistration)) {
    logServiceWorkerRegistration('[Push] SW ativo via ready', readyRegistration);
    return readyRegistration;
  }

  for (let i = 0; i < 20; i++) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (isServiceWorkerActivated(registration)) {
      logServiceWorkerRegistration('[Push] SW ativo via polling final', registration);
      return registration;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }

  logServiceWorkerRegistration('[Push] SW ainda sem active após espera', preferredRegistration);
  return null;
};

// Aguarda Service Worker estar ativo
const waitForServiceWorker = async (maxAttempts = 30): Promise<ServiceWorkerRegistration | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (isServiceWorkerActivated(registration)) {
      logServiceWorkerRegistration('[Push] SW ativo encontrado', registration);
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
      logServiceWorkerRegistration('[Push] SW pronto encontrado', readyRegistration);
      await readyRegistration.update();
      return await waitForActiveServiceWorker(readyRegistration, 10000);
    }

    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      logServiceWorkerRegistration('[Push] SW existente encontrado', existing);
      await existing.update();
      const activeRegistration = await waitForActiveServiceWorker(existing, 10000);
      if (activeRegistration) {
        return activeRegistration;
      }
      return await waitForServiceWorker(10);
    }

    console.log('[Push] Registrando novo SW...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    logServiceWorkerRegistration('[Push] SW registrado com sucesso', registration);
    const activeRegistration = await waitForActiveServiceWorker(registration, 12000);
    return activeRegistration || await waitForServiceWorker(15);
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

const ensureNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Permissão de notificações bloqueada. Ative nas configurações do navegador/app.');
  }

  return await requestNotificationPermission();
};

// ============================================
// FCM SUPPORT
// ============================================

let fcmMessaging: any = null;
let fcmInitialized = false;
let firebaseApp: any = null;

const initFCM = async () => {
  if (fcmInitialized) return fcmMessaging;
  if (!isTWA()) {
    console.log('[FCM] Não está no TWA');
    return null;
  }
  
  try {
    console.log('[FCM] Inicializando...');
    const firebaseConfig = await resolveFirebaseConfig();
    console.log('[FCM] Config resolvida:', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      appIdLooksWeb: firebaseConfig.appId.includes(':web:')
    });

    const { getApps, initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');

    firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    fcmMessaging = getMessaging(firebaseApp);
    
    onMessage(fcmMessaging, (payload: any) => {
      console.log('[FCM] Foreground message:', payload);
      if (Notification.permission === 'granted') {
        const notification = payload.notification || {};
        const data = payload.data || {};

        new Notification(notification.title || data.title || 'Meteor', {
          body: notification.body || data.body,
          icon: '/favicon.svg',
          data
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
    const permission = await ensureNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Permissão não concedida:', permission);
      return null;
    }

    const messaging = await initFCM();
    if (!messaging) return null;

    const registration = await registerServiceWorker();
    const activeRegistration = await waitForActiveServiceWorker(registration, 10000);
    if (!activeRegistration) {
      console.warn('[FCM] Service Worker indisponível para registrar token');
      return null;
    }

    const vapidKey = await resolveFCMVapidKey();
    if (!vapidKey) {
      console.error('[FCM] Chave VAPID do FCM ausente');
      return null;
    }

    logServiceWorkerRegistration('[FCM] Usando SW para token', activeRegistration);
    console.log('[FCM] Obtendo token...', {
      permission,
      vapidSource: getPublicConfigValue('FCM_VAPID_KEY') ? 'FCM_VAPID_KEY' : getPublicConfigValue('VAPID_PUBLIC_KEY') ? 'VAPID_PUBLIC_KEY' : 'fetched'
    });

    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: activeRegistration
    });
    
    if (token) {
      console.log('[FCM] Token obtido:', token.substring(0, 20) + '...');
      return token;
    }
    console.log('[FCM] Sem token');
    return null;
  } catch (error: any) {
    console.error('[FCM] Erro ao obter token:', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });
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
    if (await canUseFCMInTWA()) {
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

      console.warn('[Push] FCM indisponível no TWA, tentando Web Push como fallback');
    } else {
      console.warn('[Push] Config web do Firebase ausente/inválida no TWA, usando Web Push');
    }

    return await subscribeWebPush(city);
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

    const permission = await ensureNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada');
    }

    // Registra e aguarda SW ativo
    const registration = await registerServiceWorker();
    const activeRegistration = await waitForActiveServiceWorker(registration, 10000);
    if (!activeRegistration) {
      throw new Error('Falha ao registrar SW');
    }

    console.log('[Push] SW state:', activeRegistration.active?.state);
    
    // Remove subscription antiga
    const existing = await activeRegistration.pushManager.getSubscription();
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
    const subscription = await activeRegistration.pushManager.subscribe({
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
  
  if (pushType === 'fcm') {
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
    throw new Error('Não foi possível obter o token FCM no Android.');
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

const PUBLIC_VAPID_KEY = typeof window !== 'undefined' 
  ? (window as any).ENV?.VAPID_PUBLIC_KEY || '' 
  : '';

/**
 * Valida se uma string é base64 URL-safe válida
 */
function isValidBase64Url(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  // Remove padding e caracteres especiais para validação
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  const cleanString = base64String.replace(/=+$/, '');
  return base64Regex.test(cleanString) && cleanString.length > 0;
}

/**
 * Converte base64 URL-safe para Uint8Array com validação
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!isValidBase64Url(base64String)) {
    throw new Error('Chave VAPID inválida ou não configurada');
  }

  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    // Validação adicional antes de atob
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      throw new Error('Formato de chave inválido');
    }
    
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  } catch (error) {
    throw new Error('Falha ao processar chave VAPID: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
  }
}

export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const isIOSSafari = (): boolean => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  return iOS && webkit && !ua.match(/CriOS/i);
};

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Detecta se está rodando no TWA (Trusted Web Activity) Android
 */
export const isTWA = (): boolean => {
  return isPWAInstalled() && /Android/.test(navigator.userAgent);
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (!window.isSecureContext) {
    throw new Error('Service Worker requer HTTPS ou localhost');
  }

  try {
    // Verifica se já existe um registro ativo
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration && existingRegistration.active) {
      return existingRegistration;
    }
    
    // Tenta registrar
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    
    // Aguarda o SW estar ativo
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing?.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    return registration;
  } catch (error: any) {
    if (error.name === 'SecurityError' || error.message?.includes('secure')) {
      throw new Error('Service Worker requer HTTPS ou localhost');
    }
    throw new Error('Não foi possível registrar o Service Worker: ' + (error.message || 'Erro desconhecido'));
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas neste navegador');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Limpa dados de push corrompidos do localStorage
 */
const cleanupCorruptedPushData = (): void => {
  try {
    const raw = localStorage.getItem('meteor_push_subscription');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Verifica se tem a estrutura mínima necessária
      if (!parsed || !parsed.endpoint || !parsed.keys) {
        console.warn('[Meteor] Removendo subscription corrompida do localStorage');
        localStorage.removeItem('meteor_push_subscription');
      }
    }
  } catch (e) {
    // Se não consegue fazer parse, remove
    localStorage.removeItem('meteor_push_subscription');
  }
};

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    if (!isPushSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Para receber notificações no iOS, instale o app na tela inicial');
    }

    // Limpa dados corrompidos antes de começar
    cleanupCorruptedPushData();

    // Solicita permissão ANTES de qualquer coisa
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada. Clique no ícone de cadeado na barra de endereço para permitir.');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }

    // Aguarda o SW estar pronto
    await navigator.serviceWorker.ready;

    // Para TWA, tenta usar Firebase primeiro
    if (isTWA() && (window as any).firebaseMessaging) {
      try {
        const token = await (window as any).firebaseGetToken();
        if (token) {
          console.log('[Meteor] Firebase token obtido:', token);
          // Salva token do Firebase como subscription alternativa
          const fcmSubscription = {
            endpoint: 'fcm:' + token,
            keys: { fcm: true },
            toJSON: () => ({ endpoint: 'fcm:' + token, keys: { fcm: true } })
          } as any;
          await saveSubscriptionToServer(fcmSubscription);
          localStorage.setItem('meteor_push_subscription', JSON.stringify(fcmSubscription.toJSON()));
          return fcmSubscription;
        }
      } catch (fcmError) {
        console.warn('[Meteor] Falha ao usar FCM, fallback para Web Push:', fcmError);
      }
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await saveSubscriptionToServer(existingSubscription);
      localStorage.setItem('meteor_push_subscription', JSON.stringify(existingSubscription.toJSON()));
      return existingSubscription;
    }

    // Valida a chave VAPID
    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada no servidor. Contate o suporte.');
    }

    if (!isValidBase64Url(PUBLIC_VAPID_KEY)) {
      throw new Error('Chave VAPID inválida. Verifique a configuração do servidor.');
    }

    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
    } catch (e: any) {
      throw new Error('Erro ao processar chave VAPID: ' + e.message);
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    if (!subscription || !subscription.endpoint) {
      throw new Error('Falha ao criar subscription de push');
    }

    await saveSubscriptionToServer(subscription);
    // Salva apenas os dados serializáveis
    localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription.toJSON()));
    
    return subscription;
  } catch (error: any) {
    // Limpa o localStorage em caso de erro para permitir retry
    if (error.message?.includes('VAPID') || error.message?.includes('subscription')) {
      localStorage.removeItem('meteor_push_subscription');
    }
    throw error;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscriptionFromServer(subscription);
      localStorage.removeItem('meteor_push_subscription');
      return true;
    }
    return false;
  } catch (error) {
    // Mesmo em caso de erro, limpa o localStorage
    localStorage.removeItem('meteor_push_subscription');
    return false;
  }
};

export const getPushSubscriptionStatus = async (): Promise<{
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return {
      isSubscribed: !!subscription,
      subscription
    };
  } catch (error) {
    return { isSubscribed: false, subscription: null };
  }
};

const saveSubscriptionToServer = async (subscription: PushSubscription | any): Promise<void> => {
  try {
    // Pega o userId do localStorage se existir (usuário logado)
    const userData = localStorage.getItem('meteor_user_data');
    const userId = userData ? JSON.parse(userData)?.email : null;
    
    const response = await fetch('/.netlify/functions/savePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        subscription: subscription.toJSON ? subscription.toJSON() : subscription, 
        userId 
      })
    });
    
    if (!response.ok) {
      console.warn('[Meteor] Falha ao salvar subscription no servidor:', response.status);
    }
  } catch (error) {
    // Silently fail - o push ainda funciona localmente
    console.warn('[Meteor] Erro ao salvar subscription:', error);
  }
};

const deleteSubscriptionFromServer = async (subscription: PushSubscription | any): Promise<void> => {
  try {
    await fetch('/.netlify/functions/deletePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
  } catch (error) {
    // Silently fail
  }
};

export const sendTestNotification = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;
  
  if (Notification.permission !== 'granted') {
    throw new Error('Permissão para notificações não concedida');
  }

  await registration.showNotification('Meteor - Teste', {
    body: 'Notificações estão funcionando corretamente!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'test',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'OK' }
    ]
  });
};

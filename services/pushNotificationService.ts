const PUBLIC_VAPID_KEY = typeof window !== 'undefined' 
  ? (window as any).ENV?.VAPID_PUBLIC_KEY || '' 
  : '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  } catch (error) {
    throw new Error('Falha ao processar chave VAPID');
  }
}

export const isPushSupported = (): boolean => {
  try {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  } catch (e) {
    return false;
  }
};

export const isIOSSafari = (): boolean => {
  try {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i);
  } catch (e) {
    return false;
  }
};

export const isPWAInstalled = (): boolean => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch (e) {
    return false;
  }
};

// Detecta Chrome Mobile específico
export const isChromeMobile = (): boolean => {
  const ua = navigator.userAgent;
  return /Android/.test(ua) && /Chrome/.test(ua) && !/Edg/.test(ua) && !/Firefox/.test(ua);
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;
  if (!window.isSecureContext) throw new Error('HTTPS necessário');

  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;
    
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error: any) {
    throw new Error('Erro ao registrar SW: ' + error.message);
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas');
  }
  return await Notification.requestPermission();
};

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  console.log('[Push] Iniciando... UA:', navigator.userAgent.substring(0, 60));
  
  try {
    if (!isPushSupported()) {
      throw new Error('Push não suportado neste navegador');
    }

    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Instale o app na tela inicial (iOS)');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada pelo usuário');
    }

    const registration = await registerServiceWorker();
    if (!registration) throw new Error('Falha ao registrar Service Worker');

    // Verifica se já existe
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    if (!PUBLIC_VAPID_KEY) {
      throw new Error('VAPID key não configurada');
    }

    console.log('[Push] Tentando subscrever...');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });
    
    console.log('[Push] Sucesso!');
    localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
    return subscription;
    
  } catch (error: any) {
    console.error('[Push] ERRO:', error.name, error.message);
    localStorage.removeItem('meteor_push_subscription');
    
    // MENSAGEM ESPECÍFICA PARA O ERRO DO CHROME MOBILE
    if (error.message?.includes('push service error') || error.message?.includes('Registration failed')) {
      throw new Error(
        'Não foi possível ativar notificações push. ' +
        'No Chrome Android, isso pode ocorrer devido a:\n\n' +
        '1. Google Play Services desatualizado\n' +
        '2. Restrições de rede/rede móvel\n' +
        '3. Problema temporário nos servidores do Google\n\n' +
        'Tente novamente mais tarde ou use Firefox (que funciona melhor em Android).'
      );
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
      localStorage.removeItem('meteor_push_subscription');
      return true;
    }
    return false;
  } catch (error) {
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
    return { isSubscribed: !!subscription, subscription };
  } catch (error) {
    return { isSubscribed: false, subscription: null };
  }
};

export const sendTestNotification = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;
  
  if (Notification.permission !== 'granted') {
    throw new Error('Permissão não concedida');
  }

  await registration.showNotification('Meteor - Teste', {
    body: 'Notificações funcionando!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'test'
  });
};

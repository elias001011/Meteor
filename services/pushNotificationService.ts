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

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (!window.isSecureContext) {
    throw new Error('Service Worker requer HTTPS ou localhost');
  }

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration) {
      return existingRegistration;
    }
    
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (error: any) {
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

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  console.log('[Push] === INICIANDO ===');
  console.log('[Push] UserAgent:', navigator.userAgent);
  
  try {
    if (!isPushSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Para receber notificações no iOS, instale o app na tela inicial');
    }

    const permission = await requestNotificationPermission();
    console.log('[Push] Permissão:', permission);
    
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada pelo usuário');
    }

    console.log('[Push] Registrando SW...');
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }
    console.log('[Push] SW registrado:', registration.scope);

    console.log('[Push] Verificando subscription existente...');
    const existingSubscription = await registration.pushManager.getSubscription();
    console.log('[Push] Existente:', existingSubscription ? 'SIM' : 'NÃO');
    
    if (existingSubscription) {
      console.log('[Push] Retornando subscription existente');
      return existingSubscription;
    }

    console.log('[Push] VAPID disponível:', !!PUBLIC_VAPID_KEY);
    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada no servidor');
    }

    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
    } catch (e) {
      throw new Error('Erro ao processar chave VAPID');
    }

    console.log('[Push] Chamando subscribe...');
    
    // TENTA SUBSCREVER - SEM TRADUÇÃO DE ERRO
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    console.log('[Push] SUCESSO! Endpoint:', subscription.endpoint.substring(0, 30));
    
    try {
      localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
    } catch (e) {}
    
    return subscription;
    
  } catch (error: any) {
    // LOG DO ERRO ORIGINAL SEM MODIFICAR
    console.error('[Push] ERRO ORIGINAL:');
    console.error('  name:', error.name);
    console.error('  message:', error.message);
    console.error('  code:', error.code);
    console.error('  full:', error);
    
    // Limpa localStorage
    localStorage.removeItem('meteor_push_subscription');
    
    // RETORNA O ERRO ORIGINAL SEM TRADUÇÃO
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
    return {
      isSubscribed: !!subscription,
      subscription
    };
  } catch (error) {
    return { isSubscribed: false, subscription: null };
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

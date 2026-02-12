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

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    throw new Error('Erro ao solicitar permissão de notificação');
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

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      try {
        await saveSubscriptionToServer(existingSubscription);
        localStorage.setItem('meteor_push_subscription', JSON.stringify(existingSubscription));
      } catch (e) {
        // Continua mesmo se falhar salvar no servidor
      }
      return existingSubscription;
    }

    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada no servidor');
    }

    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
    } catch (e) {
      throw new Error('Erro ao processar chave VAPID');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    try {
      await saveSubscriptionToServer(subscription);
      localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
    } catch (e) {
      // Continua mesmo se falhar salvar no servidor
    }
    
    return subscription;
  } catch (error: any) {
    localStorage.removeItem('meteor_push_subscription');
    throw error;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      try {
        await deleteSubscriptionFromServer(subscription);
      } catch (e) {
        // Ignora erro ao deletar do servidor
      }
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

const saveSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
  try {
    const userData = localStorage.getItem('meteor_user_data');
    const userId = userData ? JSON.parse(userData)?.email : null;
    
    await fetch('/.netlify/functions/savePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId })
    });
  } catch (error) {
    // Silently fail
  }
};

const deleteSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
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
  try {
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
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao enviar notificação de teste');
  }
};

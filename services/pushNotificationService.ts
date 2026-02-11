
// Serviço de Notificações Push
// Permite receber notificações mesmo quando o app está fechado

const PUBLIC_VAPID_KEY = typeof window !== 'undefined' 
  ? (window as any).ENV?.VAPID_PUBLIC_KEY || '' 
  : '';

// Converte chave VAPID para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// Verifica se o navegador suporta notificações push
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Verifica se está no iOS Safari (tem limitações)
export const isIOSSafari = (): boolean => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  return iOS && webkit && !ua.match(/CriOS/i);
};

// Verifica se o PWA está instalado (necessário para iOS)
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Registra o Service Worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado neste navegador');
    return null;
  }

  // Verifica se está em contexto seguro (HTTPS ou localhost)
  if (!window.isSecureContext) {
    console.warn('Service Worker requer HTTPS ou localhost para funcionar');
    throw new Error('Contexto não seguro: Service Worker requer HTTPS');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('Service Worker registrado:', registration);
    return registration;
  } catch (error: any) {
    console.error('Erro ao registrar Service Worker:', error);
    if (error.name === 'SecurityError' || error.message?.includes('secure')) {
      throw new Error('Service Worker requer HTTPS ou localhost para funcionar');
    }
    throw new Error('Não foi possível registrar o Service Worker');
  }
};

// Solicita permissão para notificações
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas neste navegador');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Inscreve o usuário em notificações push
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    // Verifica suporte
    if (!isPushSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    // Verifica iOS Safari
    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Para receber notificações no iOS, instale o app na tela inicial');
    }

    // Registra Service Worker se ainda não estiver registrado
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }

    // Solicita permissão
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada');
    }

    // Verifica se já existe uma inscrição
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Já inscrito em push:', existingSubscription);
      return existingSubscription;
    }

    // Se não temos a chave pública, não podemos nos inscrever
    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada');
    }

    // Cria nova inscrição
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    console.log('Inscrito em push:', subscription);
    
    // Salva a inscrição no servidor
    await saveSubscriptionToServer(subscription);
    
    // Salva localmente
    localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
    
    return subscription;
  } catch (error) {
    console.error('Erro ao inscrever em push:', error);
    throw error;
  }
};

// Cancela inscrição em notificações push
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscriptionFromServer(subscription);
      localStorage.removeItem('meteor_push_subscription');
      console.log('Cancelada inscrição em push');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    return false;
  }
};

// Verifica status da inscrição
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

// Salva inscrição no servidor
const saveSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
  try {
    await fetch('/.netlify/functions/savePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });
  } catch (error) {
    console.error('Erro ao salvar inscrição no servidor:', error);
  }
};

// Deleta inscrição do servidor
const deleteSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
  try {
    await fetch('/.netlify/functions/deletePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
  } catch (error) {
    console.error('Erro ao deletar inscrição do servidor:', error);
  }
};

// Envia notificação de teste
export const sendTestNotification = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;
  
  // Verifica permissão
  if (Notification.permission !== 'granted') {
    throw new Error('Permissão para notificações não concedida');
  }

  // Mostra notificação local
  await registration.showNotification('Meteor - Teste', {
    body: 'Notificações estão funcionando corretamente! 🎉',
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

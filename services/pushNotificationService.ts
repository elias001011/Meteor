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
  console.log('[Push] Iniciando registro do SW...');
  
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] SW não suportado');
    return null;
  }

  if (!window.isSecureContext) {
    console.log('[Push] Não é secure context');
    throw new Error('Service Worker requer HTTPS ou localhost');
  }

  try {
    // Verifica se já existe um registro
    console.log('[Push] Verificando registro existente...');
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration) {
      console.log('[Push] Registro existente encontrado:', existingRegistration.scope);
      console.log('[Push] Estado do SW:', existingRegistration.active?.state || 'não ativo');
      return existingRegistration;
    }
    
    // Tenta registrar novo
    console.log('[Push] Registrando novo SW...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] SW registrado:', registration.scope);
    console.log('[Push] Estado inicial:', registration.installing?.state || registration.active?.state);
    
    // Aguarda ativação se necessário
    if (registration.installing) {
      console.log('[Push] Aguardando instalação...');
      await new Promise<void>((resolve) => {
        const sw = registration.installing;
        sw?.addEventListener('statechange', () => {
          console.log('[Push] Mudança de estado:', sw.state);
          if (sw.state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    return registration;
  } catch (error: any) {
    console.error('[Push] Erro ao registrar SW:', error.name, error.message);
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
    console.log('[Push] Permissão:', permission);
    return permission;
  } catch (e) {
    throw new Error('Erro ao solicitar permissão de notificação');
  }
};

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  console.log('[Push] === Iniciando subscribeToPush ===');
  
  try {
    if (!isPushSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Para receber notificações no iOS, instale o app na tela inicial');
    }

    // Solicita permissão
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada');
    }

    // Registra SW
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }

    // Verifica se já existe subscription
    console.log('[Push] Verificando subscription existente...');
    let existingSubscription: PushSubscription | null = null;
    try {
      existingSubscription = await registration.pushManager.getSubscription();
      console.log('[Push] Subscription existente:', existingSubscription ? 'SIM' : 'NÃO');
    } catch (e: any) {
      console.error('[Push] Erro ao verificar subscription:', e.message);
      // Continua mesmo se falhar
    }
    
    if (existingSubscription) {
      console.log('[Push] Usando subscription existente');
      return existingSubscription;
    }

    // Verifica VAPID key
    console.log('[Push] VAPID Key disponível:', !!PUBLIC_VAPID_KEY);
    console.log('[Push] VAPID Key tamanho:', PUBLIC_VAPID_KEY.length);
    
    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada no servidor');
    }

    // Converte VAPID key
    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      console.log('[Push] VAPID convertida com sucesso');
    } catch (e: any) {
      console.error('[Push] Erro ao converter VAPID:', e.message);
      throw new Error('Erro ao processar chave VAPID');
    }

    // FAZ A SUBSCRIPTION
    console.log('[Push] Chamando pushManager.subscribe()...');
    console.log('[Push] UserAgent:', navigator.userAgent.substring(0, 50));
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('[Push] Subscription criada com sucesso!');
      console.log('[Push] Endpoint:', subscription.endpoint?.substring(0, 50) + '...');
      
      // Salva localmente
      try {
        localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
      } catch (e) {
        // Ignora erro de localStorage
      }
      
      return subscription;
    } catch (subscribeError: any) {
      console.error('[Push] ERRO NA SUBSCRIPTION:');
      console.error('  - Nome:', subscribeError.name);
      console.error('  - Mensagem:', subscribeError.message);
      console.error('  - Código:', subscribeError.code);
      
      // Erros específicos do Chrome Android/FCM
      if (subscribeError.message?.includes('subscription')) {
        throw new Error('Falha na subscription: ' + subscribeError.message);
      }
      if (subscribeError.message?.includes('permission')) {
        throw new Error('Permissão negada pelo sistema');
      }
      
      throw subscribeError;
    }
    
  } catch (error: any) {
    console.error('[Push] Erro geral em subscribeToPush:', error.message);
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

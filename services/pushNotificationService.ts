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

// Detecta se é Android
export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

// Detecta se é Chrome no Android
export const isChromeAndroid = (): boolean => {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/Firefox/i.test(ua) && !/Edg/i.test(ua);
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
    console.log('[Push] Verificando registro existente...');
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration) {
      console.log('[Push] Registro existente encontrado:', existingRegistration.scope);
      console.log('[Push] Estado do SW:', existingRegistration.active?.state || 'não ativo');
      
      // Se não estiver ativo, aguarda
      if (!existingRegistration.active && existingRegistration.installing) {
        console.log('[Push] Aguardando ativação...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout aguardando SW ativar'));
          }, 5000);
          
          existingRegistration.installing?.addEventListener('statechange', (e) => {
            const state = (e.target as ServiceWorker).state;
            console.log('[Push] SW statechange:', state);
            if (state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        });
      }
      
      return existingRegistration;
    }
    
    console.log('[Push] Registrando novo SW...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] SW registrado:', registration.scope);
    
    // Aguarda ativação
    if (registration.installing) {
      console.log('[Push] Aguardando instalação/ativação...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout aguardando SW ativar'));
        }, 5000);
        
        const sw = registration.installing;
        sw?.addEventListener('statechange', () => {
          console.log('[Push] SW statechange:', sw.state);
          if (sw.state === 'activated') {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    }
    
    return registration;
  } catch (error: any) {
    console.error('[Push] Erro ao registrar SW:', error.name, error.message);
    throw error;
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
  console.log('[Push] UserAgent:', navigator.userAgent);
  console.log('[Push] isAndroid:', isAndroid());
  console.log('[Push] isChromeAndroid:', isChromeAndroid());
  
  try {
    if (!isPushSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    if (isIOSSafari() && !isPWAInstalled()) {
      throw new Error('Para receber notificações no iOS, instale o app na tela inicial');
    }

    // NOVO: Verificação específica para Chrome Android
    if (isChromeAndroid()) {
      console.log('[Push] Detectado Chrome Android - aplicando workarounds');
      
      // Verifica se está em contexto seguro
      if (!window.isSecureContext) {
        throw new Error('Chrome Android requer HTTPS para push');
      }
      
      // Verifica se tem permissão de notificação no sistema (não só no browser)
      if ('permissions' in navigator) {
        try {
          const status = await navigator.permissions.query({ name: 'notifications' as PermissionName });
          console.log('[Push] Permission status:', status.state);
        } catch (e) {
          console.log('[Push] Não conseguiu verificar permission status');
        }
      }
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada');
    }

    // NOVO: Para Chrome Android, tenta usar navigator.serviceWorker.ready primeiro
    let registration: ServiceWorkerRegistration | null = null;
    
    if (isChromeAndroid()) {
      try {
        console.log('[Push] Chrome Android: tentando navigator.serviceWorker.ready...');
        registration = await navigator.serviceWorker.ready;
        console.log('[Push] Chrome Android: SW ready funciou!');
      } catch (readyError: any) {
        console.log('[Push] Chrome Android: SW ready falhou:', readyError.message);
        // Continua para tentar registro normal
      }
    }
    
    if (!registration) {
      registration = await registerServiceWorker();
    }
    
    if (!registration) {
      throw new Error('Não foi possível registrar o Service Worker');
    }

    console.log('[Push] Registro obtido:', registration.scope);
    console.log('[Push] SW ativo?', !!registration.active);

    // Verifica subscription existente
    console.log('[Push] Verificando subscription existente...');
    let existingSubscription: PushSubscription | null = null;
    try {
      existingSubscription = await registration.pushManager.getSubscription();
      console.log('[Push] Subscription existente:', existingSubscription ? 'SIM' : 'NÃO');
    } catch (e: any) {
      console.error('[Push] Erro ao verificar subscription:', e.message);
    }
    
    if (existingSubscription) {
      console.log('[Push] Usando subscription existente');
      return existingSubscription;
    }

    // Verifica VAPID
    console.log('[Push] VAPID Key disponível:', !!PUBLIC_VAPID_KEY);
    console.log('[Push] VAPID Key tamanho:', PUBLIC_VAPID_KEY.length);
    
    if (!PUBLIC_VAPID_KEY) {
      throw new Error('Chave VAPID não configurada no servidor');
    }

    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      console.log('[Push] VAPID convertida com sucesso');
    } catch (e: any) {
      console.error('[Push] Erro ao converter VAPID:', e.message);
      throw new Error('Erro ao processar chave VAPID');
    }

    // FAZ A SUBSCRIPTION COM TRATAMENTO ESPECÍFICO
    console.log('[Push] Chamando pushManager.subscribe()...');
    
    try {
      // NOVO: Para Chrome Android, adiciona um pequeno delay antes de subscrever
      // Isso ajuda em casos onde o SW acabou de ativar
      if (isChromeAndroid()) {
        console.log('[Push] Chrome Android: aguardando 500ms antes de subscrever...');
        await new Promise(r => setTimeout(r, 500));
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('[Push] Subscription criada com sucesso!');
      console.log('[Push] Endpoint:', subscription.endpoint?.substring(0, 50) + '...');
      
      try {
        localStorage.setItem('meteor_push_subscription', JSON.stringify(subscription));
      } catch (e) {}
      
      return subscription;
      
    } catch (subscribeError: any) {
      console.error('[Push] ERRO NA SUBSCRIPTION:');
      console.error('  - Nome:', subscribeError.name);
      console.error('  - Mensagem:', subscribeError.message);
      console.error('  - Stack:', subscribeError.stack);
      
      // Mensagem específica para Chrome Android
      if (isChromeAndroid()) {
        if (subscribeError.message?.includes('registration')) {
          throw new Error('Falha no registro de push. Se você está usando o app instalado (TWA), verifique se as notificações estão habilitadas nas configurações do Android.');
        }
        if (subscribeError.name === 'AbortError' || subscribeError.name === 'NotAllowedError') {
          throw new Error('Push bloqueado. Para Chrome Android/TWA: 1) Verifique se o app tem permissão de notificação nas configurações do Android, 2) Tente usar pelo navegador Chrome primeiro.');
        }
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

/**
 * Serviço de Push Notifications - Meteor v6.0
 * Simplificado e robusto, usando Web Push API
 */

const VAPID_PUBLIC_KEY = typeof window !== 'undefined' 
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

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;
  if (!window.isSecureContext) {
    console.warn('[Push] HTTPS necessário para push');
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;
    
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error: any) {
    console.error('[Push] Erro ao registrar SW:', error.message);
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas neste navegador');
  }
  return await Notification.requestPermission();
};

export interface PushSubscriptionData {
  subscription: PushSubscription;
  city: string;
  enabled: boolean;
  createdAt: string;
}

export const subscribeToPush = async (city: string): Promise<PushSubscription | null> => {
  console.log('[Push] Iniciando inscrição para cidade:', city);
  
  try {
    if (!isPushSupported()) {
      throw new Error('Push não suportado neste navegador');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Falha ao registrar Service Worker');
    }

    // Verifica se já existe subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log('[Push] Subscription já existe');
      await saveSubscription(existing, city);
      return existing;
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('Chave VAPID não configurada');
    }

    console.log('[Push] Criando nova subscription...');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    console.log('[Push] Subscription criada com sucesso');
    
    // Salva no servidor
    await saveSubscription(subscription, city);
    
    // Salva localmente
    localStorage.setItem('meteor_push_city', city);
    
    return subscription;
    
  } catch (error: any) {
    console.error('[Push] ERRO:', error.message);
    throw error;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Remove do servidor
      await fetch('/.netlify/functions/deleteSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      
      localStorage.removeItem('meteor_push_city');
      console.log('[Push] Desinscrito com sucesso');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('[Push] Erro ao desinscrever:', error.message);
    localStorage.removeItem('meteor_push_city');
    return false;
  }
};

const saveSubscription = async (subscription: PushSubscription, city: string): Promise<void> => {
  try {
    const response = await fetch('/.netlify/functions/saveSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        city: city,
        enabled: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Falha ao salvar subscription no servidor');
    }
    
    console.log('[Push] Subscription salva no servidor');
  } catch (error: any) {
    console.error('[Push] Erro ao salvar:', error.message);
    throw error;
  }
};

export const getPushStatus = async (): Promise<{ isSubscribed: boolean; city: string | null }> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    const city = localStorage.getItem('meteor_push_city');
    return { isSubscribed: !!subscription, city };
  } catch (error) {
    return { isSubscribed: false, city: null };
  }
};

export const sendTestNotification = async (): Promise<void> => {
  try {
    const response = await fetch('/.netlify/functions/sendTestNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar notificação de teste');
    }
    
    console.log('[Push] Notificação de teste enviada');
  } catch (error: any) {
    console.error('[Push] Erro no teste:', error.message);
    throw error;
  }
};

/**
 * Serviço de Push Notifications - Meteor v6.0
 * Simplificado e robusto, usando Web Push API
 */

// Pega a chave VAPID do window.ENV (injetada pelo Netlify)
const getVapidPublicKey = (): string => {
  if (typeof window !== 'undefined') {
    const fromWindow = (window as any).ENV?.VAPID_PUBLIC_KEY;
    if (fromWindow && fromWindow !== 'undefined' && fromWindow !== '') {
      return fromWindow;
    }
  }
  return '';
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
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) {
      console.log('[Push] SW existente encontrado');
      // Força update do SW
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
    throw new Error('Notificações não suportadas neste navegador');
  }
  
  console.log('[Push] Solicitando permissão...');
  const permission = await Notification.requestPermission();
  console.log('[Push] Permissão:', permission);
  return permission;
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
      throw new Error('Permissão de notificação negada pelo usuário');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Falha ao registrar Service Worker');
    }

    // Verifica se já existe subscription
    let existing = await registration.pushManager.getSubscription();
    
    // Se existe, remove primeiro (limpa subscription antiga)
    if (existing) {
      console.log('[Push] Removendo subscription antiga...');
      await existing.unsubscribe();
      console.log('[Push] Subscription antiga removida');
    }

    // Aguarda configuração carregar
    console.log('[Push] Aguardando configuração VAPID...');
    const configLoaded = await waitForConfig();
    
    const VAPID_PUBLIC_KEY = getVapidPublicKey();
    console.log('[Push] VAPID Key disponível:', VAPID_PUBLIC_KEY ? 'Sim' : 'Não');
    
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('Chave VAPID não configurada. Recarregue a página e tente novamente.');
    }

    console.log('[Push] Criando nova subscription...');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    console.log('[Push] Subscription criada:', subscription.endpoint.substring(0, 50) + '...');
    
    // Salva no servidor
    await saveSubscription(subscription, city);
    
    // Salva localmente
    localStorage.setItem('meteor_push_city', city);
    localStorage.setItem('meteor_push_enabled', 'true');
    
    return subscription;
    
  } catch (error: any) {
    console.error('[Push] ERRO:', error.message);
    throw error;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  console.log('[Push] Desativando notificações...');
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push] Unsubscribing...');
      await subscription.unsubscribe();
      
      // Remove do servidor
      try {
        await fetch('/.netlify/functions/deleteSubscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      } catch (e) {
        console.warn('[Push] Erro ao remover do servidor:', e);
      }
      
      console.log('[Push] Desinscrito com sucesso');
    }
    
    // Limpa localStorage
    localStorage.removeItem('meteor_push_city');
    localStorage.removeItem('meteor_push_enabled');
    
    return true;
  } catch (error: any) {
    console.error('[Push] Erro ao desinscrever:', error.message);
    localStorage.removeItem('meteor_push_city');
    localStorage.removeItem('meteor_push_enabled');
    return false;
  }
};

const saveSubscription = async (subscription: PushSubscription, city: string): Promise<void> => {
  console.log('[Push] Salvando subscription no servidor...');
  
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
      const errorText = await response.text();
      throw new Error(`Falha ao salvar: ${errorText}`);
    }
    
    console.log('[Push] Subscription salva no servidor');
  } catch (error: any) {
    console.error('[Push] Erro ao salvar:', error.message);
    throw error;
  }
};

export const getPushStatus = async (): Promise<{ isSubscribed: boolean; city: string | null }> => {
  try {
    // Verifica localStorage primeiro (mais rápido)
    const localEnabled = localStorage.getItem('meteor_push_enabled');
    const localCity = localStorage.getItem('meteor_push_city');
    
    // Se não tem no localStorage, considera desativado
    if (localEnabled !== 'true') {
      console.log('[Push] Status: desativado (localStorage)');
      return { isSubscribed: false, city: localCity };
    }
    
    // Verifica se a subscription ainda existe no navegador
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Limpa localStorage se não tem subscription
      localStorage.removeItem('meteor_push_enabled');
      console.log('[Push] Status: desativado (sem subscription)');
      return { isSubscribed: false, city: localCity };
    }
    
    console.log('[Push] Status: ativo');
    return { isSubscribed: true, city: localCity };
  } catch (error) {
    console.error('[Push] Erro ao verificar status:', error);
    return { isSubscribed: false, city: null };
  }
};

export const sendTestNotification = async (): Promise<void> => {
  console.log('[Push] Enviando notificação de teste...');
  
  try {
    const response = await fetch('/.netlify/functions/sendTestNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar teste');
    }
    
    console.log('[Push] Notificação de teste enviada');
  } catch (error: any) {
    console.error('[Push] Erro no teste:', error.message);
    throw error;
  }
};

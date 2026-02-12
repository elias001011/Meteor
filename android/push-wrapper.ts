/**
 * Push Wrapper - Meteor Android
 * Detecta TWA e usa FCM, senão usa Web Push padrão
 * Integração com o sistema existente da dev
 */

import { 
  isPushSupported as isWebPushSupported,
  subscribeToPush as subscribeWebPush,
  unsubscribeFromPush as unsubscribeWebPush,
  getPushStatus as getWebPushStatus,
  sendTestNotification as sendWebTest
} from '../services/pushService';

// Detecta se está no TWA
const isTWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/.test(navigator.userAgent);
  return isStandalone && isAndroid;
};

// Inicializa Firebase
let fcmModule: any = null;
const initFCM = async () => {
  if (fcmModule) return fcmModule;
  
  try {
    fcmModule = await import('./fcm-push.js');
    return fcmModule;
  } catch (e) {
    console.error('[PushWrapper] Erro ao carregar FCM:', e);
    return null;
  }
};

// ============================================
// API PÚBLICA - Usada pela AlertsView
// ============================================

export const isPushSupported = (): boolean => {
  // Web Push é suportado em ambos, FCM apenas no TWA
  return isWebPushSupported();
};

export const subscribeToPush = async (city: string) => {
  if (isTWA()) {
    console.log('[PushWrapper] TWA detectado, usando FCM');
    const fcm = await initFCM();
    if (fcm) {
      return await fcm.subscribePush(city);
    }
  }
  
  console.log('[PushWrapper] Usando Web Push padrão');
  return await subscribeWebPush(city);
};

export const unsubscribeFromPush = async () => {
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (pushType === 'fcm') {
    const fcm = await initFCM();
    if (fcm) {
      await fcm.unsubscribePush();
    }
  }
  
  // Sempre tenta remover Web Push também
  await unsubscribeWebPush();
  localStorage.removeItem('meteor_push_type');
};

export const getPushStatus = async () => {
  // Verifica se tem FCM ativo
  const pushType = localStorage.getItem('meteor_push_type');
  const city = localStorage.getItem('meteor_push_city');
  
  if (pushType === 'fcm') {
    return { isSubscribed: true, city, type: 'fcm' };
  }
  
  // Fallback para Web Push
  return await getWebPushStatus();
};

export const sendTestNotification = async () => {
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (pushType === 'fcm') {
    // Para FCM, envia notificação de teste via servidor
    const fcm = await initFCM();
    if (fcm) {
      // Reusa a função de teste existente
      return await sendWebTest();
    }
  }
  
  // Web Push
  return await sendWebTest();
};

export const getPushType = () => {
  return localStorage.getItem('meteor_push_type') || 'web';
};

// Exports compatíveis com o pushService.ts original
export { isWebPushSupported };

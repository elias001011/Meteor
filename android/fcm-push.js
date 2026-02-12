/**
 * Firebase Cloud Messaging + Web Push Fallback - Meteor Android
 * Detecta se está no TWA e usa FCM, senão usa Web Push padrão
 */

// Configuração Firebase (sem dados sensíveis)
const firebaseConfig = {
  apiKey: "AIzaSyBsvIYTFYii5rxVOSVU58AJjPafjaMv4mI",
  authDomain: "meteor-weather-13033.firebaseapp.com",
  projectId: "meteor-weather-13033",
  storageBucket: "meteor-weather-13033.firebasestorage.app",
  messagingSenderId: "919442203209",
  appId: "1:919442203209:android:e1a3dc2b50639982701598"
};

// Detecta se está rodando no TWA (APK Android)
export const isTWA = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isTWA = navigator.userAgent.includes('TWA') || 
                document.referrer.includes('android-app://');
  
  return isStandalone && isAndroid;
};

// Inicializa Firebase se estiver no TWA
let messaging = null;
let fcmInitialized = false;

export const initFCM = async () => {
  if (!isTWA()) {
    console.log('[FCM] Não está no TWA, pulando FCM');
    return null;
  }
  
  if (fcmInitialized) return messaging;
  
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    
    // Handler para mensagens em foreground
    onMessage(messaging, (payload) => {
      console.log('[FCM] Mensagem recebida em foreground:', payload);
      showLocalNotification(payload);
    });
    
    fcmInitialized = true;
    console.log('[FCM] Inicializado com sucesso');
    return messaging;
  } catch (error) {
    console.error('[FCM] Erro ao inicializar:', error);
    return null;
  }
};

// Obtém token FCM
export const getFCMToken = async () => {
  if (!messaging) {
    await initFCM();
  }
  
  if (!messaging) return null;
  
  try {
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    const token = await getToken(messaging, {
      vapidKey: 'BCO0C6hZ4122lxqL0iG_lzfbjXybgjB6e-GOFA9yNj1RZfK9f5Qs1i9PQYZF1bTt2yH9LPwVd1N5j5qk5GjJ5E' // VAPID key do Firebase
    });
    
    if (token) {
      console.log('[FCM] Token obtido:', token.substring(0, 20) + '...');
      await saveFCMToken(token);
      return { type: 'fcm', token };
    }
    
    return null;
  } catch (error) {
    console.error('[FCM] Erro ao obter token:', error);
    return null;
  }
};

// Salva token FCM no servidor
const saveFCMToken = async (token) => {
  try {
    await fetch('/.netlify/functions/saveFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: 'android',
        source: 'fcm'
      })
    });
  } catch (error) {
    console.error('[FCM] Erro ao salvar token:', error);
  }
};

// Mostra notificação local
const showLocalNotification = (payload) => {
  if (Notification.permission !== 'granted') return;
  
  const { title, body, icon } = payload.notification || {};
  
  new Notification(title || 'Meteor', {
    body: body || 'Nova notificação',
    icon: icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: payload.data?.priority === 'high'
  });
};

// ============================================
// FUNÇÃO PRINCIPAL - Detecta e usa FCM ou Web Push
// ============================================

export const subscribePush = async (city) => {
  console.log('[Push] Iniciando订阅 para:', city);
  
  // Se está no TWA, tenta FCM primeiro
  if (isTWA()) {
    console.log('[Push] Detectado TWA, tentando FCM...');
    const fcmResult = await getFCMToken();
    if (fcmResult) {
      localStorage.setItem('meteor_push_type', 'fcm');
      localStorage.setItem('meteor_push_city', city);
      localStorage.setItem('meteor_push_enabled', 'true');
      return fcmResult;
    }
    console.log('[Push] FCM falhou, fallback para Web Push...');
  }
  
  // Fallback para Web Push padrão
  console.log('[Push] Usando Web Push padrão');
  const { subscribeToPush } = await import('../services/pushService.js');
  const result = await subscribeToPush(city);
  localStorage.setItem('meteor_push_type', 'web');
  return result;
};

export const unsubscribePush = async () => {
  const pushType = localStorage.getItem('meteor_push_type');
  
  if (pushType === 'fcm' && messaging) {
    // Remove token FCM do servidor
    const { getToken, deleteToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    const token = await getToken(messaging);
    if (token) {
      await deleteToken(messaging);
    }
  }
  
  // Sempre remove Web Push também (por segurança)
  const { unsubscribeFromPush } = await import('../services/pushService.js');
  await unsubscribeFromPush();
  
  localStorage.removeItem('meteor_push_type');
};

export const getPushType = () => {
  return localStorage.getItem('meteor_push_type') || 'web';
};

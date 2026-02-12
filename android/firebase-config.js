/**
 * Configuração Firebase Cloud Messaging (FCM) para Meteor APK
 * 
 * Este arquivo deve ser carregado no seu app web quando detectar
 * que está rodando dentro do TWA (Trusted Web Activity).
 * 
 * O TWA com FCM permite notificações push mais confiáveis e com
 * melhor integração nativa do que o Web Push padrão.
 */

// Configuração do Firebase (substitua com suas credenciais)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "meteor-weather.firebaseapp.com",
  projectId: "meteor-weather",
  storageBucket: "meteor-weather.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializar Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Verifica se o app está rodando dentro do TWA/APK
 */
export const isRunningInTWA = (): boolean => {
  // O TWA injeta este objeto no window
  return !!(window as any).android;
};

/**
 * Obtém o FCM Token para notificações push nativas
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'SUA_VAPID_KEY_PUBLICA_DO_FIREBASE'
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('Nenhum token disponível');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter FCM token:', error);
    return null;
  }
};

/**
 * Handler para mensagens em foreground
 */
export const setupForegroundNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log('Mensagem recebida em foreground:', payload);
    
    // Mostrar notificação customizada
    const { title, body, icon, data } = payload.notification || {};
    
    // Usar a Notification API do navegador
    if (Notification.permission === 'granted') {
      new Notification(title || 'Meteor', {
        body: body || 'Nova notificação',
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: data?.tag || 'default',
        data: payload.data,
        requireInteraction: data?.requireInteraction === 'true'
      });
    }
  });
};

/**
 * Inicializa o FCM quando no TWA
 */
export const initFCM = async (): Promise<void> => {
  if (!isRunningInTWA()) {
    console.log('Não está rodando no TWA, usando Web Push padrão');
    return;
  }
  
  console.log('Inicializando FCM para TWA...');
  
  // Solicitar permissão
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Permissão de notificação negada');
    return;
  }
  
  // Obter token
  const token = await getFCMToken();
  if (token) {
    // Enviar token para seu servidor
    await sendFCMTokenToServer(token);
  }
  
  // Setup handler para foreground
  setupForegroundNotifications();
};

/**
 * Envia o FCM token para o servidor
 */
const sendFCMTokenToServer = async (token: string): Promise<void> => {
  try {
    await fetch('/.netlify/functions/saveFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        platform: 'android',
        source: 'twa'
      })
    });
  } catch (error) {
    console.error('Erro ao enviar token:', error);
  }
};

/**
 * Configuração Firebase Cloud Messaging (FCM) para Meteor APK
 * 
 * Dados do google-services.json:
 * - Project ID: meteor-weather-13033
 * - Project Number: 919442203209
 * - App ID: 1:919442203209:android:e1a3dc2b50639982701598
 * - Package: app.meteor.weather
 */

const firebaseConfig = {
  apiKey: "AIzaSyBsvIYTFYii5rxVOSVU58AJjPafjaMv4mI",
  authDomain: "meteor-weather-13033.firebaseapp.com",
  projectId: "meteor-weather-13033",
  storageBucket: "meteor-weather-13033.firebasestorage.app",
  messagingSenderId: "919442203209",
  appId: "1:919442203209:android:e1a3dc2b50639982701598"
};

// Inicializar Firebase apenas se estiver no TWA
let messaging = null;
let app = null;

export const initFirebase = async () => {
  if (!isRunningInTWA()) {
    console.log('Não está no TWA, pulando inicialização do Firebase');
    return null;
  }

  try {
    // Dynamic import para não carregar se não precisar
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    
    console.log('✅ Firebase inicializado');
    
    // Setup listener para mensagens em foreground
    onMessage(messaging, (payload) => {
      console.log('Mensagem FCM recebida em foreground:', payload);
      showLocalNotification(payload);
    });
    
    return messaging;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return null;
  }
};

/**
 * Verifica se o app está rodando dentro do TWA/APK
 */
export const isRunningInTWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches && 
         /Android/.test(navigator.userAgent);
};

/**
 * Obtém o FCM Token para enviar notificações push
 */
export const getFCMToken = async () => {
  if (!messaging) {
    await initFirebase();
  }
  
  if (!messaging) return null;

  try {
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    
    const currentToken = await getToken(messaging, {
      vapidKey: 'BCO...' // Opcional: VAPID key para web push fallback
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Salvar no servidor
      await saveTokenToServer(currentToken);
      return currentToken;
    } else {
      console.log('Nenhum token FCM disponível');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter FCM token:', error);
    return null;
  }
};

/**
 * Solicita permissão de notificação e retorna token
 */
export const requestFCMPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notificações não suportadas');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão negada');
  }

  return await getFCMToken();
};

/**
 * Envia token para o servidor
 */
const saveTokenToServer = async (token) => {
  try {
    await fetch('/.netlify/functions/saveFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: 'android',
        appId: '1:919442203209:android:e1a3dc2b50639982701598',
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
};

/**
 * Mostra notificação local quando app está em foreground
 */
const showLocalNotification = (payload) => {
  const { title, body, icon } = payload.notification || {};
  
  if (Notification.permission === 'granted') {
    new Notification(title || 'Meteor', {
      body: body || 'Nova notificação',
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: payload.data?.tag || 'default',
      data: payload.data,
      requireInteraction: payload.data?.priority === 'high'
    });
  }
};

/**
 * Verifica se tem permissão de notificação
 */
export const hasNotificationPermission = () => {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

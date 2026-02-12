import type { Handler } from '@netlify/functions';

/**
 * Netlify Function para enviar notificações via Firebase Cloud Messaging
 * Endpoint seguro para enviar push notifications para dispositivos Android (TWA)
 * 
 * Requer: FIREBASE_SERVER_KEY nas variáveis de ambiente
 */

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verificar autenticação (usar um secret ou JWT)
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const expectedSecret = process.env.NOTIFICATION_SECRET;
  
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'FCM not configured' })
    };
  }

  try {
    const { token, title, body, data, priority = 'high' } = JSON.parse(event.body || '{}');

    if (!token || !title || !body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token, title and body are required' })
      };
    }

    // Construir payload FCM (formato legacy para máxima compatibilidade)
    const payload = {
      to: token,
      priority,
      notification: {
        title,
        body,
        icon: 'ic_notification',
        sound: 'default',
        badge: '1',
        tag: data?.tag || 'default',
        click_action: 'OPEN_APP'
      },
      data: {
        ...data,
        title,
        body,
        timestamp: Date.now().toString()
      },
      android: {
        notification: {
          channel_id: data?.channel || 'default',
          priority: 'high',
          default_sound: true,
          default_vibrate_timings: true
        }
      }
    };

    // Enviar para FCM
    const response = await fetch(FCM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.failure > 0) {
      console.error('FCM partial failure:', result);
      
      // Se o token é inválido, removê-lo
      if (result.results?.[0]?.error === 'NotRegistered') {
        // TODO: Remover token do banco
        console.log('Token inválido, deve ser removido:', token.substring(0, 20) + '...');
      }
    }

    return {
      statusCode: response.ok ? 200 : 400,
      headers,
      body: JSON.stringify({
        success: response.ok && result.failure === 0,
        fcmResponse: result,
        sent: result.success || 0,
        failed: result.failure || 0
      })
    };
  } catch (error: any) {
    console.error('Error sending FCM notification:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send notification',
        details: error.message
      })
    };
  }
};


import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import webpush from 'web-push';

interface PushNotificationData {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  requireInteraction?: boolean;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Configurações CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Responde a preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  // Configura VAPID
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:alerts@meteor.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Serviço de push não configurado',
        message: 'As chaves VAPID não estão configuradas'
      }),
    };
  }

  try {
    // Configura web-push
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const data: PushNotificationData = JSON.parse(event.body || '{}');

    // Validação
    if (!data.subscription || !data.title || !data.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      url: data.url || '/',
      requireInteraction: data.requireInteraction || false,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Ignorar' }
      ]
    });

    // Envia a notificação
    await webpush.sendNotification(data.subscription, payload);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso'
      }),
    };

  } catch (error: any) {
    console.error('Erro ao enviar push:', error);
    
    // Se o subscription expirou (404/410), informa para remover
    if (error.statusCode === 404 || error.statusCode === 410) {
      return {
        statusCode: 410,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Subscription expirado',
          message: 'O usuário não está mais inscrito para receber notificações'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro ao enviar notificação',
        details: error.message
      }),
    };
  }
};

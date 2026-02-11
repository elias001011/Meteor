
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Configurações CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Responde a preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Configura VAPID
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:alerts@meteor.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'VAPID não configurado' }),
    };
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  try {
    const body = JSON.parse(event.body || '{}');
    const { city, alerts }: { city: string; alerts: any[] } = body;

    if (!alerts || alerts.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Nenhum alerta para enviar' }),
      };
    }

    // Busca todas as inscrições de push
    const store = getStore('pushSubscriptions');
    const subscriptions: PushSubscription[] = [];
    
    // Lista todas as inscrições (simplificado - em produção usar paginação)
    try {
      const list = await store.list();
      for (const key of list.blobs || []) {
        const sub = await store.get(key.key, { type: 'json' });
        if (sub?.subscription) {
          subscriptions.push(sub.subscription);
        }
      }
    } catch (e) {
      console.log('Nenhuma inscrição encontrada ou erro ao listar');
    }

    if (subscriptions.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Nenhuma inscrição ativa' }),
      };
    }

    // Envia notificação para cada inscrição
    const results = [];
    for (const subscription of subscriptions) {
      try {
        // Envia apenas o alerta mais crítico
        const criticalAlert = alerts.find(a => a.level === 'critical') || alerts[0];
        
        const payload = JSON.stringify({
          title: `🌩️ ${criticalAlert.title}`,
          body: `${city}: ${criticalAlert.message}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          url: '/',
          tag: criticalAlert.id,
          requireInteraction: criticalAlert.level === 'critical',
          actions: [
            { action: 'open', title: 'Abrir App' },
            { action: 'dismiss', title: 'Ignorar' }
          ]
        });

        await webpush.sendNotification(subscription, payload);
        results.push({ endpoint: subscription.endpoint.slice(-20), success: true });
      } catch (error: any) {
        console.error('Erro ao enviar push:', error.message);
        results.push({ endpoint: subscription.endpoint.slice(-20), success: false, error: error.message });
        
        // Se o subscription expirou, deleta
        if (error.statusCode === 404 || error.statusCode === 410) {
          const subId = subscription.endpoint.slice(-32);
          try {
            await store.delete(subId);
          } catch (e) {}
        }
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
    };

  } catch (error: any) {
    console.error('Erro no handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

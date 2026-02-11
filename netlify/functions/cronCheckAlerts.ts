import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

// Esta função é chamada por um serviço cron externo (ex: cron-job.org)
// Ela verifica alertas para TODOS os usuários inscritos
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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
    // Busca todas as inscrições de push
    const store = getStore('pushSubscriptions');
    const subscriptions: any[] = [];
    
    try {
      const list = await store.list();
      for (const key of list.blobs || []) {
        const sub = await store.get(key.key, { type: 'json' });
        if (sub?.subscription) {
          subscriptions.push({ ...sub, id: key.key });
        }
      }
    } catch (e) {
      console.log('Nenhuma inscrição encontrada');
    }

    if (subscriptions.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Nenhuma inscrição ativa' }),
      };
    }

    // Envia notificação de teste/ping para manter ativo
    let sent = 0;
    let failed = 0;
    
    for (const sub of subscriptions) {
      try {
        const payload = JSON.stringify({
          title: '☄️ Meteor',
          body: 'Seus alertas estão ativos. Fique tranquilo!',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          url: '/',
          tag: 'ping',
          requireInteraction: false,
        });

        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (error: any) {
        failed++;
        // Se expirou, remove
        if (error.statusCode === 404 || error.statusCode === 410) {
          await store.delete(sub.id);
        }
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: `Notificações enviadas: ${sent}, falhas: ${failed}`,
        activeSubscriptions: subscriptions.length,
      }),
    };

  } catch (error: any) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

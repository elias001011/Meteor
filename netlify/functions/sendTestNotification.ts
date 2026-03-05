import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const createStore = (name: string) => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  
  return getStore(name);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Pega o endpoint da requisição (opcional - se não tiver, busca do usuário logado)
  let targetEndpoint: string | null = null;
  try {
    const body = JSON.parse(event.body || '{}');
    targetEndpoint = body.endpoint || null;
  } catch (e) {}

  // Configura VAPID
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  console.log('[Test] VAPID Public:', vapidPublicKey ? 'OK' : 'FALTANDO');
  console.log('[Test] VAPID Private:', vapidPrivateKey ? 'OK' : 'FALTANDO');

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'VAPID não configurado' }),
    };
  }

  try {
    webpush.setVapidDetails(
      'mailto:alerts@meteor.app',
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro ao configurar VAPID', details: err.message }),
    };
  }

  const store = createStore('pushSubscriptions');

  try {
    console.log('[Test] Iniciando envio de teste...');
    
    // Se tem endpoint específico, usa ele
    if (targetEndpoint) {
      console.log('[Test] Buscando subscription específica...');
      const id = targetEndpoint.slice(-32);
      const data = await store.get(id, { type: 'json' });
      
      if (!data || !data.subscription) {
        console.log('[Test] Subscription não encontrada:', id);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Subscription não encontrada' }),
        };
      }

      console.log('[Test] Enviando notificação...');
      await webpush.sendNotification(
        data.subscription,
        JSON.stringify({
          title: '🧪 Teste de Notificação',
          body: 'Se você está vendo isso, as notificações estão funcionando! 🎉',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'test-notification',
          requireInteraction: false,
          data: { url: '/', type: 'test' }
        })
      );

      console.log('[Test] Notificação enviada com sucesso!');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Notificação de teste enviada' }),
      };
    }

    // Senão, envia para todas as subscriptions (modo admin/teste)
    const list = await store.list();
    const subscriptions = list.blobs || [];
    
    let sentCount = 0;

    for (const blob of subscriptions.slice(0, 5)) { // Max 5 para teste
      try {
        const data = await store.get(blob.key, { type: 'json' });
        
        if (!data || !data.enabled || !data.subscription) continue;

        await webpush.sendNotification(
          data.subscription,
          JSON.stringify({
            title: '🧪 Teste em Massa',
            body: 'Teste de notificação para múltiplos dispositivos',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'test-mass',
            data: { url: '/', type: 'test-mass' }
          })
        );
        sentCount++;
      } catch (e: any) {
        console.warn('Erro ao enviar teste:', e.message);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        message: `Notificações enviadas: ${sentCount}`,
        sentCount 
      }),
    };

  } catch (error: any) {
    console.error('[Test] Erro:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno', details: error.message }),
    };
  }
};

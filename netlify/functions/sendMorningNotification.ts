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
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Cidades com coordenadas
const cityCoordinates: Record<string, { lat: number; lon: number }> = {
  'porto alegre': { lat: -30.0346, lon: -51.2177 },
  'são paulo': { lat: -23.5505, lon: -46.6333 },
  'sao paulo': { lat: -23.5505, lon: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
  'brasília': { lat: -15.7975, lon: -47.8919 },
  'brasilia': { lat: -15.7975, lon: -47.8919 },
  'salvador': { lat: -12.9714, lon: -38.5014 },
  'fortaleza': { lat: -3.7172, lon: -38.5433 },
  'belo horizonte': { lat: -19.9167, lon: -43.9345 },
  'manaus': { lat: -3.1190, lon: -60.0217 },
  'curitiba': { lat: -25.4290, lon: -49.2671 },
  'recife': { lat: -8.0476, lon: -34.8770 },
  'belém': { lat: -1.4558, lon: -48.4902 },
  'belem': { lat: -1.4558, lon: -48.4902 },
  'goiânia': { lat: -16.6864, lon: -49.2643 },
  'goiania': { lat: -16.6864, lon: -49.2643 },
  'florianópolis': { lat: -27.5954, lon: -48.5480 },
  'florianopolis': { lat: -27.5954, lon: -48.5480 },
};

const getCoordinates = (city: string) => {
  const normalized = city.toLowerCase().trim();
  return cityCoordinates[normalized] || { lat: -30.0346, lon: -51.2177 };
};

// Envia notificação FCM
const sendFCM = async (token: string, payload: any) => {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) {
    console.error('[FCM] FIREBASE_SERVER_KEY não configurada');
    return false;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`
      },
      body: JSON.stringify({
        to: token,
        priority: 'high',
        notification: {
          title: payload.title,
          body: payload.body,
          icon: 'ic_notification',
          sound: 'default',
          badge: '1',
          tag: payload.tag || 'default'
        },
        data: {
          ...payload.data,
          title: payload.title,
          body: payload.body
        }
      })
    });

    const result = await response.json();
    
    if (result.failure > 0) {
      console.error('[FCM] Falha:', result);
      if (result.results?.[0]?.error === 'NotRegistered') {
        return 'expired'; // Token expirado
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[FCM] Erro ao enviar:', error);
    return false;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Configura VAPID
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const apiKey = process.env.CLIMA_API;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'VAPID não configurado' }),
    };
  }

  if (!apiKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'API key não configurada' }),
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

  const isTest = event.queryStringParameters?.test === 'true';
  const webStore = createStore('pushSubscriptions');
  const fcmStore = createStore('fcmTokens');

  try {
    // Processa Web Push subscriptions
    const webList = await webStore.list();
    const fcmList = await fcmStore.list();
    
    let webSent = 0, webFailed = 0;
    let fcmSent = 0, fcmFailed = 0, fcmExpired = 0;
    let alertsCount = 0;

    console.log(`[Cron] Processando: ${webList.blobs?.length || 0} Web Push, ${fcmList.blobs?.length || 0} FCM`);

    // Função para buscar clima e montar payload
    const getWeatherPayload = async (city: string) => {
      const coords = getCoordinates(city);
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${apiKey}`;
      
      const res = await fetch(url);
      if (!res.ok) return null;
      
      const data = await res.json();
      const current = data.current;
      const today = data.daily?.[0];
      
      if (!current || !today) return null;

      const temp = Math.round(current.temp);
      const max = Math.round(today.temp.max);
      const min = Math.round(today.temp.min);
      const desc = current.weather?.[0]?.description || 'clima estável';
      const pop = today.pop || 0;

      let body = `${city}: ${temp}°C, ${desc}. Máx ${max}°C, mín ${min}°C.`;
      if (pop > 0.2) body += ` ${Math.round(pop * 100)}% chance de chuva.`;

      return {
        body,
        alerts: data.alerts || []
      };
    };

    // Processa Web Push
    for (const blob of webList.blobs || []) {
      try {
        const data = await webStore.get(blob.key, { type: 'json' });
        if (!data?.enabled || !data?.subscription) continue;

        const weather = await getWeatherPayload(data.city || 'Porto Alegre');
        if (!weather) continue;

        // Envia resumo
        try {
          await webpush.sendNotification(
            data.subscription,
            JSON.stringify({
              title: '🌤️ Bom dia! Resumo do clima',
              body: weather.body,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'morning-summary',
              data: { url: '/', type: 'morning-summary' }
            })
          );
          webSent++;
        } catch (e: any) {
          webFailed++;
          if (e.statusCode === 404 || e.statusCode === 410) {
            await webStore.delete(blob.key);
          }
        }

        // Envia alertas
        for (const alert of weather.alerts.slice(0, 2)) {
          try {
            await webpush.sendNotification(
              data.subscription,
              JSON.stringify({
                title: `⚠️ ${alert.event}`,
                body: alert.description?.substring(0, 100) + '...',
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: `alert-${alert.event}`,
                requireInteraction: true,
                data: { url: '/', type: 'weather-alert' }
              })
            );
            alertsCount++;
          } catch (e) {}
        }
      } catch (e) {
        console.error('[Cron] Erro Web Push:', e);
      }
    }

    // Processa FCM
    for (const blob of fcmList.blobs || []) {
      try {
        const data = await fcmStore.get(blob.key, { type: 'json' });
        if (!data?.enabled || !data?.token) continue;

        const weather = await getWeatherPayload(data.city || 'Porto Alegre');
        if (!weather) continue;

        // Envia resumo
        const result = await sendFCM(data.token, {
          title: '🌤️ Bom dia! Resumo do clima',
          body: weather.body,
          tag: 'morning-summary',
          data: { url: '/', type: 'morning-summary' }
        });

        if (result === true) {
          fcmSent++;
        } else if (result === 'expired') {
          fcmExpired++;
          await fcmStore.delete(blob.key);
        } else {
          fcmFailed++;
        }

        // Envia alertas
        for (const alert of weather.alerts.slice(0, 2)) {
          await sendFCM(data.token, {
            title: `⚠️ ${alert.event}`,
            body: alert.description?.substring(0, 100) + '...',
            tag: `alert-${alert.event}`,
            data: { url: '/', type: 'weather-alert' }
          });
          alertsCount++;
        }
      } catch (e) {
        console.error('[Cron] Erro FCM:', e);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        isTest,
        stats: {
          web: { sent: webSent, failed: webFailed },
          fcm: { sent: fcmSent, failed: fcmFailed, expired: fcmExpired },
          alerts: alertsCount
        }
      }),
    };

  } catch (error: any) {
    console.error('[Cron] Erro geral:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno', details: error.message }),
    };
  }
};

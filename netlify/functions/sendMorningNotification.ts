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

// Geocoding simples - cidades comuns
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
  'guarulhos': { lat: -23.4628, lon: -46.5323 },
  'campinas': { lat: -22.9053, lon: -47.0659 },
  'são luís': { lat: -2.5297, lon: -44.3028 },
  'sao luis': { lat: -2.5297, lon: -44.3028 },
  'maceió': { lat: -9.6659, lon: -35.7350 },
  'maceio': { lat: -9.6659, lon: -35.7350 },
  'campo grande': { lat: -20.4697, lon: -54.6201 },
  'natal': { lat: -5.7945, lon: -35.2110 },
  'teresina': { lat: -5.0892, lon: -42.8019 },
  'joão pessoa': { lat: -7.1153, lon: -34.8610 },
  'joao pessoa': { lat: -7.1153, lon: -34.8610 },
  'florianópolis': { lat: -27.5954, lon: -48.5480 },
  'florianopolis': { lat: -27.5954, lon: -48.5480 },
  'vila velha': { lat: -20.3297, lon: -40.2925 },
};

const getCoordinates = (city: string): { lat: number; lon: number } => {
  const normalized = city.toLowerCase().trim();
  return cityCoordinates[normalized] || { lat: -30.0346, lon: -51.2177 }; // Porto Alegre padrão
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
  const store = createStore('pushSubscriptions');

  try {
    const list = await store.list();
    const subscriptions = list.blobs || [];
    
    let sentCount = 0;
    let failedCount = 0;
    let alertsCount = 0;

    console.log(`[Cron] Processando ${subscriptions.length} subscriptions`);

    for (const blob of subscriptions) {
      try {
        const data = await store.get(blob.key, { type: 'json' });
        
        if (!data || !data.enabled || !data.subscription) {
          continue;
        }

        const city = data.city || 'Porto Alegre';
        const coords = getCoordinates(city);
        
        // Busca dados do clima
        const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${apiKey}`;
        
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
          console.warn(`[Cron] Falha ao buscar clima para ${city}`);
          continue;
        }

        const weather = await weatherRes.json();
        const current = weather.current;
        const today = weather.daily?.[0];
        
        if (!current || !today) continue;

        const temp = Math.round(current.temp);
        const max = Math.round(today.temp.max);
        const min = Math.round(today.temp.min);
        const description = current.weather?.[0]?.description || 'clima estável';
        const pop = today.pop || 0;

        // Monta mensagem do resumo
        let body = `${city}: ${temp}°C, ${description}. Máx ${max}°C, mín ${min}°C.`;
        if (pop > 0.2) {
          body += ` ${Math.round(pop * 100)}% chance de chuva.`;
        }

        // Envia notificação de resumo
        try {
          await webpush.sendNotification(
            data.subscription,
            JSON.stringify({
              title: `🌤️ Bom dia! Resumo do clima`,
              body: body,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'morning-summary',
              requireInteraction: false,
              data: {
                url: '/',
                type: 'morning-summary',
                city: city
              }
            })
          );
          sentCount++;
          console.log(`[Cron] Resumo enviado para ${city}`);
        } catch (pushError: any) {
          console.error(`[Cron] Erro ao enviar resumo:`, pushError.message);
          failedCount++;
          
          // Se subscription expirou, remove
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            await store.delete(blob.key);
            console.log(`[Cron] Subscription expirada removida: ${blob.key}`);
          }
        }

        // Envia alertas governamentais separadamente
        if (weather.alerts && weather.alerts.length > 0) {
          for (const alert of weather.alerts.slice(0, 2)) { // Max 2 alertas
            try {
              await webpush.sendNotification(
                data.subscription,
                JSON.stringify({
                  title: `⚠️ ${alert.event}`,
                  body: alert.description?.substring(0, 100) + '...' || 'Alerta meteorológico',
                  icon: '/favicon.svg',
                  badge: '/favicon.svg',
                  tag: `alert-${alert.event}`,
                  requireInteraction: true,
                  data: {
                    url: '/',
                    type: 'weather-alert',
                    city: city
                  }
                })
              );
              alertsCount++;
              console.log(`[Cron] Alerta enviado: ${alert.event}`);
            } catch (alertError: any) {
              console.error(`[Cron] Erro ao enviar alerta:`, alertError.message);
            }
          }
        }

      } catch (userError: any) {
        console.error(`[Cron] Erro ao processar usuário:`, userError.message);
      }
    }

    const result = {
      success: true,
      isTest,
      stats: {
        total: subscriptions.length,
        sent: sentCount,
        failed: failedCount,
        alerts: alertsCount
      }
    };

    console.log('[Cron] Resultado:', result);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
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

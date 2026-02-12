import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

const createStore = (name: string) => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  
  return getStore(name);
};

// Geocoding simples - cidade para coordenadas (fallback para cidades brasileiras comuns)
const cityCoordinates: Record<string, { lat: number; lon: number }> = {
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
  'porto alegre': { lat: -30.0346, lon: -51.2177 },
  'belém': { lat: -1.4558, lon: -48.4902 },
  'belem': { lat: -1.4558, lon: -48.4902 },
  'goiânia': { lat: -16.6864, lon: -49.2643 },
  'goiania': { lat: -16.6864, lon: -49.2643 },
  'guarulhos': { lat: -23.4628, lon: -46.5323 },
  'campinas': { lat: -22.9053, lon: -47.0659 },
  'são luís': { lat: -2.5297, lon: -44.3028 },
  'sao luis': { lat: -2.5297, lon: -44.3028 },
  'são gonçalo': { lat: -22.8268, lon: -43.0535 },
  'sao goncalo': { lat: -22.8268, lon: -43.0535 },
  'maceió': { lat: -9.6659, lon: -35.7350 },
  'maceio': { lat: -9.6659, lon: -35.7350 },
  'duque de caxias': { lat: -22.7856, lon: -43.3042 },
  'campo grande': { lat: -20.4697, lon: -54.6201 },
  'natal': { lat: -5.7945, lon: -35.2110 },
  'teresina': { lat: -5.0892, lon: -42.8019 },
  'são bernardo do campo': { lat: -23.6939, lon: -46.5650 },
  'sao bernardo do campo': { lat: -23.6939, lon: -46.5650 },
  'nova iguaçu': { lat: -22.7590, lon: -43.4516 },
  'joão pessoa': { lat: -7.1153, lon: -34.8610 },
  'joao pessoa': { lat: -7.1153, lon: -34.8610 },
  'santo andré': { lat: -23.6639, lon: -46.5383 },
  'santo andre': { lat: -23.6639, lon: -46.5383 },
  'osasco': { lat: -23.5329, lon: -46.7915 },
  'jaboatão dos guararapes': { lat: -8.1129, lon: -35.0149 },
  'contagem': { lat: -19.9386, lon: -44.0520 },
  'sorocaba': { lat: -23.5017, lon: -47.4581 },
  'ribeirão preto': { lat: -21.1775, lon: -47.8103 },
  'cuiabá': { lat: -15.6014, lon: -56.0979 },
  'cuiaba': { lat: -15.6014, lon: -56.0979 },
  'florianópolis': { lat: -27.5954, lon: -48.5480 },
  'florianopolis': { lat: -27.5954, lon: -48.5480 },
  'vila velha': { lat: -20.3297, lon: -40.2925 },
};

const getCoordinates = (city: string): { lat: number; lon: number } | null => {
  const normalizedCity = city.toLowerCase().trim();
  return cityCoordinates[normalizedCity] || null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublic || !vapidPrivate) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'VAPID não configurado' }) };
  }
  
  const isBase64Url = (str: string) => /^[A-Za-z0-9_-]+$/.test(str);
  
  if (!isBase64Url(vapidPublic) || vapidPublic.length < 80) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ 
        error: 'VAPID_PUBLIC_KEY inválido', 
        details: 'Deve estar no formato base64url',
      }) 
    };
  }
  
  if (!isBase64Url(vapidPrivate) || vapidPrivate.length < 40) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ 
        error: 'VAPID_PRIVATE_KEY inválido', 
        details: 'Deve estar no formato base64url',
      }) 
    };
  }
  
  try {
    webpush.setVapidDetails('mailto:alerts@meteor.app', vapidPublic, vapidPrivate);
  } catch (err: any) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ error: 'Erro ao configurar VAPID', message: err.message }) 
    };
  }
  
  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'API não configurada' }) };
  
  // Horário fixo: 7h da manhã (Brasília UTC-3)
  // O cron-job.org deve ser configurado para rodar às 7h
  const isTest = event.queryStringParameters?.test === 'true';
  
  const userStore = createStore('userData');
  
  try {
    const list = await userStore.list();
    
    let sent = 0;
    let usersChecked = 0;
    let skippedNoSubscription = 0;
    let alertsFound = 0;
    
    for (const key of list.blobs || []) {
      try {
        const data = await userStore.get(key.key, { type: 'json' });
        // No modo teste, envia para quem tem subscription (independente do toggle)
        // No modo normal, só envia se morningSummary estiver ativo
        if (!isTest && !data?.preferences?.morningSummary) continue;
        
        usersChecked++;
        
        // Busca subscription nos dados do usuário
        const subscription = data.preferences?.pushSubscription;
        if (!subscription) {
          skippedNoSubscription++;
          continue;
        }
        
        // Determina coordenadas - usa cidade configurada ou fallback
        let lat = data.preferences?.lat;
        let lon = data.preferences?.lon;
        let city = data.preferences?.alertCity || data.preferences?.city || 'Sua cidade';
        
        // Se tiver cidade configurada mas não tiver coordenadas, tenta geocoding local
        if (data.preferences?.alertCity && (!lat || !lon)) {
          const coords = getCoordinates(data.preferences.alertCity);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          }
        }
        
        // Fallback para São Paulo se não tiver coordenadas
        if (!lat || !lon) {
          lat = -23.5505;
          lon = -46.6333;
        }
        
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${API_KEY}`;
        const weatherRes = await fetch(url);
        if (!weatherRes.ok) continue;
        
        const weather = await weatherRes.json();
        const current = weather.current;
        const today = weather.daily[0];
        
        const temp = Math.round(current.temp);
        const max = Math.round(today.temp.max);
        const min = Math.round(today.temp.min);
        
        // Verifica alertas governamentais
        let alertMsg = '';
        if (weather.alerts && weather.alerts.length > 0) {
          const alert = weather.alerts[0]; // Pega o primeiro alerta
          alertMsg = ` ⚠️ ${alert.event}`;
          alertsFound++;
        }
        
        let msg = `${city}: ${temp}°C (máx ${max}°C, mín ${min}°C)`;
        if (today.pop > 0.3) msg += ` | ${Math.round(today.pop * 100)}% chuva`;
        if (alertMsg) msg += alertMsg;
        
        // Envia push
        await webpush.sendNotification(subscription, JSON.stringify({
          title: alertMsg ? `⚠️ Alerta Meteorológico - ${city}` : `🌤️ Resumo do Dia - ${city}`,
          body: msg,
          icon: '/favicon.svg',
          url: '/',
          tag: alertMsg ? 'weather-alert' : 'daily-summary',
          requireInteraction: !!alertMsg,
        }));
        
        sent++;
      } catch (e: any) {
        // Log erro individual no modo teste para debug
        if (isTest) {
          console.error(`Erro ao processar usuário ${key.key}:`, e.message);
        }
      }
    }
    
    return { 
      statusCode: 200, 
      headers: cors, 
      body: JSON.stringify({ 
        success: true, 
        sent, 
        alertsFound,
        stats: {
          usersChecked,
          skippedNoSubscription
        }
      }) 
    };
    
  } catch (err: any) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message || 'Erro desconhecido' }) };
  }
};

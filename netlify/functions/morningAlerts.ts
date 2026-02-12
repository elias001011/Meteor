import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

// Helper para criar store com credenciais do ambiente
const createStore = (name: string) => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  
  // Se temos as variáveis de ambiente, usa-as explicitamente
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  
  // Caso contrário, tenta usar o comportamento padrão (funciona no ambiente Netlify)
  return getStore(name);
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublic || !vapidPrivate) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'VAPID não configurado' }) };
  }
  
  // Validação do formato das chaves
  const isBase64Url = (str: string) => /^[A-Za-z0-9_-]+$/.test(str);
  
  if (!isBase64Url(vapidPublic) || vapidPublic.length < 80) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ 
        error: 'VAPID_PUBLIC_KEY inválido', 
        details: 'Deve estar no formato base64url (usar web-push generate-vapid-keys)',
      }) 
    };
  }
  
  if (!isBase64Url(vapidPrivate) || vapidPrivate.length < 40) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ 
        error: 'VAPID_PRIVATE_KEY inválido', 
        details: 'Deve estar no formato base64url (~43 caracteres)',
      }) 
    };
  }
  
  try {
    webpush.setVapidDetails('mailto:alerts@meteor.app', vapidPublic, vapidPrivate);
  } catch (err: any) {
    return { 
      statusCode: 503, 
      headers: cors, 
      body: JSON.stringify({ 
        error: 'Erro ao configurar VAPID', 
        message: err.message,
      }) 
    };
  }
  
  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'API não configurada' }) };
  
  // Hora atual Brasil (UTC-3)
  const now = new Date();
  const brHour = now.getUTCHours() - 3;
  const currentTime = `${String(brHour).padStart(2, '0')}:00`;
  
  // Modo teste: bypass de horário
  const isTest = event.queryStringParameters?.test === 'true';
  const targetTime = isTest ? null : currentTime;
  
  const userStore = createStore('userData');
  
  try {
    const list = await userStore.list();
    
    let sent = 0;
    let usersChecked = 0;
    let skippedNoSubscription = 0;
    let skippedWrongTime = 0;
    
    for (const key of list.blobs || []) {
      try {
        const data = await userStore.get(key.key, { type: 'json' });
        if (!data?.preferences?.morningSummary) continue;
        
        usersChecked++;
        
        // Verifica horário do usuário (bypass no modo teste)
        const userTime = data.preferences.summaryTime || '06:00';
        if (targetTime && userTime !== targetTime) {
          skippedWrongTime++;
          continue;
        }
        
        // Busca subscription nos dados do usuário
        const subscription = data.preferences?.pushSubscription;
        if (!subscription) {
          skippedNoSubscription++;
          continue;
        }
        
        // Pega clima (simplificado)
        const lat = data.preferences?.lat || -23.5;
        const lon = data.preferences?.lon || -46.6;
        const city = data.preferences?.city || 'Sua cidade';
        
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${API_KEY}`;
        const weatherRes = await fetch(url);
        if (!weatherRes.ok) continue;
        
        const weather = await weatherRes.json();
        const current = weather.current;
        const today = weather.daily[0];
        
        const temp = Math.round(current.temp);
        const max = Math.round(today.temp.max);
        const min = Math.round(today.temp.min);
        
        let msg = `🌤️ ${city}: ${temp}°C. Máx ${max}°C, mín ${min}°C.`;
        if (today.pop > 0.3) msg += ` 🌧️ ${Math.round(today.pop * 100)}% chuva.`;
        
        // Envia push
        await webpush.sendNotification(subscription, JSON.stringify({
          title: `🌤️ Resumo do Dia - ${city}`,
          body: msg,
          icon: '/favicon.svg',
          url: '/',
          tag: 'daily-summary',
          requireInteraction: false,
        }));
        
        sent++;
      } catch (e) {
        // Silencia erros individuais
      }
    }
    
    return { 
      statusCode: 200, 
      headers: cors, 
      body: JSON.stringify({ 
        success: true, 
        sent, 
        time: currentTime,
        stats: {
          usersChecked,
          skippedWrongTime,
          skippedNoSubscription
        }
      }) 
    };
    
  } catch (err: any) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message || 'Erro desconhecido' }) };
  }
};

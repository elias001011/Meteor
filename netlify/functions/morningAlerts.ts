import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublic || !vapidPrivate) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'VAPID não configurado' }) };
  }
  
  webpush.setVapidDetails('mailto:alerts@meteor.app', vapidPublic, vapidPrivate);
  
  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'API não configurada' }) };
  
  // Hora atual Brasil
  const hour = String(new Date().getUTCHours() - 3).padStart(2, '0');
  const currentTime = `${hour}:00`;
  
  try {
    const userStore = getStore('userData');
    const pushStore = getStore('pushSubscriptions');
    const list = await userStore.list();
    
    let sent = 0;
    
    for (const key of list.blobs || []) {
      try {
        const data = await userStore.get(key.key, { type: 'json' });
        if (!data?.preferences?.morningSummary) continue;
        if (data.preferences.summaryTime !== currentTime) continue;
        
        // Busca subscription
        const subData = await pushStore.get(key.key, { type: 'json' });
        if (!subData?.subscription) continue;
        
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
        await webpush.sendNotification(subData.subscription, JSON.stringify({
          title: `🌤️ Resumo do Dia - ${city}`,
          body: msg,
          icon: '/favicon.svg',
          url: '/',
          tag: 'daily-summary',
          requireInteraction: false,
        }));
        
        sent++;
      } catch (e) {}
    }
    
    return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true, sent, time: currentTime }) };
    
  } catch (err: any) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message || 'Erro desconhecido' }) };
  }
};

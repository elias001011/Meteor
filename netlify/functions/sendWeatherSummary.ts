
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

interface UserPreferences {
  email: string;
  city: string;
  lat: number;
  lon: number;
  morningSummary: boolean;
  summaryTime: string; // "08:00"
  pushAlerts: boolean;
  lastSummarySent?: string;
}

// Cache de chamadas API (evita bater na API várias vezes no mesmo horário)
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

async function getWeatherData(lat: number, lon: number) {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Usando cache do clima para:', cacheKey);
    return cached.data;
  }

  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) {
    throw new Error('API key não configurada');
  }

  // Usa One Call 3.0 (só quando necessário e com cache)
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }
  
  const data = await response.json();
  weatherCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

function generateSummary(weather: any): string {
  const current = weather.current;
  const daily = weather.daily[0];
  const alerts = weather.alerts || [];
  
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feels_like);
  const condition = current.weather[0].description;
  const max = Math.round(daily.temp.max);
  const min = Math.round(daily.temp.min);
  const rainProb = Math.round(daily.pop * 100);
  
  let summary = `🌤️ ${temp}°C (sensação ${feelsLike}°C), ${condition}. `;
  summary += `Máx: ${max}°C, Mín: ${min}°C. `;
  
  if (rainProb > 30) {
    summary += `🌧️ ${rainProb}% chance de chuva. `;
  }
  
  // Alertas governamentais da One Call
  if (alerts.length > 0) {
    const alert = alerts[0];
    summary += `⚠️ ${alert.event}: ${alert.description.substring(0, 100)}...`;
  }
  
  return summary;
}

// Handler principal - chamado pelo cron job UMA VEZ por hora
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Configura VAPID
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'VAPID não configurado' }),
    };
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:alerts@meteor.app',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    // Pega hora atual (UTC-3 para Brasil)
    const now = new Date();
    const brazilHour = now.getUTCHours() - 3;
    const currentTime = `${String(brazilHour).padStart(2, '0')}:00`;
    
    console.log('Verificando resumos para o horário:', currentTime);

    // Busca preferências de usuários
    const userStore = getStore('userData');
    const pushStore = getStore('pushSubscriptions');
    
    // Lista simplificada - em produção teria uma collection separada para preferências
    const users: UserPreferences[] = [];
    
    try {
      const list = await userStore.list();
      for (const key of list.blobs || []) {
        const userData = await userStore.get(key.key, { type: 'json' });
        if (userData?.preferences?.morningSummary && 
            userData?.preferences?.summaryTime === currentTime) {
          users.push({
            email: userData.email,
            city: userData.preferences.city,
            lat: userData.preferences.lat,
            lon: userData.preferences.lon,
            morningSummary: true,
            summaryTime: userData.preferences.summaryTime,
            pushAlerts: userData.preferences.pushAlerts,
            lastSummarySent: userData.lastSummarySent,
          });
        }
      }
    } catch (e) {
      console.log('Erro ao listar usuários:', e);
    }

    if (users.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Nenhum usuário para este horário' }),
      };
    }

    // Agrupa usuários por localização para reaproveitar chamadas API
    const locationGroups = new Map<string, UserPreferences[]>();
    for (const user of users) {
      const key = `${user.lat.toFixed(1)},${user.lon.toFixed(1)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(user);
    }

    let notificationsSent = 0;

    // Processa cada localização (UMA chamada API por localização)
    for (const [locationKey, locationUsers] of locationGroups) {
      try {
        const user = locationUsers[0];
        const weather = await getWeatherData(user.lat, user.lon);
        const summary = generateSummary(weather);
        
        // Verifica se há alertas críticos
        const hasCriticalAlert = weather.alerts?.some((a: any) => 
          a.event?.toLowerCase().includes('tempestade') ||
          a.event?.toLowerCase().includes('vento') ||
          a.event?.toLowerCase().includes('chuva forte')
        );
        
        // Envia para todos os usuários desta localização
        for (const u of locationUsers) {
          // Email (se configurado)
          if (u.email && process.env.RESEND_API) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.RESEND_API}`,
                },
                body: JSON.stringify({
                  from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                  to: u.email,
                  subject: `🌤️ Resumo do Clima - ${u.city}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
                      <h2 style="color: #e94560;">☄️ Resumo do Clima - ${u.city}</h2>
                      <p style="font-size: 16px;">${summary}</p>
                      <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        Resumo diário enviado às ${u.summaryTime}.<br>
                        Para alterar, acesse o app Meteor.
                      </p>
                    </div>
                  `,
                }),
              });
            } catch (e) {
              console.error('Erro ao enviar email:', e);
            }
          }
          
          // Push notification
          if (u.pushAlerts) {
            try {
              const subData = await pushStore.get(u.email, { type: 'json' });
              if (subData?.subscription) {
                await webpush.sendNotification(subData.subscription, JSON.stringify({
                  title: `🌤️ Resumo do Clima - ${u.city}`,
                  body: summary.substring(0, 100) + '...',
                  icon: '/favicon.svg',
                  badge: '/favicon.svg',
                  url: '/',
                  tag: 'daily-summary',
                  requireInteraction: hasCriticalAlert,
                }));
                notificationsSent++;
              }
            } catch (e) {
              console.error('Erro ao enviar push:', e);
            }
          }
        }
        
        // Delay entre chamadas para não sobrecarregar
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (error) {
        console.error(`Erro ao processar ${locationKey}:`, error);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        hour: currentTime,
        usersFound: users.length,
        locations: locationGroups.size,
        notificationsSent,
        message: 'Resumos processados com sucesso',
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

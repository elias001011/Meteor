
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

interface UserConfig {
  userId: string;
  email?: string;
  city: string;
  lat: number;
  lon: number;
  
  // Preferências
  wantsPushAlerts: boolean;
  wantsEmailAlerts: boolean;
  wantsMorningSummary: boolean;
  summaryTime: string; // "06:00", "08:00", etc
  
  pushSubscription?: any;
  emailAlertAddress?: string;
}

// Cache durante execução
const weatherCache = new Map<string, { data: any; timestamp: number }>();

async function getWeatherOneCall(lat: number, lon: number, apiKey: string) {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.data;
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  
  const data = await response.json();
  weatherCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

function hasCriticalAlerts(weather: any): boolean {
  const alerts = weather.alerts || [];
  return alerts.some((alert: any) => {
    const event = alert.event?.toLowerCase() || '';
    return event.includes('tempestade') || 
           event.includes('trovoada') || 
           event.includes('vento') || 
           event.includes('chuva forte') ||
           event.includes('granizo');
  });
}

function formatAlertMessage(alert: any): string {
  return `${alert.event}: ${alert.description?.substring(0, 100) || 'Alerta meteorológico'}...`;
}

function formatSummary(weather: any, city: string): string {
  const current = weather.current;
  const today = weather.daily[0];
  const temp = Math.round(current.temp);
  const max = Math.round(today.temp.max);
  const min = Math.round(today.temp.min);
  const rainProb = Math.round(today.pop * 100);
  const condition = current.weather[0]?.description || 'condição estável';
  const uvi = today.uvi || 0;
  
  let msg = `🌤️ ${city}: ${temp}°C, ${condition}. Máx ${max}°C, mín ${min}°C.`;
  
  if (rainProb > 40) msg += ` 🌧️ ${rainProb}% chuva.`;
  if (uvi >= 8) msg += ` ☀️ UV ${uvi} (alto).`;
  
  return msg;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Configura VAPID
  const vapidKeys = {
    public: process.env.VAPID_PUBLIC_KEY,
    private: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:alerts@meteor.app'
  };
  
  if (!vapidKeys.public || !vapidKeys.private) {
    return { statusCode: 503, headers: corsHeaders, body: JSON.stringify({ error: 'VAPID não configurado' }) };
  }
  
  webpush.setVapidDetails(vapidKeys.subject, vapidKeys.public, vapidKeys.private);

  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) {
    return { statusCode: 503, headers: corsHeaders, body: JSON.stringify({ error: 'CLIMA_API não configurada' }) };
  }

  // Pega hora atual para comparar com preferências dos usuários
  const now = new Date();
  const brazilHour = String(now.getUTCHours() - 3).padStart(2, '0');
  const brazilMinute = String(now.getUTCMinutes()).padStart(2, '0');
  const currentTime = `${brazilHour}:${brazilMinute}`;
  
  console.log(`[${currentTime}] Verificando usuários para envio diário...`);

  try {
    const userDataStore = getStore('userData');
    const pushStore = getStore('pushSubscriptions');
    
    const users: UserConfig[] = [];
    
    // Busca usuários ativos
    try {
      const list = await userDataStore.list();
      for (const key of list.blobs || []) {
        const data = await userDataStore.get(key.key, { type: 'json' });
        if (!data) continue;
        
        const hasPushAlert = data.preferences?.pushAlerts === true;
        const hasEmailAlert = data.preferences?.emailAlertsEnabled === true;
        const hasMorningSummary = data.preferences?.morningSummary === true;
        const summaryTime = data.preferences?.summaryTime || '06:00';
        
        // Só inclui se tem alguma configuração ATIVA
        if (hasPushAlert || hasEmailAlert || hasMorningSummary) {
          let pushSub = null;
          if (hasPushAlert) {
            const subData = await pushStore.get(key.key, { type: 'json' });
            pushSub = subData?.subscription;
          }
          
          users.push({
            userId: key.key,
            email: data.email,
            city: data.preferences?.city || 'Sua cidade',
            lat: data.preferences?.lat || -23.5,
            lon: data.preferences?.lon || -46.6,
            wantsPushAlerts: hasPushAlert && !!pushSub,
            wantsEmailAlerts: hasEmailAlert,
            wantsMorningSummary: hasMorningSummary,
            summaryTime,
            pushSubscription: pushSub,
            emailAlertAddress: data.preferences?.emailAlertAddress,
          });
        }
      }
    } catch (e) {
      console.error('Erro ao listar usuários:', e);
    }

    if (users.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Nenhum usuário com configurações ativas', time: currentTime }),
      };
    }

    console.log(`Processando ${users.length} usuários`);

    // Agrupa por localização
    const locationGroups = new Map<string, UserConfig[]>();
    for (const user of users) {
      const key = `${user.lat.toFixed(2)},${user.lon.toFixed(2)}`;
      if (!locationGroups.has(key)) locationGroups.set(key, []);
      locationGroups.get(key)!.push(user);
    }

    let stats = { apiCalls: 0, pushSent: 0, emailsSent: 0, alertsFound: 0 };

    // Processa cada localização
    for (const [locationKey, locationUsers] of locationGroups) {
      try {
        const sampleUser = locationUsers[0];
        const weather = await getWeatherOneCall(sampleUser.lat, sampleUser.lon, API_KEY);
        stats.apiCalls++;
        
        const hasAlerts = hasCriticalAlerts(weather);
        const alerts = weather.alerts || [];
        
        if (hasAlerts) {
          stats.alertsFound += alerts.length;
          console.log(`🚨 Alertas em ${sampleUser.city}:`, alerts.map((a: any) => a.event));
        }

        // Processa cada usuário
        for (const user of locationUsers) {
          const isSummaryTime = user.summaryTime === currentTime;
          
          // A) ALERTAS GOVERNAMENTAIS (sempre envia se houver)
          if (hasAlerts && (user.wantsPushAlerts || user.wantsEmailAlerts)) {
            const alert = alerts[0];
            const message = formatAlertMessage(alert);
            
            // Push
            if (user.wantsPushAlerts && user.pushSubscription) {
              try {
                await webpush.sendNotification(user.pushSubscription, JSON.stringify({
                  title: `🚨 ${alert.event}`,
                  body: message,
                  icon: '/favicon.svg',
                  url: '/',
                  tag: `alert-${Date.now()}`,
                  requireInteraction: true,
                }));
                stats.pushSent++;
              } catch (e: any) {
                if (e.statusCode === 404 || e.statusCode === 410) {
                  await pushStore.delete(user.userId);
                }
              }
            }
            
            // Email
            if (user.wantsEmailAlerts && user.emailAlertAddress && process.env.RESEND_API) {
              try {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API}`,
                  },
                  body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: user.emailAlertAddress,
                    subject: `🚨 Alerta - ${user.city}`,
                    html: `
                      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #e94560;">⚠️ ${alert.event}</h2>
                        <p>${alert.description}</p>
                        <p style="color: #888;">Local: ${user.city}</p>
                      </div>
                    `,
                  }),
                });
                stats.emailsSent++;
              } catch (e) {}
            }
          }
          
          // B) RESUMO MATINAL (só no horário configurado)
          if (user.wantsMorningSummary && isSummaryTime) {
            const summary = formatSummary(weather, user.city);
            
            // Push de resumo
            if (user.pushSubscription) {
              try {
                await webpush.sendNotification(user.pushSubscription, JSON.stringify({
                  title: `🌤️ ${user.city} - Resumo do Dia`,
                  body: summary,
                  icon: '/favicon.svg',
                  url: '/',
                  tag: 'daily-summary',
                  requireInteraction: false,
                }));
              } catch (e) {}
            }
            
            // Email de resumo
            if (user.emailAlertAddress && process.env.RESEND_API) {
              try {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API}`,
                  },
                  body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: user.emailAlertAddress,
                    subject: `🌤️ Resumo - ${user.city}`,
                    html: `
                      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #e94560;">☄️ Resumo do Dia</h2>
                        <p style="font-size: 18px;">${summary}</p>
                        ${hasAlerts ? '<p style="color: #ff6b6b;">⚠️ Há alertas ativos para sua região.</p>' : ''}
                      </div>
                    `,
                  }),
                });
              } catch (e) {}
            }
          }
        }
        
        await new Promise(r => setTimeout(r, 500)); // Delay entre cidades
        
      } catch (error) {
        console.error(`Erro em ${locationKey}:`, error);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        time: currentTime,
        stats: { ...stats, usersProcessed: users.length, locations: locationGroups.size },
      }),
    };

  } catch (error: any) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};

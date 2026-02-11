
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
  wantsPushAlerts: boolean;      // Alertas governamentais via push
  wantsEmailAlerts: boolean;     // Alertas governamentais via email
  wantsMorningSummary: boolean;  // Resumo matinal
  summaryTime: string;           // "08:00"
  
  // Dados de contato
  pushSubscription?: any;
  emailAlertAddress?: string;
}

// Cache em memória (dura durante a execução da função)
const weatherCache = new Map<string, { data: any; timestamp: number }>();

async function getWeatherOneCall(lat: number, lon: number, apiKey: string) {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  
  // Cache de 10 minutos (suficiente para uma execução)
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.data;
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely,hourly&appid=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
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
           event.includes('granizo') ||
           event.includes('tornado');
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
  
  let msg = `🌤️ ${city}: ${temp}°C, ${condition}. Máx ${max}°C, mín ${min}°C.`;
  
  if (rainProb > 40) {
    msg += ` 🌧️ ${rainProb}% chuva.`;
  }
  
  return msg;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Verifica horário (formato: "08:00")
  const now = new Date();
  const brazilHour = String(now.getUTCHours() - 3).padStart(2, '0');
  const currentTime = `${brazilHour}:00`;
  
  console.log(`[${currentTime}] Iniciando verificação de alertas...`);

  // Configura VAPID
  const vapidKeys = {
    public: process.env.VAPID_PUBLIC_KEY,
    private: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:alerts@meteor.app'
  };
  
  if (!vapidKeys.public || !vapidKeys.private) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'VAPID não configurado' }),
    };
  }
  
  webpush.setVapidDetails(vapidKeys.subject, vapidKeys.public, vapidKeys.private);

  const API_KEY = process.env.CLIMA_API;
  if (!API_KEY) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'CLIMA_API não configurada' }),
    };
  }

  try {
    // 1. Busca TODOS os usuários com configurações ativas
    const userDataStore = getStore('userData');
    const pushStore = getStore('pushSubscriptions');
    
    const users: UserConfig[] = [];
    
    try {
      const list = await userDataStore.list();
      for (const key of list.blobs || []) {
        const data = await userDataStore.get(key.key, { type: 'json' });
        if (!data) continue;
        
        const hasPushAlert = data.preferences?.pushAlerts === true;
        const hasEmailAlert = data.preferences?.emailAlertsEnabled === true;
        const hasMorningSummary = data.preferences?.morningSummary === true;
        const summaryTime = data.preferences?.summaryTime || '08:00';
        
        // Só inclui se tem ALGUMA configuração ativa E é o horário do resumo (se aplicável)
        const isSummaryTime = summaryTime === currentTime;
        
        if ((hasPushAlert || hasEmailAlert) || (hasMorningSummary && isSummaryTime)) {
          // Busca subscription de push
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
            wantsMorningSummary: hasMorningSummary && isSummaryTime,
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
        body: JSON.stringify({ 
          message: 'Nenhum usuário com configurações ativas para este horário',
          time: currentTime 
        }),
      };
    }

    console.log(`Encontrados ${users.length} usuários para processar`);

    // 2. Agrupa por localização (economiza chamadas API)
    const locationGroups = new Map<string, UserConfig[]>();
    for (const user of users) {
      const key = `${user.lat.toFixed(2)},${user.lon.toFixed(2)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(user);
    }

    console.log(`Agrupados em ${locationGroups.size} localizações únicas`);

    let stats = {
      apiCalls: 0,
      pushSent: 0,
      pushFailed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      alertsFound: 0,
      summariesSent: 0,
    };

    // 3. Processa cada localização (UMA chamada API por local)
    for (const [locationKey, locationUsers] of locationGroups) {
      try {
        const sampleUser = locationUsers[0];
        const weather = await getWeatherOneCall(sampleUser.lat, sampleUser.lon, API_KEY);
        stats.apiCalls++;
        
        const hasAlerts = hasCriticalAlerts(weather);
        const alerts = weather.alerts || [];
        
        if (hasAlerts) {
          stats.alertsFound += alerts.length;
          console.log(`🚨 Alertas encontrados em ${sampleUser.city}:`, alerts.map((a: any) => a.event));
        }

        // 4. Processa cada usuário desta localização
        for (const user of locationUsers) {
          // A) ENVIA ALERTAS GOVERNAMENTAIS (se houver e usuário quer)
          if (hasAlerts && (user.wantsPushAlerts || user.wantsEmailAlerts)) {
            const alert = alerts[0]; // Pega o primeiro/mais crítico
            const message = formatAlertMessage(alert);
            
            // Push
            if (user.wantsPushAlerts && user.pushSubscription) {
              try {
                await webpush.sendNotification(user.pushSubscription, JSON.stringify({
                  title: `🚨 ${alert.event}`,
                  body: message,
                  icon: '/favicon.svg',
                  badge: '/favicon.svg',
                  url: '/',
                  tag: `alert-${alert.sender_name || 'gov'}`,
                  requireInteraction: true,
                }));
                stats.pushSent++;
              } catch (e: any) {
                stats.pushFailed++;
                if (e.statusCode === 404 || e.statusCode === 410) {
                  await pushStore.delete(user.userId); // Remove subscription expirada
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
                    subject: `🚨 Alerta Meteorológico - ${user.city}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #e94560;">⚠️ ${alert.event}</h2>
                        <p style="font-size: 16px; line-height: 1.6;">${alert.description}</p>
                        <p style="color: #888; margin-top: 20px;">Local: ${user.city}<br>Fonte: ${alert.sender_name || 'Defesa Civil'}</p>
                      </div>
                    `,
                  }),
                });
                stats.emailsSent++;
              } catch (e) {
                stats.emailsFailed++;
              }
            }
          }
          
          // B) ENVIA RESUMO MATINAL (se usuário quer e é horário)
          if (user.wantsMorningSummary) {
            const summary = formatSummary(weather, user.city);
            
            // Push de resumo
            if (user.pushSubscription) {
              try {
                await webpush.sendNotification(user.pushSubscription, JSON.stringify({
                  title: `🌤️ Resumo do Clima - ${user.city}`,
                  body: summary,
                  icon: '/favicon.svg',
                  badge: '/favicon.svg',
                  url: '/',
                  tag: 'daily-summary',
                  requireInteraction: false,
                }));
                stats.summariesSent++;
              } catch (e) {
                // Silencioso - resumo é menos crítico
              }
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
                    subject: `🌤️ Resumo do Clima - ${user.city}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #e94560;">☄️ Resumo do Clima</h2>
                        <p style="font-size: 18px; margin: 20px 0;">${summary}</p>
                        ${hasAlerts ? `<p style="color: #ff6b6b;">⚠️ Há alertas ativos para sua região. Abra o app para detalhes.</p>` : ''}
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">Resumo diário enviado às ${currentTime}.</p>
                      </div>
                    `,
                  }),
                });
              } catch (e) {
                // Silencioso
              }
            }
          }
        }
        
        // Delay entre chamadas de API para não sobrecarregar
        await new Promise(r => setTimeout(r, 500));
        
      } catch (error) {
        console.error(`Erro ao processar ${locationKey}:`, error);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        time: currentTime,
        stats: {
          ...stats,
          usersProcessed: users.length,
          locations: locationGroups.size,
        },
      }),
    };

  } catch (error: any) {
    console.error('Erro geral:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

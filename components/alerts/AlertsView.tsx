import React, { useMemo } from 'react';
import type { DailyForecast, WeatherAlert, WeatherData } from '../../types';
import { AlertTriangleIcon, InfoIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AlertsViewProps {
  currentWeather?: WeatherData | null;
  dailyForecast?: DailyForecast[];
  apiAlerts?: WeatherAlert[];
}

type Level = 'critical' | 'warning' | 'caution';

interface DisplayAlert {
  id: string;
  level: Level;
  title: string;
  message: string;
  expiresAt?: number;
  source: string;
}

const localAlerts = (weather?: WeatherData | null, daily: DailyForecast[] = []): DisplayAlert[] => {
  if (!weather) return [];
  const result: DisplayAlert[] = [];
  const condition = (weather.condition || '').toLocaleLowerCase('pt-BR');
  const feels = weather.feels_like ?? weather.temperature;
  const uv = Math.max(weather.uvi || 0, daily[0]?.uvi || 0);
  const gust = Math.max(weather.windSpeed || 0, weather.wind_gust || 0, daily[0]?.wind_gust || 0);

  if (/(tempest|trovo|thunder|raio)/.test(condition)) {
    result.push({ id: 'storm', level: 'critical', title: 'Tempestade em andamento', message: 'Procure um local fechado, evite áreas abertas e acompanhe as orientações das autoridades locais.', source: 'Análise das condições atuais' });
  } else if (/(chuva forte|chuva intensa|heavy rain)/.test(condition) || (weather.rain_1h || 0) >= 7) {
    result.push({ id: 'rain', level: 'warning', title: 'Chuva intensa', message: 'Há risco de baixa visibilidade e acúmulo de água. Não atravesse áreas alagadas.', source: 'Análise das condições atuais' });
  }
  if (feels >= 38) result.push({ id: 'heat', level: 'warning', title: 'Calor intenso', message: `A sensação térmica está em ${Math.round(feels)}°. Reduza exposição prolongada, busque sombra e mantenha água por perto.`, source: 'Análise das condições atuais' });
  if (feels <= 3) result.push({ id: 'cold', level: 'warning', title: 'Frio intenso', message: `A sensação térmica está em ${Math.round(feels)}°. Use roupas adequadas e limite exposição prolongada.`, source: 'Análise das condições atuais' });
  if (uv >= 11) result.push({ id: 'uv', level: 'critical', title: 'Índice UV extremo', message: 'Evite exposição direta nos horários de pico e use proteção adequada ao sair.', source: 'Análise da previsão' });
  else if (uv >= 8) result.push({ id: 'uv', level: 'caution', title: 'Índice UV muito alto', message: 'Sombra e proteção solar são especialmente importantes nos horários de maior radiação.', source: 'Análise da previsão' });
  if (gust >= 60) result.push({ id: 'wind', level: 'critical', title: 'Rajadas muito fortes', message: `Rajadas podem chegar a ${Math.round(gust)} km/h. Evite árvores, estruturas frágeis e objetos soltos.`, source: 'Análise da previsão' });
  else if (gust >= 40) result.push({ id: 'wind', level: 'caution', title: 'Vento forte', message: `Rajadas podem chegar a ${Math.round(gust)} km/h. Proteja objetos leves em áreas externas.`, source: 'Análise da previsão' });
  if (typeof weather.visibility === 'number' && weather.visibility < 2000) result.push({ id: 'visibility', level: 'warning', title: 'Visibilidade muito reduzida', message: `Alcance estimado de ${(weather.visibility / 1000).toFixed(1)} km. Redobre a atenção em deslocamentos.`, source: 'Análise das condições atuais' });
  return result;
};

const styles: Record<Level, { surface: string; icon: string; badge: string; label: string }> = {
  critical: { surface: 'border-red-400/25 bg-red-400/[0.07]', icon: 'text-red-300 bg-red-400/10', badge: 'bg-red-400/15 text-red-200', label: 'Urgente' },
  warning: { surface: 'border-orange-300/20 bg-orange-300/[0.06]', icon: 'text-orange-200 bg-orange-300/10', badge: 'bg-orange-300/15 text-orange-100', label: 'Alerta' },
  caution: { surface: 'border-amber-200/15 bg-amber-200/[0.05]', icon: 'text-amber-200 bg-amber-200/10', badge: 'bg-amber-200/15 text-amber-100', label: 'Atenção' },
};

const AlertsView: React.FC<AlertsViewProps> = ({ currentWeather, dailyForecast = [], apiAlerts = [] }) => {
  const { cardClass } = useTheme();
  const alerts = useMemo<DisplayAlert[]>(() => {
    const official = apiAlerts.map((alert, index) => ({
      id: `official-${index}`, level: 'critical' as Level, title: alert.event || 'Aviso meteorológico oficial',
      message: alert.description, expiresAt: alert.end ? alert.end * 1000 : undefined,
      source: alert.sender_name ? `Aviso oficial · ${alert.sender_name}` : 'Aviso oficial'
    }));
    return [...official, ...localAlerts(currentWeather, dailyForecast)];
  }, [currentWeather, dailyForecast, apiAlerts]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex items-start gap-4">
        <div className="rounded-2xl bg-red-400/10 p-3 text-red-300"><AlertTriangleIcon className="h-6 w-6" /></div>
        <div>
          <p className="meteor-eyebrow mb-1">Condições que merecem atenção</p>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-white">Alertas meteorológicos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Avisos oficiais aparecem primeiro. As demais sinalizações são geradas localmente a partir dos dados meteorológicos disponíveis.</p>
        </div>
      </header>

      {alerts.length ? (
        <div className="space-y-3">
          {alerts.map(alert => {
            const style = styles[alert.level];
            return (
              <article key={alert.id} className={`rounded-[1.5rem] border p-4 sm:p-5 ${style.surface}`}>
                <div className="flex items-start gap-3.5">
                  <div className={`rounded-xl p-2.5 ${style.icon}`}><AlertTriangleIcon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-white">{alert.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${style.badge}`}>{style.label}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{alert.message}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                      <span>{alert.source}</span>
                      {alert.expiresAt && <span>Válido até {new Date(alert.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className={`rounded-[2rem] p-8 text-center sm:p-12 ${cardClass}`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><InfoIcon className="h-7 w-7" /></div>
          <h3 className="text-xl font-extrabold text-white">Nenhum alerta ativo</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">Os dados atuais não indicam condições relevantes para esta localidade. Continue acompanhando se o tempo mudar.</p>
        </section>
      )}

      <p className="text-center text-[11px] leading-relaxed text-slate-600">Em uma emergência, siga os canais oficiais da sua região. Esta tela não substitui avisos da Defesa Civil.</p>
    </div>
  );
};

export default AlertsView;

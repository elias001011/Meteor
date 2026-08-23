import React, { useMemo } from 'react';
import type { AirQualityData, DailyForecast, HourlyForecast, WeatherAlert, WeatherData } from '../../types';
import { getSettings } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';

interface WeatherInsightsProps {
  current: WeatherData;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  airQuality?: AirQualityData | null;
  alerts?: WeatherAlert[];
}

type InsightSeverity = 'critical' | 'attention' | 'info' | 'good';

interface Insight {
  id: string;
  priority: number;
  severity: InsightSeverity;
  title: string;
  detail: string;
}

const severityDots: Record<InsightSeverity, string> = {
  critical: 'bg-red-400',
  attention: 'bg-amber-300',
  info: 'bg-sky-300',
  good: 'bg-emerald-300',
};

const hasWords = (value: string, words: string[]) => words.some(word => value.includes(word));

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily, airQuality, alerts = [] }) => {
  const { cardClass } = useTheme();
  const settings = getSettings();
  const config = settings.weatherInsights;

  const insights = useMemo(() => {
    const result: Insight[] = [];
    const now = Math.floor(Date.now() / 1000);
    const condition = (current.condition || '').toLocaleLowerCase('pt-BR');
    const feelsLike = current.feels_like ?? current.temperature;
    const nextSixHours = hourly.slice(0, 6);
    const nextThreeHours = nextSixHours.slice(0, 3);
    const activeOfficialAlert = alerts
      .filter(alert => (!alert.start || alert.start <= now) && (!alert.end || alert.end >= now))
      .sort((a, b) => a.end - b.end)[0];

    if (activeOfficialAlert) {
      result.push({
        id: 'official-alert', priority: 0, severity: 'critical', title: activeOfficialAlert.event || 'Alerta meteorológico oficial',
        detail: `Há um aviso emitido por ${activeOfficialAlert.sender_name || 'uma fonte oficial'}. Consulte a seção Alertas e siga as orientações da autoridade responsável.`
      });
    }

    const storming = hasWords(condition, ['tempest', 'trovo', 'thunder', 'raio']);
    const raining = hasWords(condition, ['chuv', 'rain', 'drizzle', 'garoa', 'aguaceiro']);
    const peakRainChance = Math.max(0, ...nextThreeHours.map(item => item.pop || 0));
    const rainSoonIndex = nextThreeHours.findIndex(item => (item.pop || 0) >= 0.55);
    if (storming) {
      result.push({ id: 'storm', priority: 1, severity: 'critical', title: 'Tempestade em andamento', detail: 'Prefira um local fechado, mantenha distância de áreas abertas e acompanhe os avisos oficiais.' });
    } else if (raining && ((current.rain_1h || 0) >= 7 || current.visibility && current.visibility < 3000)) {
      result.push({ id: 'heavy-rain', priority: 2, severity: 'attention', title: 'Chuva com impacto na mobilidade', detail: 'A visibilidade ou o volume de chuva podem dificultar o trajeto. Evite áreas alagadas e reserve mais tempo para se deslocar.' });
    } else if (raining) {
      result.push({ id: 'rain-now', priority: 3, severity: 'info', title: 'Chuva agora', detail: 'Leve proteção e considere superfícies molhadas no seu deslocamento.' });
    } else if (rainSoonIndex >= 0) {
      const minutes = rainSoonIndex * 60;
      result.push({ id: 'rain-soon', priority: 3, severity: peakRainChance >= 0.8 ? 'attention' : 'info', title: minutes === 0 ? 'Chuva pode começar em breve' : `Chuva possível em até ${minutes + 60} min`, detail: `A maior probabilidade nas próximas horas é de ${Math.round(peakRainChance * 100)}%. Planeje atividades externas com uma alternativa coberta.` });
    }

    if (feelsLike >= 38) {
      result.push({ id: 'heat', priority: 2, severity: 'critical', title: `Sensação térmica de ${Math.round(feelsLike)}°`, detail: 'Reduza exposição prolongada ao calor, procure sombra e mantenha água por perto.' });
    } else if (feelsLike >= 32) {
      result.push({ id: 'heat', priority: 4, severity: 'attention', title: 'Calor exige planejamento', detail: `A sensação chega a ${Math.round(feelsLike)}°. Prefira horários mais amenos para atividades intensas.` });
    } else if (feelsLike <= 3) {
      result.push({ id: 'cold', priority: 2, severity: 'critical', title: `Sensação térmica de ${Math.round(feelsLike)}°`, detail: 'Limite exposição prolongada e use roupas adequadas às condições.' });
    } else if (feelsLike <= 9) {
      result.push({ id: 'cold', priority: 4, severity: 'attention', title: 'Sensação de frio', detail: `A sensação está em ${Math.round(feelsLike)}°. Considere uma camada extra de roupa ao sair.` });
    }

    const uv = Math.max(current.uvi || 0, daily[0]?.uvi || 0, ...nextSixHours.map(item => item.uvi || 0));
    if (uv >= 11) {
      result.push({ id: 'uv', priority: 2, severity: 'critical', title: `Índice UV extremo (${Math.round(uv)})`, detail: 'Evite exposição direta nos horários de pico e adote proteção adequada ao sair.' });
    } else if (uv >= 6) {
      result.push({ id: 'uv', priority: 5, severity: 'attention', title: `Índice UV ${uv >= 8 ? 'muito alto' : 'alto'}`, detail: 'Sombra e proteção solar são especialmente importantes nos horários de maior radiação.' });
    }

    const wind = Math.max(current.windSpeed || 0, current.wind_gust || 0, ...nextSixHours.map(item => Math.max(item.wind_speed || 0, item.wind_gust || 0)));
    if (wind >= 60) {
      result.push({ id: 'wind', priority: 2, severity: 'critical', title: `Rajadas próximas de ${Math.round(wind)} km/h`, detail: 'Evite estruturas frágeis, árvores e objetos soltos. Acompanhe alertas da defesa civil.' });
    } else if (wind >= 40) {
      result.push({ id: 'wind', priority: 5, severity: 'attention', title: 'Vento forte', detail: `Rajadas podem chegar a ${Math.round(wind)} km/h. Proteja objetos leves em áreas externas.` });
    }

    if (typeof current.visibility === 'number' && current.visibility < 2000) {
      result.push({ id: 'visibility', priority: 3, severity: 'attention', title: 'Visibilidade muito reduzida', detail: `Alcance estimado de ${(current.visibility / 1000).toFixed(1)} km. Redobre a atenção em deslocamentos.` });
    } else if (typeof current.visibility === 'number' && current.visibility < 5000) {
      result.push({ id: 'visibility', priority: 6, severity: 'info', title: 'Visibilidade reduzida', detail: `Alcance estimado de ${(current.visibility / 1000).toFixed(1)} km.` });
    }

    if (airQuality?.aqi && airQuality.aqi >= 4) {
      result.push({ id: 'air', priority: 3, severity: airQuality.aqi >= 5 ? 'critical' : 'attention', title: 'Qualidade do ar desfavorável', detail: 'Considere reduzir atividades intensas ao ar livre, especialmente se você for sensível à poluição.' });
    }

    if (result.length === 0) {
      const stableRange = nextSixHours.every(item => Math.abs(item.temperature - current.temperature) < 5);
      result.push({
        id: 'stable', priority: 10, severity: 'good', title: stableRange ? 'Condições estáveis nas próximas horas' : 'Sem riscos relevantes agora',
        detail: stableRange ? 'Não há sinais de mudanças bruscas no horizonte imediato.' : 'Confira a previsão por hora antes de atividades mais longas.'
      });
    }

    return result.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [current, hourly, daily, airQuality, alerts]);

  if (!config.enabled) return null;

  return (
    <section className={`min-h-[9rem] rounded-2xl p-5 sm:p-6 ${cardClass}`} aria-label="Recomendações para as condições atuais">
      {insights[0] && (
        <div className="flex items-start gap-3">
          <span className={`mt-2 h-2.5 w-2.5 flex-none rounded-full ${severityDots[insights[0].severity]}`} aria-hidden="true" />
          <div>
            <h3 className="text-sm font-medium text-slate-400">{insights[0].title}</h3>
            <p className="mt-2 max-w-3xl text-xl font-medium leading-snug tracking-[-0.02em] text-slate-100 sm:text-2xl">{insights[0].detail}</p>
          </div>
        </div>
      )}
      {insights.length > 1 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {insights.slice(1).map(insight => (
            <div key={insight.id} className="rounded-xl bg-white/[0.03] p-3.5">
              <h4 className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${severityDots[insight.severity]}`} aria-hidden="true" />
                {insight.title}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{insight.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WeatherInsights;

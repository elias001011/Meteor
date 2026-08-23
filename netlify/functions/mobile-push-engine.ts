export interface MobileNotificationPreferences {
  severeAlerts: boolean;
  rainSoon: boolean;
  dailySummary: boolean;
  temperature: boolean;
  uv: boolean;
  wind: boolean;
  dailySummaryHour: number;
  quietHoursEnabled: boolean;
  quietStartHour: number;
  quietEndHour: number;
  coldThresholdC: number;
  heatThresholdC: number;
  uvThreshold: number;
  windThresholdKmh: number;
}

export interface MobileWeatherAlert {
  senderName: string;
  event: string;
  description: string;
  start: number;
  end: number;
  tags: string[];
}

export interface MobileHourlyWeather {
  dt: number;
  temperatureC: number | null;
  precipitationProbability: number;
  rainMm: number;
  snowMm: number;
  description: string;
}

export interface MobileDailyWeather {
  dt: number;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  precipitationProbability: number;
  uvIndex: number | null;
  description: string;
}

export interface MobileWeatherSnapshot {
  observedAt: number;
  temperatureC: number | null;
  feelsLikeC: number | null;
  uvIndex: number | null;
  windSpeedKmh: number | null;
  windGustKmh: number | null;
  description: string;
  hourly: MobileHourlyWeather[];
  daily: MobileDailyWeather[];
  alerts: MobileWeatherAlert[];
}

export type MobilePushType = 'severe' | 'rain' | 'daily' | 'temperature' | 'uv' | 'wind';

export interface MobilePushCandidate {
  type: MobilePushType;
  title: string;
  body: string;
  route: 'today';
  dedupeKey: string;
  dedupeUntil: number;
  bypassQuietHours: boolean;
}

export const DEFAULT_MOBILE_NOTIFICATION_PREFERENCES: MobileNotificationPreferences = {
  severeAlerts: true,
  rainSoon: true,
  dailySummary: true,
  temperature: false,
  uv: false,
  wind: false,
  dailySummaryHour: 7,
  quietHoursEnabled: true,
  quietStartHour: 22,
  quietEndHour: 7,
  coldThresholdC: 5,
  heatThresholdC: 35,
  uvThreshold: 8,
  windThresholdKmh: 60,
};

const clampProbability = (value: number): number => Math.min(1, Math.max(0, value));

const normalizedText = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const truncate = (value: string, maxLength: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

export const localDateHour = (
  nowMs: number,
  timeZone: string
): { date: string; hour: number } => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(nowMs));
  const value = (type: Intl.DateTimeFormatPartTypes): string => (
    parts.find((part) => part.type === type)?.value || ''
  );
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour')),
  };
};

export const isQuietHour = (hour: number, startHour: number, endHour: number): boolean => {
  if (startHour === endHour) return false;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
};

export const isCriticalOfficialAlert = (alert: MobileWeatherAlert): boolean => {
  const text = normalizedText(`${alert.event} ${alert.tags.join(' ')}`);
  return [
    'severe', 'extreme', 'emergency', 'red warning', 'aviso vermelho',
    'alerta vermelho', 'tornado', 'furacao', 'ciclone', 'tempestade severa',
    'inundacao', 'enchente', 'granizo',
  ].some((term) => text.includes(term));
};

const alertCandidate = (
  alert: MobileWeatherAlert,
  nowSeconds: number
): MobilePushCandidate => {
  const critical = isCriticalOfficialAlert(alert);
  const description = truncate(alert.description, 170);
  const signature = `${normalizedText(alert.event).replace(/[^a-z0-9]+/g, '-').slice(0, 48)}:${alert.start}`;
  return {
    type: 'severe',
    title: truncate(alert.event || 'Alerta meteorológico oficial', 80),
    body: description || `Alerta emitido por ${truncate(alert.senderName, 80)}. Acompanhe as orientações locais.`,
    route: 'today',
    dedupeKey: `official:${signature}`,
    dedupeUntil: Math.max(nowSeconds + 6 * 3_600, alert.end + 12 * 3_600),
    bypassQuietHours: critical,
  };
};

const rainCandidate = (
  snapshot: MobileWeatherSnapshot,
  nowSeconds: number
): MobilePushCandidate | null => {
  const horizon = snapshot.hourly
    .filter((hour) => hour.dt >= nowSeconds - 900 && hour.dt <= nowSeconds + 3 * 3_600)
    .sort((left, right) => left.dt - right.dt);
  const rain = horizon.find((hour) => (
    clampProbability(hour.precipitationProbability) >= 0.7 || hour.rainMm >= 0.5 || hour.snowMm >= 0.5
  ));
  if (!rain) return null;

  const minutes = Math.max(0, Math.round((rain.dt - nowSeconds) / 60));
  const probability = Math.round(clampProbability(rain.precipitationProbability) * 100);
  const timing = minutes <= 15 ? 'nos próximos minutos' : `em cerca de ${minutes} min`;
  return {
    type: 'rain',
    title: rain.snowMm >= 0.5 ? 'Neve se aproxima' : 'Chuva se aproxima',
    body: probability > 0
      ? `${probability}% de chance ${timing}. Considere se preparar antes de sair.`
      : `Precipitação prevista ${timing}. Considere se preparar antes de sair.`,
    route: 'today',
    dedupeKey: 'rain-soon',
    dedupeUntil: nowSeconds + 6 * 3_600,
    bypassQuietHours: false,
  };
};

const dailyCandidate = (
  snapshot: MobileWeatherSnapshot,
  localDate: string,
  nowSeconds: number
): MobilePushCandidate => {
  const today = snapshot.daily[0];
  const min = today?.minTemperatureC;
  const max = today?.maxTemperatureC;
  const range = min !== null && min !== undefined && max !== null && max !== undefined
    ? `Mínima de ${Math.round(min)}° e máxima de ${Math.round(max)}°.`
    : snapshot.temperatureC !== null
      ? `Agora, ${Math.round(snapshot.temperatureC)}°C.`
      : '';
  const probability = Math.round(clampProbability(today?.precipitationProbability || 0) * 100);
  const rain = probability >= 30 ? ` Chuva: ${probability}%.` : '';
  const condition = truncate(today?.description || snapshot.description || 'Confira a previsão de hoje.', 70);
  return {
    type: 'daily',
    title: 'Seu dia no Meteor',
    body: truncate(`${condition}. ${range}${rain}`, 180),
    route: 'today',
    dedupeKey: `daily:${localDate}`,
    dedupeUntil: nowSeconds + 30 * 3_600,
    bypassQuietHours: false,
  };
};

export const decideMobilePushes = (
  snapshot: MobileWeatherSnapshot,
  preferences: MobileNotificationPreferences,
  timeZone: string,
  nowMs: number = Date.now()
): MobilePushCandidate[] => {
  const nowSeconds = Math.floor(nowMs / 1_000);
  const local = localDateHour(nowMs, timeZone);
  const quiet = preferences.quietHoursEnabled
    && isQuietHour(local.hour, preferences.quietStartHour, preferences.quietEndHour);
  const candidates: MobilePushCandidate[] = [];

  if (preferences.severeAlerts) {
    const relevantAlerts = snapshot.alerts
      .filter((alert) => alert.end >= nowSeconds && alert.start <= nowSeconds + 6 * 3_600)
      .sort((left, right) => left.start - right.start)
      .slice(0, 3);
    candidates.push(...relevantAlerts.map((alert) => alertCandidate(alert, nowSeconds)));
  }

  if (preferences.rainSoon) {
    const candidate = rainCandidate(snapshot, nowSeconds);
    if (candidate) candidates.push(candidate);
  }

  if (preferences.dailySummary && local.hour === preferences.dailySummaryHour) {
    candidates.push(dailyCandidate(snapshot, local.date, nowSeconds));
  }

  if (preferences.temperature && snapshot.temperatureC !== null) {
    const temperature = snapshot.temperatureC;
    const band = temperature <= preferences.coldThresholdC
      ? 'cold'
      : temperature >= preferences.heatThresholdC
        ? 'heat'
        : null;
    if (band) {
      candidates.push({
        type: 'temperature',
        title: band === 'cold' ? 'Frio intenso agora' : 'Calor intenso agora',
        body: `Temperatura de ${Math.round(temperature)}°C${snapshot.feelsLikeC !== null ? `, sensação de ${Math.round(snapshot.feelsLikeC)}°C` : ''}.`,
        route: 'today',
        dedupeKey: `temperature:${local.date}:${band}`,
        dedupeUntil: nowSeconds + 18 * 3_600,
        bypassQuietHours: false,
      });
    }
  }

  if (preferences.uv && snapshot.uvIndex !== null && snapshot.uvIndex >= preferences.uvThreshold) {
    candidates.push({
      type: 'uv',
      title: 'Índice UV muito alto',
      body: `Índice UV ${Math.round(snapshot.uvIndex)}. Reduza a exposição direta e use proteção adequada.`,
      route: 'today',
      dedupeKey: `uv:${local.date}`,
      dedupeUntil: nowSeconds + 18 * 3_600,
      bypassQuietHours: false,
    });
  }

  if (preferences.wind) {
    const wind = Math.max(snapshot.windSpeedKmh || 0, snapshot.windGustKmh || 0);
    if (wind >= preferences.windThresholdKmh) {
      candidates.push({
        type: 'wind',
        title: 'Vento forte na região',
        body: `Rajadas ou ventos de até ${Math.round(wind)} km/h. Tenha atenção a objetos soltos e áreas expostas.`,
        route: 'today',
        dedupeKey: 'wind-strong',
        dedupeUntil: nowSeconds + 6 * 3_600,
        bypassQuietHours: false,
      });
    }
  }

  return candidates.filter((candidate) => !quiet || candidate.bypassQuietHours);
};

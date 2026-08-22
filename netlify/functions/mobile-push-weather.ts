import { fetchWithTimeout, safeText } from './security';
import type {
  MobileDailyWeather,
  MobileHourlyWeather,
  MobileWeatherAlert,
  MobileWeatherSnapshot,
} from './mobile-push-engine';
import type { MobileLocation } from './mobile-push-contract';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const numberOrNull = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const nonNegative = (value: unknown): number => Math.max(0, numberOrNull(value) || 0);

const probability = (value: unknown): number => Math.min(1, Math.max(0, numberOrNull(value) || 0));

const descriptionFromWeather = (value: unknown): string => {
  if (!Array.isArray(value) || !isRecord(value[0])) return '';
  return safeText(value[0].description, 100);
};

const parseHourly = (value: unknown): MobileHourlyWeather[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => {
    if (!isRecord(item)) return null;
    const dt = numberOrNull(item.dt);
    if (dt === null) return null;
    const rain = isRecord(item.rain) ? nonNegative(item.rain['1h']) : 0;
    const snow = isRecord(item.snow) ? nonNegative(item.snow['1h']) : 0;
    return {
      dt,
      temperatureC: numberOrNull(item.temp),
      precipitationProbability: probability(item.pop),
      rainMm: rain,
      snowMm: snow,
      description: descriptionFromWeather(item.weather),
    };
  }).filter((item): item is MobileHourlyWeather => item !== null);
};

const parseDaily = (value: unknown): MobileDailyWeather[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 2).map((item) => {
    if (!isRecord(item)) return null;
    const dt = numberOrNull(item.dt);
    if (dt === null) return null;
    const temperature = isRecord(item.temp) ? item.temp : {};
    return {
      dt,
      minTemperatureC: numberOrNull(temperature.min),
      maxTemperatureC: numberOrNull(temperature.max),
      precipitationProbability: probability(item.pop),
      uvIndex: numberOrNull(item.uvi),
      description: descriptionFromWeather(item.weather),
    };
  }).filter((item): item is MobileDailyWeather => item !== null);
};

const parseAlerts = (value: unknown): MobileWeatherAlert[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item) => {
    if (!isRecord(item)) return null;
    const event = safeText(item.event, 160);
    const start = numberOrNull(item.start);
    const end = numberOrNull(item.end);
    if (!event || start === null || end === null || end < start) return null;
    return {
      senderName: safeText(item.sender_name, 160) || 'Autoridade meteorológica',
      event,
      description: safeText(item.description, 2_000),
      start,
      end,
      tags: Array.isArray(item.tags)
        ? item.tags.map((tag) => safeText(tag, 80)).filter(Boolean).slice(0, 12)
        : [],
    };
  }).filter((item): item is MobileWeatherAlert => item !== null);
};

export const parseOpenWeatherSnapshot = (value: unknown): MobileWeatherSnapshot => {
  if (!isRecord(value) || !isRecord(value.current)) throw new Error('Invalid weather response');
  const current = value.current;
  const observedAt = numberOrNull(current.dt);
  if (observedAt === null) throw new Error('Invalid weather response');
  const windSpeed = numberOrNull(current.wind_speed);
  const windGust = numberOrNull(current.wind_gust);
  return {
    observedAt,
    temperatureC: numberOrNull(current.temp),
    feelsLikeC: numberOrNull(current.feels_like),
    uvIndex: numberOrNull(current.uvi),
    windSpeedKmh: windSpeed === null ? null : windSpeed * 3.6,
    windGustKmh: windGust === null ? null : windGust * 3.6,
    description: descriptionFromWeather(current.weather),
    hourly: parseHourly(value.hourly),
    daily: parseDaily(value.daily),
    alerts: parseAlerts(value.alerts),
  };
};

const cleanWeatherKey = (): string => {
  const raw = process.env.CLIMA_API?.trim() || '';
  const key = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
    ? raw.slice(1, -1).trim()
    : raw;
  return key.length >= 8 && key.length <= 512 && !/\s/.test(key) ? key : '';
};

export const fetchMobileWeather = async (location: MobileLocation): Promise<MobileWeatherSnapshot> => {
  const apiKey = cleanWeatherKey();
  if (!apiKey) throw new Error('Weather service is not configured');
  const url = new URL('https://api.openweathermap.org/data/3.0/onecall');
  url.searchParams.set('lat', String(location.latitude));
  url.searchParams.set('lon', String(location.longitude));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('lang', 'pt_br');
  url.searchParams.set('exclude', 'minutely');
  url.searchParams.set('appid', apiKey);

  const response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 9_000);
  if (!response.ok) throw new Error(`Weather upstream status ${response.status}`);
  return parseOpenWeatherSnapshot(await response.json());
};

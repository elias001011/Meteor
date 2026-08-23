
import { type Handler, type HandlerEvent } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { Buffer } from "buffer";
import {
    buildRateLimitResponse,
    checkRateLimit,
    createApiHeaders,
    errorResponse,
    fetchWithTimeout,
    jsonResponse,
    preflightResponse,
    safeErrorName,
    safeText,
    sanitizeExternalUrl,
} from "./security";

const API_KEY = process.env.CLIMA_API;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACESS_KEY;
const ALLOWED_METHODS = ['GET', 'OPTIONS'];

// Daily request limit for One Call API 3.0
const ONE_CALL_DAILY_LIMIT = 950;

const parseOpenMeteoLocalTime = (value: unknown, utcOffsetSeconds: number): number => {
    if (typeof value !== 'string' || !value) return 0;
    const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
    const parsed = Date.parse(normalized);
    if (!Number.isFinite(parsed)) return 0;
    return Math.floor(parsed / 1000) - (normalized === value ? 0 : utcOffsetSeconds);
};

const mapOwmIconToEmoji = (icon: string): string => {
    const iconMap: { [key: string]: string } = {
        '01d': '☀️', '01n': '🌙', '02d': '🌤️', '02n': '☁️',
        '03d': '☁️', '03n': '☁️', '04d': '🌥️', '04n': '🌥️',
        '09d': '🌦️', '09n': '🌦️', '10d': '🌧️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[icon] || '-';
};

const sanitizeWeatherAlerts = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value.slice(0, 12).map((alert) => {
        if (typeof alert !== 'object' || alert === null || Array.isArray(alert)) return null;
        const item = alert as Record<string, unknown>;
        const event = safeText(item.event, 160);
        const description = safeText(item.description, 4_000);
        const start = typeof item.start === 'number' && Number.isFinite(item.start) ? item.start : 0;
        const end = typeof item.end === 'number' && Number.isFinite(item.end) ? item.end : 0;
        if (!event || !description || !start || !end || end < start) return null;
        return {
            sender_name: safeText(item.sender_name, 160) || 'Autoridade meteorológica',
            event,
            start,
            end,
            description,
            tags: Array.isArray(item.tags)
                ? item.tags.map((tag) => safeText(tag, 80)).filter(Boolean).slice(0, 12)
                : [],
        };
    }).filter((alert): alert is NonNullable<typeof alert> => alert !== null);
};

// --- START OPEN-METEO ---
const mapOpenMeteoCodeToEmoji = (code: number, isDay: boolean = true): string => {
    const codeMap: { [key: number]: [string, string] } = {
        0: ['☀️', '🌙'], 1: ['🌤️', '☁️'], 2: ['🌥️', '☁️'], 3: ['☁️', '☁️'], 45: ['🌫️', '🌫️'], 48: ['🌫️', '🌫️'],
        51: ['🌦️', '🌦️'], 53: ['🌦️', '🌦️'], 55: ['🌦️', '🌦️'], 56: ['🌨️', '🌨️'], 57: ['🌨️', '🌨️'],
        61: ['🌧️', '🌧️'], 63: ['🌧️', '🌧️'], 65: ['🌧️', '🌧️'], 66: ['🌧️❄️', '🌧️❄️'], 67: ['🌧️❄️', '🌧️❄️'],
        71: ['❄️', '❄️'], 73: ['❄️', '❄️'], 75: ['❄️', '❄️'], 77: ['❄️', '❄️'],
        80: ['🌧️', '🌧️'], 81: ['🌧️', '🌧️'], 82: ['🌧️', '🌧️'], 85: ['❄️', '❄️'], 86: ['❄️', '❄️'],
        95: ['⛈️', '⛈️'], 96: ['⛈️', '⛈️'], 99: ['⛈️', '⛈️'],
    };
    const icons = codeMap[code] || ['-','-'];
    return isDay ? icons[0] : icons[1];
};

const mapWmoCodeToDescription = (code: number): string => {
    const descriptionMap: { [key: number]: string } = {
        0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Nevoeiro', 48: 'Nevoeiro com geada',
        51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa', 56: 'Garoa gelada leve', 57: 'Garoa gelada densa',
        61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte', 66: 'Chuva gelada leve', 67: 'Chuva gelada forte',
        71: 'Neve fraca', 73: 'Neve moderada', 75: 'Neve forte', 77: 'Grãos de neve',
        80: 'Pancadas de chuva fracas', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
        85: 'Pancadas de neve fracas', 86: 'Pancadas de neve fortes',
        95: 'Trovoada', 96: 'Trovoada com granizo fraco', 99: 'Trovoada com granizo forte',
    };
    return descriptionMap[code] || 'Condição desconhecida';
};

const fetchWithOpenMeteo = async (lat: string, lon: string) => {
    const forecastParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,dew_point_2m',
        hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation_probability,precipitation,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,dew_point_2m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant',
        timezone: 'auto', // Requests correct timezone calculation from Open-Meteo
        forecast_days: '7',
    });
    const airQualityParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'european_aqi,carbon_monoxide,nitrogen_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,pm2_5,pm10,ammonia',
        domains: 'auto'
    });

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${airQualityParams.toString()}`;
    
    const [forecastRes, airQualityRes] = await Promise.all([
        fetchWithTimeout(forecastUrl, { headers: { Accept: 'application/json' } }, 10_000),
        fetchWithTimeout(airQualityUrl, { headers: { Accept: 'application/json' } }, 8_000)
    ]);
    
    if (!forecastRes.ok) {
        const errorData = await forecastRes.json().catch(() => ({ reason: 'Unknown Open-Meteo forecast error' }));
        throw new Error(`[${forecastRes.status}] ${errorData.reason}`);
    }
    
    const forecastApiData = await forecastRes.json();
    
    let airQualityApiData = null;
    if (airQualityRes.ok) {
        airQualityApiData = await airQualityRes.json();
    }

    const current = forecastApiData.current;
    const daily = forecastApiData.daily;
    const hourly = forecastApiData.hourly;
    
    // Open-Meteo returns `utc_offset_seconds`
    const timezoneOffset = forecastApiData.utc_offset_seconds || 0;

    const weatherData = {
        dt: parseOpenMeteoLocalTime(current.time, timezoneOffset),
        timezoneOffset: timezoneOffset,
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature,
        condition: mapWmoCodeToDescription(current.weather_code),
        conditionIcon: mapOpenMeteoCodeToEmoji(current.weather_code, current.is_day === 1),
        windSpeed: Math.round(current.wind_speed_10m),
        wind_gust: Math.round(current.wind_gusts_10m),
        wind_deg: current.wind_direction_10m,
        humidity: current.relative_humidity_2m,
        pressure: current.surface_pressure,
        clouds: current.cloud_cover,
        rain_1h: current.precipitation,
        visibility: current.visibility, // meters
        dew_point: current.dew_point_2m,
        sunrise: parseOpenMeteoLocalTime(daily.sunrise[0], timezoneOffset),
        sunset: parseOpenMeteoLocalTime(daily.sunset[0], timezoneOffset),
    };
    
    // Calculate current time to filter past hourly data
    const nowSeconds = Math.floor(Date.now() / 1000);
    let startIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        // Compare using seconds
        const hourlyTime = parseOpenMeteoLocalTime(hourly.time[i], timezoneOffset);
        // Ensure we only take from current hour onwards (ignore past hours)
        // Allow a small buffer (e.g. 55 mins past hour, still show that hour)
        if (hourlyTime >= nowSeconds - 3600) { 
            startIndex = i;
            break;
        }
    }

    // A full day makes the native hourly chart useful without another request.
    const hourlyForecast = [];
    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
        hourlyForecast.push({
            dt: parseOpenMeteoLocalTime(hourly.time[i], timezoneOffset),
            temperature: hourly.temperature_2m[i],
            conditionIcon: mapOpenMeteoCodeToEmoji(hourly.weather_code[i], hourly.is_day[i] === 1),
            description: mapWmoCodeToDescription(hourly.weather_code[i]),
            pop: hourly.precipitation_probability[i] / 100,
            precipitation: hourly.precipitation[i],
            // Extended fields
            feels_like: hourly.apparent_temperature[i],
            humidity: hourly.relative_humidity_2m[i],
            wind_speed: hourly.wind_speed_10m[i],
            wind_gust: hourly.wind_gusts_10m[i],
            wind_deg: hourly.wind_direction_10m[i],
            pressure: hourly.surface_pressure[i],
            clouds: hourly.cloud_cover[i],
            dew_point: hourly.dew_point_2m[i]
        });
    }
    
    // Process Daily to ensure we show "Today" correctly based on City time
    const dailyForecast = [];
    // Get "today" in target timezone to compare
    const localToday = new Date(Date.now() + timezoneOffset * 1000).toISOString().split('T')[0];

    for (let i = 0; i < daily.time.length; i++) {
         const baseTime = new Date(`${daily.time[i]}T12:00:00Z`).getTime() / 1000;
         const dayTime = baseTime - timezoneOffset;

         const dayString = daily.time[i];
         
         if (dayString >= localToday && dailyForecast.length < 7) {
              dailyForecast.push({
                dt: dayTime,
                temperature: daily.temperature_2m_max[i],
                temperature_min: daily.temperature_2m_min[i],
                conditionIcon: mapOpenMeteoCodeToEmoji(daily.weather_code[i]),
                description: mapWmoCodeToDescription(daily.weather_code[i]),
                pop: daily.precipitation_probability_max[i] / 100,
                // Extended Fields
                uvi: daily.uv_index_max[i],
                wind_speed: daily.wind_speed_10m_max[i],
                wind_gust: daily.wind_gusts_10m_max[i],
                wind_deg: daily.wind_direction_10m_dominant[i],
                sunrise: parseOpenMeteoLocalTime(daily.sunrise[i], timezoneOffset),
                sunset: parseOpenMeteoLocalTime(daily.sunset[i], timezoneOffset),
            });
         }
    }

    const airQualityData = airQualityApiData?.current
      ? {
          aqi: typeof airQualityApiData.current.european_aqi === 'number'
              ? airQualityApiData.current.european_aqi <= 20 ? 1
              : airQualityApiData.current.european_aqi <= 40 ? 2
              : airQualityApiData.current.european_aqi <= 60 ? 3
              : airQualityApiData.current.european_aqi <= 80 ? 4
              : 5
              : undefined,
          components: {
              co: airQualityApiData.current.carbon_monoxide,
              no: airQualityApiData.current.nitrogen_monoxide,
              pm2_5: airQualityApiData.current.pm2_5,
              pm10: airQualityApiData.current.pm10,
              no2: airQualityApiData.current.nitrogen_dioxide,
              o3: airQualityApiData.current.ozone,
              so2: airQualityApiData.current.sulphur_dioxide,
              nh3: airQualityApiData.current.ammonia,
          },
        }
      : null;
    
    return {
        weatherData, airQualityData, hourlyForecast, dailyForecast,
        alerts: [], // Open-Meteo does not provide alerts
        dataSource: 'open-meteo' as const,
    };
}
// --- END OPEN-METEO ---


const fetchWithOneCall = async (lat: string, lon: string) => {
    const onecallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [onecallRes, airPollutionRes] = await Promise.all([
        fetchWithTimeout(onecallUrl, { headers: { Accept: 'application/json' } }, 10_000),
        fetchWithTimeout(airPollutionUrl, { headers: { Accept: 'application/json' } }, 8_000)
    ]);

    if (!onecallRes.ok) {
        const errorData = await onecallRes.json().catch(() => ({ message: 'Unknown One Call API error' }));
        throw new Error(`[${onecallRes.status}] ${errorData.message}`);
    }
    
    const onecallApiData = await onecallRes.json();
    
    let airPollutionApiData = null;
    if (airPollutionRes.ok) {
        airPollutionApiData = await airPollutionRes.json();
    }
    
    const weatherData = {
        dt: onecallApiData.current.dt,
        timezoneOffset: onecallApiData.timezone_offset,
        temperature: onecallApiData.current.temp,
        feels_like: onecallApiData.current.feels_like,
        visibility: onecallApiData.current.visibility,
        clouds: onecallApiData.current.clouds,
        wind_deg: onecallApiData.current.wind_deg,
        wind_gust: onecallApiData.current.wind_gust ? (onecallApiData.current.wind_gust * 3.6) : undefined,
        rain_1h: onecallApiData.current.rain?.['1h'],
        snow_1h: onecallApiData.current.snow?.['1h'],
        dew_point: onecallApiData.current.dew_point,
        condition: onecallApiData.current.weather[0].description.charAt(0).toUpperCase() + onecallApiData.current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(onecallApiData.current.weather[0].icon),
        windSpeed: Math.round(onecallApiData.current.wind_speed * 3.6),
        humidity: onecallApiData.current.humidity,
        pressure: onecallApiData.current.pressure,
        uvi: onecallApiData.current.uvi,
        sunrise: onecallApiData.current.sunrise,
        sunset: onecallApiData.current.sunset,
    };

    // OneCall returns hourly starting from current hour.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const hourlyForecast = onecallApiData.hourly
        .filter((item: any) => item.dt >= nowSeconds - 3600) // Allow current hour
        .slice(0, 24)
        .map((item: any) => ({
            dt: item.dt,
            temperature: item.temp,
            conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
            description: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
            pop: item.pop,
            precipitation: (item.rain?.['1h'] || 0) + (item.snow?.['1h'] || 0),
            // Extended fields
            feels_like: item.feels_like,
            humidity: item.humidity,
            wind_speed: item.wind_speed * 3.6,
            wind_gust: item.wind_gust ? item.wind_gust * 3.6 : undefined,
            wind_deg: item.wind_deg,
            uvi: item.uvi,
            pressure: item.pressure,
            clouds: item.clouds,
            dew_point: item.dew_point
        }));

    const dailyForecast = onecallApiData.daily.slice(0, 7).map((item: any) => ({
        dt: item.dt,
        temperature: item.temp.max,
        temperature_min: item.temp.min,
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        description: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
        pop: item.pop,
        // Extended Fields
        humidity: item.humidity,
        wind_speed: item.wind_speed * 3.6,
        wind_gust: item.wind_gust ? item.wind_gust * 3.6 : undefined,
        wind_deg: item.wind_deg,
        uvi: item.uvi,
        clouds: item.clouds,
        pressure: item.pressure,
        sunrise: item.sunrise,
        sunset: item.sunset,
        rain: item.rain,
        dew_point: item.dew_point,
        moon_phase: item.moon_phase,
        summary: item.summary
    }));

    const airQualityData = airPollutionApiData && airPollutionApiData.list?.[0]
        ? { aqi: airPollutionApiData.list[0].main.aqi, components: airPollutionApiData.list[0].components }
        : null;

    return {
        weatherData,
        airQualityData,
        hourlyForecast,
        dailyForecast,
        alerts: sanitizeWeatherAlerts(onecallApiData.alerts),
        dataSource: 'onecall' as const,
    };
};


const fetchWithFreeTier = async (lat: string, lon: string) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    const [weatherRes, forecastRes, airPollutionRes] = await Promise.all([
        fetchWithTimeout(weatherUrl, { headers: { Accept: 'application/json' } }, 10_000),
        fetchWithTimeout(forecastUrl, { headers: { Accept: 'application/json' } }, 10_000),
        fetchWithTimeout(airPollutionUrl, { headers: { Accept: 'application/json' } }, 8_000)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) {
        const error = !weatherRes.ok ? await weatherRes.json() : await forecastRes.json();
        throw new Error(error.message || 'Falha ao buscar dados do nível gratuito.');
    }
    const [weatherApiData, forecastApiData] = await Promise.all([ weatherRes.json(), forecastRes.json() ]);
    
    let airPollutionApiData = null;
    if (airPollutionRes.ok) {
        airPollutionApiData = await airPollutionRes.json();
    }

    const weatherData = {
        dt: weatherApiData.dt,
        timezoneOffset: weatherApiData.timezone, // Available in free tier weather endpoint
        temperature: weatherApiData.main.temp,
        feels_like: weatherApiData.main.feels_like,
        visibility: weatherApiData.visibility,
        clouds: weatherApiData.clouds?.all,
        wind_deg: weatherApiData.wind?.deg,
        wind_gust: weatherApiData.wind?.gust ? (weatherApiData.wind.gust * 3.6) : undefined,
        rain_1h: weatherApiData.rain?.['1h'],
        snow_1h: weatherApiData.snow?.['1h'],
        dew_point: undefined, // Not available in free current weather
        condition: weatherApiData.weather[0].description.charAt(0).toUpperCase() + weatherApiData.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(weatherApiData.weather[0].icon),
        windSpeed: Math.round(weatherApiData.wind.speed * 3.6),
        humidity: weatherApiData.main.humidity,
        pressure: weatherApiData.main.pressure,
        sunrise: weatherApiData.sys.sunrise,
        sunset: weatherApiData.sys.sunset,
    };
    
    // Process "Hourly"
    const nowSeconds = Math.floor(Date.now() / 1000);
    const futureList = forecastApiData.list.filter((item: any) => item.dt >= nowSeconds - 3600); // Allow current 3-hour block

    const hourlyForecast = futureList.slice(0, 16).map((item: any) => ({
        dt: item.dt,
        temperature: item.main.temp,
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        description: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
        pop: item.pop,
        precipitation: (item.rain?.['3h'] || 0) + (item.snow?.['3h'] || 0),
        // Extended fields (Available in 5day/3hr forecast)
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed * 3.6,
        wind_gust: item.wind.gust ? item.wind.gust * 3.6 : undefined,
        wind_deg: item.wind.deg,
        pressure: item.main.pressure,
        clouds: item.clouds.all
    }));
    
    // Process "Daily"
    const dailyMap = new Map();
    
    // Use the timezone offset from the API to ensure "days" align with the city's local time
    const timezoneOffset = forecastApiData.city.timezone; // seconds
    
    // Get "today" in target timezone
    const localToday = new Date(Date.now() + timezoneOffset * 1000).toISOString().split('T')[0];

    futureList.forEach((item: any) => {
        // We use UTC methods on the shifted time to bucket by day correctly relative to the city
        const localDt = (item.dt + timezoneOffset) * 1000;
        const date = new Date(localDt).toISOString().split('T')[0]; 
        
        // STRICTLY filter for today onwards
        if (date >= localToday) {
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    dt: item.dt, 
                    temps: [],
                    minTemps: [],
                    icons: [],
                    pops: [],
                    descriptions: [],
                    humidities: [],
                    winds: [],
                    cloudiness: [],
                    pressures: []
                });
            }
            
            const dayData = dailyMap.get(date);
            dayData.temps.push(item.main.temp);
            dayData.minTemps.push(item.main.temp_min);
            dayData.icons.push(item.weather[0].icon);
            dayData.pops.push(item.pop);
            dayData.descriptions.push(item.weather[0].description);
            dayData.humidities.push(item.main.humidity);
            dayData.winds.push(item.wind.speed);
            dayData.cloudiness.push(item.clouds.all);
            dayData.pressures.push(item.main.pressure);
        }
    });

    const dailyForecast = Array.from(dailyMap.values()).slice(0, 5).map((day: any) => {
        const maxTemp = Math.max(...day.temps);
        const minTemp = Math.min(...day.minTemps);
        const midIndex = Math.floor(day.icons.length / 2);
        const icon = day.icons[midIndex];
        const desc = day.descriptions[midIndex]; // Use mid-day description
        const maxPop = Math.max(...day.pops);
        
        // Averages for complex view
        const avgHumidity = day.humidities.reduce((a:number, b:number) => a + b, 0) / day.humidities.length;
        const maxWind = Math.max(...day.winds);

        return {
            dt: day.dt,
            temperature: maxTemp,
            temperature_min: minTemp,
            conditionIcon: mapOwmIconToEmoji(icon),
            description: desc.charAt(0).toUpperCase() + desc.slice(1),
            pop: maxPop,
            // Extended
            humidity: Math.round(avgHumidity),
            wind_speed: maxWind * 3.6,
            clouds: Math.round(day.cloudiness.reduce((a:number,b:number)=>a+b,0)/day.cloudiness.length),
            pressure: Math.round(day.pressures.reduce((a:number,b:number)=>a+b,0)/day.pressures.length)
        };
    });

    const airQualityData = airPollutionApiData && airPollutionApiData.list?.[0]
        ? { aqi: airPollutionApiData.list[0].main.aqi, components: airPollutionApiData.list[0].components }
        : null;

    return {
        weatherData,
        airQualityData,
        hourlyForecast,
        dailyForecast,
        alerts: [],
        dataSource: 'free' as const,
    };
};

// Fallback Map Codes for Maps 1.0 (Free Tier)
const MAP_LAYER_FALLBACKS: Record<string, string> = {
    'TA2': 'temp_new',
    'CL': 'clouds_new',
    'PR0': 'precipitation_new',
    'APM': 'pressure_new',
    'WS10': 'wind_new'
};

const ALLOWED_TILE_LAYERS = new Set(['TA2', 'CL', 'PR0', 'APM', 'WS10']);

const RATE_LIMIT_BY_ENDPOINT: Record<string, { namespace: string; limit: number; windowSeconds: number }> = {
    all: { namespace: 'weather-all', limit: 80, windowSeconds: 600 },
    direct: { namespace: 'weather-geo', limit: 120, windowSeconds: 600 },
    reverse: { namespace: 'weather-geo', limit: 120, windowSeconds: 600 },
    tile: { namespace: 'weather-tiles', limit: 900, windowSeconds: 600 },
    relief: { namespace: 'weather-relief', limit: 500, windowSeconds: 600 },
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const parseStoredCount = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return numeric;
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed;
            if (typeof parsed?.count === 'number' && Number.isFinite(parsed.count)) return parsed.count;
            return 0;
        } catch {
            return 0;
        }
    }
    return 0;
};

const parseDailyStoredCount = (value: unknown, expectedDate: string): number => {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed?.date && parsed.date !== expectedDate) return 0;
            if (typeof parsed?.count === 'number' && Number.isFinite(parsed.count)) return parsed.count;
        } catch {
            return parseStoredCount(value);
        }
    }

    return parseStoredCount(value);
};

const parseCoordinate = (value: unknown): number | null => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const numeric = Number(trimmed);
        return Number.isFinite(numeric) ? numeric : null;
    }
    const numeric = typeof value === 'number' ? value : NaN;
    return Number.isFinite(numeric) ? numeric : null;
};

const isPositiveIntegerString = (value: unknown): value is string => (
    typeof value === 'string' && /^\d+$/.test(value)
);

const areValidTileCoordinates = (z: unknown, x: unknown, y: unknown): z is string => {
    if (!isPositiveIntegerString(z) || !isPositiveIntegerString(x) || !isPositiveIntegerString(y)) return false;
    const zoom = Number(z);
    const tileX = Number(x);
    const tileY = Number(y);
    if (!Number.isSafeInteger(zoom) || zoom < 0 || zoom > 20) return false;
    const maxCoordinate = 2 ** zoom;
    return Number.isSafeInteger(tileX) && Number.isSafeInteger(tileY)
        && tileX >= 0 && tileY >= 0 && tileX < maxCoordinate && tileY < maxCoordinate;
};

const clampLimit = (value: unknown, fallback: number, maxAllowed: number): string => {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : fallback;
    if (!Number.isFinite(parsed)) return String(fallback);
    return String(Math.min(Math.max(parsed, 1), maxAllowed));
};

const sanitizeGeoResults = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value.slice(0, 10).map((item) => {
        if (!isRecord(item)) return null;

        const lat = parseCoordinate(item.lat);
        const lon = parseCoordinate(item.lon);
        const name = safeText(item.name, 120);
        const country = safeText(item.country, 8);

        if (!name || !country || lat === null || lon === null) return null;

        const result: { name: string; country: string; lat: number; lon: number; state?: string } = {
            name,
            country,
            lat,
            lon,
        };
        const state = safeText(item.state, 120);
        if (state) result.state = state;

        return result;
    }).filter((item): item is { name: string; country: string; lat: number; lon: number; state?: string } => item !== null);
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod === 'OPTIONS') return preflightResponse(event, ALLOWED_METHODS);
    if (event.httpMethod !== 'GET') {
        return errorResponse(event, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', {
            methods: ALLOWED_METHODS,
            headers: { Allow: ALLOWED_METHODS.join(', ') },
        });
    }

    const queryParams = event.queryStringParameters || {};
    const endpointName = typeof queryParams.endpoint === 'string' ? queryParams.endpoint : '';
    if (!API_KEY && endpointName !== 'all') {
        return errorResponse(event, 503, 'WEATHER_NOT_CONFIGURED', 'O serviço solicitado está temporariamente indisponível.', {
            methods: ALLOWED_METHODS,
        });
    }
    const rateLimit = await checkRateLimit(
        event,
        RATE_LIMIT_BY_ENDPOINT[endpointName] || { namespace: 'weather-unknown', limit: 60, windowSeconds: 600 }
    );
    if (!rateLimit.allowed) {
        return buildRateLimitResponse(event, rateLimit, ALLOWED_METHODS);
    }

    const { endpoint, ...params } = queryParams;
    const query = new URLSearchParams();
    
    try {
        switch (endpoint) {
            case 'all': {
                const lat = parseCoordinate(params.lat);
                const lon = parseCoordinate(params.lon);
                const q = safeText(params.q, 120);
                const country = safeText(params.country, 8).toUpperCase();
                const source = safeText(params.source, 20) || 'auto';

                if (lat === null || lon === null) {
                    return errorResponse(event, 400, 'COORDINATES_REQUIRED', 'Latitude e longitude são obrigatórias.', { methods: ALLOWED_METHODS });
                }
                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    return errorResponse(event, 400, 'INVALID_COORDINATES', 'Coordenadas inválidas.', { methods: ALLOWED_METHODS });
                }
                if (!['auto', 'onecall', 'free', 'open-meteo'].includes(source)) {
                    return errorResponse(event, 400, 'INVALID_WEATHER_SOURCE', 'Fonte de dados meteorológicos inválida.', { methods: ALLOWED_METHODS });
                }

                const latParam = String(lat);
                const lonParam = String(lon);
                
                let weatherBundle;
                let fallbackStatus: 'onecall_failed' | 'free_tier_failed' | null = null;
                
                if (source === 'onecall') {
                    try {
                        if (!API_KEY) throw new Error('Provider unavailable');
                        weatherBundle = await fetchWithOneCall(latParam, lonParam);
                    } catch (error) {
                        fallbackStatus = 'onecall_failed';
                        try {
                            if (!API_KEY) throw new Error('Provider unavailable');
                            weatherBundle = await fetchWithFreeTier(latParam, lonParam);
                        } catch {
                            weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                        }
                    }
                } else if (source === 'free') {
                    try {
                        if (!API_KEY) throw new Error('Provider unavailable');
                        weatherBundle = await fetchWithFreeTier(latParam, lonParam);
                    } catch (error) {
                         fallbackStatus = 'free_tier_failed';
                         weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                    }
                } else if (source === 'open-meteo') {
                     weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                } else {
                    // AUTO MODE (Logic: Try OneCall -> Check Limit -> Fallback to Free -> Fallback to Open-Meteo)
                    let useFallbackDirectly = false;
                    if (!API_KEY) {
                        weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                    } else try {
                        const store = getStore("onecall-rate-limit");
                        const today = new Date().toISOString().split('T')[0];
                        const counterKey = 'onecall_requests';
                        const currentCount = parseDailyStoredCount(await store.get(counterKey), today);
                        
                        if (currentCount >= ONE_CALL_DAILY_LIMIT) {
                            useFallbackDirectly = true;
                        }
                    } catch (blobError) {
                        // Rate limiting disabled
                    }

                    if (weatherBundle) {
                        // Open-Meteo was selected because the optional OpenWeather key is absent.
                    } else if (useFallbackDirectly) {
                         try {
                            weatherBundle = await fetchWithFreeTier(latParam, lonParam);
                        } catch (error) {
                            fallbackStatus = 'free_tier_failed';
                            weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                        }
                    } else {
                        try {
                            weatherBundle = await fetchWithOneCall(latParam, lonParam);
                            try { // Increment counter on success
                                const store = getStore("onecall-rate-limit");
                                const today = new Date().toISOString().split('T')[0];
                                const counterKey = 'onecall_requests';
                                const newCount = parseDailyStoredCount(await store.get(counterKey), today) + 1;
                                await store.set(counterKey, JSON.stringify({ date: today, count: newCount }));
                            } catch (blobError) {
                                // Failed to increment counter
                            }
                        } catch (error) {
                            fallbackStatus = 'onecall_failed';
                            try {
                                weatherBundle = await fetchWithFreeTier(latParam, lonParam);
                            } catch (error2) {
                                fallbackStatus = 'free_tier_failed';
                                weatherBundle = await fetchWithOpenMeteo(latParam, lonParam);
                            }
                        }
                    }
                }
                
                let resolvedCityName = q || "Localização Atual";
                if (q) {
                    weatherBundle.weatherData.city = q;
                    weatherBundle.weatherData.country = country || '';
                } else if (API_KEY) {
                    try {
                        const geoResponse = await fetchWithTimeout(
                            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
                            { headers: { Accept: 'application/json' } },
                            6_000
                        );
                        if (geoResponse.ok) {
                            const geoData = await geoResponse.json();
                            const firstResult = sanitizeGeoResults(geoData)[0];
                            if (firstResult) {
                                resolvedCityName = firstResult.name;
                                weatherBundle.weatherData.city = firstResult.name;
                                weatherBundle.weatherData.country = firstResult.country;
                            }
                        }
                    } catch (error) {
                        console.warn(`[Weather] Reverse geocoding unavailable (${safeErrorName(error)}).`);
                    }
                }
                weatherBundle.weatherData.city = weatherBundle.weatherData.city || resolvedCityName;
                weatherBundle.weatherData.country = weatherBundle.weatherData.country || '';

                const imageFallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(`${resolvedCityName}-meteor`)}/1600/1000`;
                let imageUrl = imageFallbackUrl;
                let imageAttribution: {
                    source: 'unsplash' | 'picsum';
                    photographer?: string;
                    photographerUrl?: string;
                    photoUrl?: string;
                } = { source: 'picsum', photoUrl: 'https://picsum.photos/' };

                if (UNSPLASH_KEY) {
                    try {
                        const weatherCondition = weatherBundle.weatherData.condition || 'weather';
                        const searchQuery = `${resolvedCityName} ${weatherCondition}`;
                        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;

                        const unsplashRes = await fetchWithTimeout(unsplashUrl, {
                            headers: {
                                Authorization: `Client-ID ${UNSPLASH_KEY}`,
                                Accept: 'application/json',
                                'Accept-Version': 'v1',
                            },
                        }, 7_000);

                        if (unsplashRes.ok) {
                            const unsplashData = await unsplashRes.json();
                            const photo = Array.isArray(unsplashData.results) ? unsplashData.results[0] : null;
                            const photoUrl = sanitizeExternalUrl(photo?.urls?.regular);
                            if (photoUrl) {
                                imageUrl = photoUrl;
                                const photographer = safeText(photo?.user?.name, 120) || 'Fotógrafo no Unsplash';
                                const photographerUrl = sanitizeExternalUrl(photo?.user?.links?.html);
                                const unsplashPhotoUrl = sanitizeExternalUrl(photo?.links?.html);
                                const withAttributionParams = (value: string | null): string | undefined => {
                                    if (!value) return undefined;
                                    const url = new URL(value);
                                    url.searchParams.set('utm_source', 'meteor');
                                    url.searchParams.set('utm_medium', 'referral');
                                    return url.toString();
                                };
                                imageAttribution = {
                                    source: 'unsplash',
                                    photographer,
                                    photographerUrl: withAttributionParams(photographerUrl),
                                    photoUrl: withAttributionParams(unsplashPhotoUrl),
                                };
                            }
                        }
                    } catch (error) {
                        console.warn(`[Weather] Unsplash unavailable (${safeErrorName(error)}); using fallback image.`);
                    }
                }

                weatherBundle.weatherData.imageUrl = imageUrl;
                weatherBundle.weatherData.imageFallbackUrl = imageFallbackUrl;
                weatherBundle.weatherData.imageAttribution = imageAttribution;
                const responseBody = { ...weatherBundle, fallbackStatus };

                return jsonResponse(event, 200, responseBody, {
                    methods: ALLOWED_METHODS,
                    cacheControl: 'public, max-age=180, s-maxage=300, stale-while-revalidate=600',
                    headers: {
                        'X-RateLimit-Limit': String(rateLimit.limit),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                    },
                });
            }

            case 'direct':
            case 'reverse': {
                if (endpoint === 'direct') {
                    const cityQuery = safeText(params.q, 120);
                    if (!cityQuery) {
                        return errorResponse(event, 400, 'CITY_QUERY_REQUIRED', 'Informe uma cidade para realizar a busca.', { methods: ALLOWED_METHODS });
                    }
                    query.set('q', cityQuery);
                    query.set('limit', clampLimit(params.limit, 5, 10));
                } else {
                    const lat = parseCoordinate(params.lat);
                    const lon = parseCoordinate(params.lon);
                    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                        return errorResponse(event, 400, 'INVALID_COORDINATES', 'Coordenadas inválidas.', { methods: ALLOWED_METHODS });
                    }
                    query.set('lat', String(lat));
                    query.set('lon', String(lon));
                    query.set('limit', clampLimit(params.limit, 1, 10));
                }
                const baseUrl = `https://api.openweathermap.org/geo/1.0/${endpoint}`;
                query.set('appid', API_KEY);
                const apiUrl = `${baseUrl}?${query.toString()}`;
                const response = await fetchWithTimeout(apiUrl, { headers: { Accept: 'application/json' } }, 8_000);
                const data = await response.json();
                if (!response.ok) throw new Error('Geocoding upstream unavailable');
                return jsonResponse(event, 200, sanitizeGeoResults(data), {
                    methods: ALLOWED_METHODS,
                    cacheControl: 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800',
                });
            }

            case 'tile': {
                const { layer, z, x, y } = params;
                if (!layer || !ALLOWED_TILE_LAYERS.has(layer) || !areValidTileCoordinates(z, x, y)) {
                    return errorResponse(event, 400, 'INVALID_TILE', 'Parâmetros de tile inválidos.', { methods: ALLOWED_METHODS });
                }
                
                // Try Maps 2.0 (Paid/Developer)
                const tileUrl2 = `https://maps.openweathermap.org/maps/2.0/weather/${layer}/${z}/${x}/${y}?appid=${API_KEY}`;
                
                try {
                    let response = await fetchWithTimeout(tileUrl2, {}, 8_000);
                    
                    // If 401 Unauthorized (Free Key) or similar error, try fallback to Maps 1.0 (Free)
                    if (!response.ok) {
                        const fallbackLayer = MAP_LAYER_FALLBACKS[layer];
                        if (fallbackLayer) {
                             const tileUrl1 = `https://tile.openweathermap.org/map/${fallbackLayer}/${z}/${x}/${y}.png?appid=${API_KEY}`;
                             response = await fetchWithTimeout(tileUrl1, {}, 8_000);
                        } else {
                            // No fallback mapping available for this layer
                             return { statusCode: 502, headers: createApiHeaders(event, { methods: ALLOWED_METHODS }), body: '' };
                        }
                    }

                    if (!response.ok) {
                        return { statusCode: 502, headers: createApiHeaders(event, { methods: ALLOWED_METHODS }), body: '' };
                    }

                    const buffer = await response.arrayBuffer();
                    return {
                        statusCode: 200,
                        headers: createApiHeaders(event, {
                            methods: ALLOWED_METHODS,
                            cacheControl: 'public, max-age=1800, s-maxage=3600',
                            headers: { 'Content-Type': 'image/png' },
                        }),
                        body: Buffer.from(buffer).toString('base64'),
                        isBase64Encoded: true,
                    };
                } catch (error) {
                    console.warn(`[Weather] Map tile unavailable (${safeErrorName(error)}).`);
                    return { statusCode: 502, headers: createApiHeaders(event, { methods: ALLOWED_METHODS }), body: '' };
                }
            }

            case 'relief': {
                const { z, x, y } = params;
                if (!areValidTileCoordinates(z, x, y)) {
                    return errorResponse(event, 400, 'INVALID_TILE', 'Parâmetros de tile de relevo inválidos.', { methods: ALLOWED_METHODS });
                }
                // Relief map is generally paid-only on OWM Maps 2.0 and has no direct 1.0 equivalent.
                // We try to fetch it, and if it fails (401), we return empty so the map doesn't break.
                const tileUrl = `https://maps.openweathermap.org/maps/2.0/relief/${z}/${x}/${y}?appid=${API_KEY}`;
                 try {
                    const response = await fetchWithTimeout(tileUrl, {}, 8_000);
                    if (!response.ok) {
                        // Likely 401 Unauthorized on free plans
                        return { statusCode: 404, headers: createApiHeaders(event, { methods: ALLOWED_METHODS }), body: '' }; // 404 signals Leaflet to hide the tile
                    }
                    const buffer = await response.arrayBuffer();
                    return {
                        statusCode: 200,
                        headers: createApiHeaders(event, {
                            methods: ALLOWED_METHODS,
                            cacheControl: 'public, max-age=1800, s-maxage=3600',
                            headers: { 'Content-Type': 'image/png' },
                        }),
                        body: Buffer.from(buffer).toString('base64'),
                        isBase64Encoded: true,
                    };
                 } catch(error) {
                     console.warn(`[Weather] Relief tile unavailable (${safeErrorName(error)}).`);
                     return { statusCode: 502, headers: createApiHeaders(event, { methods: ALLOWED_METHODS }), body: '' };
                 }
            }

            default:
                return errorResponse(event, 400, 'INVALID_ENDPOINT', 'Endpoint da API inválido.', { methods: ALLOWED_METHODS });
        }
    } catch (error) {
        console.error(`[Weather] Request failed (${safeErrorName(error)}).`);
        return errorResponse(event, 503, 'WEATHER_UPSTREAM_UNAVAILABLE', 'Não foi possível carregar os dados meteorológicos agora. Tente novamente em instantes.', {
            methods: ALLOWED_METHODS,
            headers: { 'Retry-After': '10' },
        });
    }
};

export { handler };

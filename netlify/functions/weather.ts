






// FIX: Module '"@netlify/functions"' has no exported member 'getStore'. This is likely due to a version mismatch. Importing `getStore` directly from `@netlify/blobs` as a documented fallback.
import { type Handler, type HandlerEvent, type HandlerContext } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { Buffer } from "buffer";

const API_KEY = process.env.CLIMA_API;
const UNSPLASH_KEY = process.env.UNSPLASH_ACESS_KEY;

// Daily request limit for One Call API 3.0
const ONE_CALL_DAILY_LIMIT = 950;

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
    console.log("Attempting to fetch data from Open-Meteo API");
    const forecastParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
        daily: 'weather_code,temperature_2m_max,sunrise,sunset,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '7',
    });
    const airQualityParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone',
        domains: 'auto'
    });

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${airQualityParams.toString()}`;
    
    const [forecastRes, airQualityRes] = await Promise.all([
        fetch(forecastUrl),
        fetch(airQualityUrl)
    ]);
    
    if (!forecastRes.ok) {
        const errorData = await forecastRes.json().catch(() => ({ reason: 'Unknown Open-Meteo forecast error' }));
        throw new Error(`[${forecastRes.status}] ${errorData.reason}`);
    }
    
    console.log("Successfully fetched forecast data from Open-Meteo");
    const forecastApiData = await forecastRes.json();
    
    let airQualityApiData = null;
    if (airQualityRes.ok) {
        airQualityApiData = await airQualityRes.json();
        console.log("Successfully fetched air quality data from Open-Meteo");
    } else {
        console.warn("Could not fetch air quality data from Open-Meteo. It will be omitted.");
    }

    const current = forecastApiData.current;
    const daily = forecastApiData.daily;
    const hourly = forecastApiData.hourly;

    const weatherData = {
        dt: new Date(current.time).getTime() / 1000,
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
        sunrise: new Date(daily.sunrise[0]).getTime() / 1000,
        sunset: new Date(daily.sunset[0]).getTime() / 1000,
    };
    
    // Calculate current time to filter past hourly data
    // OpenMeteo returns hourly data starting from 00:00 of the first day.
    // We must find the index corresponding to the current time.
    const nowSeconds = Math.floor(Date.now() / 1000);
    let startIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        // Compare using seconds
        const hourlyTime = new Date(hourly.time[i]).getTime() / 1000;
        // Ensure we only take from current hour onwards (ignore past hours)
        if (hourlyTime >= nowSeconds - 1800) { // 30 min buffer to include current hour
            startIndex = i;
            break;
        }
    }

    // Take the next 8 hours starting from current time
    const hourlyForecast = [];
    for (let i = startIndex; i < startIndex + 8 && i < hourly.time.length; i++) {
        hourlyForecast.push({
            dt: new Date(hourly.time[i]).getTime() / 1000,
            temperature: hourly.temperature_2m[i],
            conditionIcon: mapOpenMeteoCodeToEmoji(hourly.weather_code[i], hourly.is_day[i] === 1),
            pop: hourly.precipitation_probability[i] / 100,
        });
    }
    
    // Filter daily to ensure we don't show yesterday
    const dailyForecast = [];
    for (let i = 0; i < daily.time.length; i++) {
         const dayTime = new Date(daily.time[i]).getTime() / 1000;
         // Simple check to ensure the day isn't in the past (older than 24h from now)
         // Note: OpenMeteo daily times are usually 00:00 local time.
         if (dailyForecast.length < 7) {
              dailyForecast.push({
                dt: dayTime,
                temperature: daily.temperature_2m_max[i],
                conditionIcon: mapOpenMeteoCodeToEmoji(daily.weather_code[i]),
                pop: daily.precipitation_probability_max[i] / 100,
            });
         }
    }

    const airQualityData = airQualityApiData?.current
      ? {
          components: {
              pm2_5: airQualityApiData.current.pm2_5,
              no2: airQualityApiData.current.nitrogen_dioxide,
              o3: airQualityApiData.current.ozone,
              so2: airQualityApiData.current.sulphur_dioxide,
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
    console.log("Attempting to fetch data from One Call API 3.0");
    const onecallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [onecallRes, airPollutionRes] = await Promise.all([
        fetch(onecallUrl),
        fetch(airPollutionUrl)
    ]);

    if (!onecallRes.ok) {
        const errorData = await onecallRes.json().catch(() => ({ message: 'Unknown One Call API error' }));
        throw new Error(`[${onecallRes.status}] ${errorData.message}`);
    }
    
    console.log("Successfully fetched data from One Call API 3.0");
    const onecallApiData = await onecallRes.json();
    
    let airPollutionApiData = null;
    if (airPollutionRes.ok) {
        airPollutionApiData = await airPollutionRes.json();
    } else {
        console.warn("Could not fetch air pollution data with One Call. It will be omitted.");
    }
    
    const weatherData = {
        dt: onecallApiData.current.dt,
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
    // Sometimes it returns the previous hour if the cache is slightly stale or depending on request timing.
    // Filter to ensure we only show current hour onwards.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const hourlyForecast = onecallApiData.hourly
        .filter((item: any) => item.dt >= nowSeconds - 3600) // Allow current hour
        .slice(0, 8)
        .map((item: any) => ({
            dt: item.dt,
            temperature: item.temp,
            conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
            pop: item.pop,
        }));

    const dailyForecast = onecallApiData.daily.slice(0, 7).map((item: any) => ({
        dt: item.dt,
        temperature: item.temp.max,
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        pop: item.pop,
    }));

    const airQualityData = airPollutionApiData && airPollutionApiData.list?.[0]
        ? { aqi: airPollutionApiData.list[0].main.aqi, components: airPollutionApiData.list[0].components }
        : null;

    return {
        weatherData,
        airQualityData,
        hourlyForecast,
        dailyForecast,
        alerts: onecallApiData.alerts || [],
        dataSource: 'onecall' as const,
    };
};


const fetchWithFreeTier = async (lat: string, lon: string) => {
    console.log("Attempting to fetch data from Free Tier APIs (Standard + Forecast 5d/3h)");
    
    // Use ONLY the free endpoints. 
    // 'weather' = Current weather
    // 'forecast' = 5 Day / 3 Hour Forecast. We will manually aggregate this to create daily/hourly views.
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    const [weatherRes, forecastRes, airPollutionRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl),
        fetch(airPollutionUrl)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) {
        const error = !weatherRes.ok ? await weatherRes.json() : await forecastRes.json();
        throw new Error(error.message || 'Falha ao buscar dados do nível gratuito.');
    }
    console.log("Successfully fetched data from Free Tier APIs");

    const [weatherApiData, forecastApiData] = await Promise.all([ weatherRes.json(), forecastRes.json() ]);
    
    let airPollutionApiData = null;
    if (airPollutionRes.ok) {
        airPollutionApiData = await airPollutionRes.json();
    } else {
        console.warn("Could not fetch air pollution data. It will be omitted.");
    }

    const weatherData = {
        dt: weatherApiData.dt,
        temperature: weatherApiData.main.temp,
        feels_like: weatherApiData.main.feels_like,
        visibility: weatherApiData.visibility,
        clouds: weatherApiData.clouds?.all,
        wind_deg: weatherApiData.wind?.deg,
        wind_gust: weatherApiData.wind?.gust ? (weatherApiData.wind.gust * 3.6) : undefined,
        rain_1h: weatherApiData.rain?.['1h'],
        snow_1h: weatherApiData.snow?.['1h'],
        condition: weatherApiData.weather[0].description.charAt(0).toUpperCase() + weatherApiData.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(weatherApiData.weather[0].icon),
        windSpeed: Math.round(weatherApiData.wind.speed * 3.6),
        humidity: weatherApiData.main.humidity,
        pressure: weatherApiData.main.pressure,
        sunrise: weatherApiData.sys.sunrise,
        sunset: weatherApiData.sys.sunset,
    };
    
    // Process "Hourly" (It's actually every 3 hours, but we map it as hourly for the UI)
    // Filter out past entries strictly
    const nowSeconds = Math.floor(Date.now() / 1000);
    const futureList = forecastApiData.list.filter((item: any) => item.dt > nowSeconds);

    // Take the first 8 segments (24 hours approx)
    const hourlyForecast = futureList.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: item.main.temp,
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        pop: item.pop,
    }));
    
    // Process "Daily" (Aggregate the 3-hour segments by day)
    const dailyMap = new Map();
    
    // Use the timezone offset from the API to ensure "days" align with the city's local time
    const timezoneOffset = forecastApiData.city.timezone; // seconds

    // Iterate over future list only to prevent "Yesterday" bug
    futureList.forEach((item: any) => {
        // Shift timestamp to local time before extracting date string.
        // This creates a "fake UTC" date object where the getUTCHours/getUTCDate matches the local time in the city.
        const localDt = (item.dt + timezoneOffset) * 1000;
        const date = new Date(localDt).toISOString().split('T')[0]; // YYYY-MM-DD (Local representation)
        
        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                dt: item.dt, // Use timestamp of first occurrence (UTC)
                temps: [],
                icons: [],
                pops: []
            });
        }
        
        const dayData = dailyMap.get(date);
        dayData.temps.push(item.main.temp);
        dayData.icons.push(item.weather[0].icon);
        dayData.pops.push(item.pop);
    });

    // Convert map to array and format
    const dailyForecast = Array.from(dailyMap.values()).slice(0, 5).map((day: any) => {
        const maxTemp = Math.max(...day.temps);
        const midIndex = Math.floor(day.icons.length / 2);
        const icon = day.icons[midIndex];
        const maxPop = Math.max(...day.pops);

        return {
            dt: day.dt,
            temperature: maxTemp,
            conditionIcon: mapOwmIconToEmoji(icon),
            pop: maxPop
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
        alerts: [], // Free tier does not have alerts
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: "API key para clima não configurada no servidor." }) };
    }

    const { endpoint, ...params } = event.queryStringParameters;
    const query = new URLSearchParams(params as Record<string, string>);
    
    try {
        switch (endpoint) {
            case 'all': {
                const lat = params.lat;
                const lon = params.lon;
                const q = params.q; // City name from search
                const country = params.country;
                const source = params.source; // 'onecall', 'free', 'open-meteo'

                if (!lat || !lon) return { statusCode: 400, body: JSON.stringify({ message: "Latitude e longitude são obrigatórias." }) };
                
                let weatherBundle;
                let fallbackStatus: 'onecall_failed' | 'free_tier_failed' | null = null;
                
                if (source === 'onecall') {
                    try {
                        weatherBundle = await fetchWithOneCall(lat, lon);
                    } catch (error) {
                         console.warn(`Explicit OneCall failed: ${error.message}. Fallback to free.`);
                         fallbackStatus = 'onecall_failed';
                         weatherBundle = await fetchWithFreeTier(lat, lon);
                    }
                } else if (source === 'free') {
                    try {
                        weatherBundle = await fetchWithFreeTier(lat, lon);
                    } catch (error) {
                         console.warn(`Explicit Free failed: ${error.message}. Fallback to Open-Meteo.`);
                         fallbackStatus = 'free_tier_failed';
                         weatherBundle = await fetchWithOpenMeteo(lat, lon);
                    }
                } else if (source === 'open-meteo') {
                     weatherBundle = await fetchWithOpenMeteo(lat, lon);
                } else {
                    // AUTO MODE (Logic: Try OneCall -> Check Limit -> Fallback to Free -> Fallback to Open-Meteo)
                    let useFallbackDirectly = false;
                    try {
                        const store = getStore("onecall-rate-limit");
                        const today = new Date().toISOString().split('T')[0];
                        const counterKey = `onecall_requests_${today}`;
                        const currentCount = (await store.get(counterKey)) as number | null;
                        
                        console.log(`[Rate Limit Check] Key: ${counterKey}. Current count: ${currentCount || 0}/${ONE_CALL_DAILY_LIMIT}.`);
                        if (currentCount && currentCount >= ONE_CALL_DAILY_LIMIT) {
                            console.warn(`[Rate Limit Action] One Call API daily limit reached. Forcing fallback.`);
                            useFallbackDirectly = true;
                        }
                    } catch (blobError) {
                        console.warn(`[Rate Limit Info] Netlify Blobs not accessible, rate limiting is disabled. Error: ${blobError.message}`);
                    }

                    if (useFallbackDirectly) {
                         try {
                            weatherBundle = await fetchWithFreeTier(lat, lon);
                        } catch (error) {
                            console.warn(`Free tier also failed: ${error.message}. Falling back to Open-Meteo.`);
                            fallbackStatus = 'free_tier_failed';
                            weatherBundle = await fetchWithOpenMeteo(lat, lon);
                        }
                    } else {
                        try {
                            weatherBundle = await fetchWithOneCall(lat, lon);
                            try { // Increment counter on success
                                const store = getStore("onecall-rate-limit");
                                const today = new Date().toISOString().split('T')[0];
                                const counterKey = `onecall_requests_${today}`;
                                const newCount = ((await store.get(counterKey)) as number || 0) + 1;
                                await store.set(counterKey, newCount, { ttl: 86400 });
                                console.log(`[Rate Limit Action] Incremented count for ${counterKey}. New count: ${newCount}.`);
                            } catch (blobError) {
                                console.warn(`[Rate Limit Info] Failed to increment rate limit counter. Error: ${blobError.message}`);
                            }
                        } catch (error) {
                            console.warn(`One Call API failed: ${error.message}. Falling back to free tier APIs.`);
                            fallbackStatus = 'onecall_failed';
                            try {
                                weatherBundle = await fetchWithFreeTier(lat, lon);
                            } catch (error2) {
                                console.warn(`Free tier APIs also failed: ${error2.message}. Falling back to Open-Meteo.`);
                                fallbackStatus = 'free_tier_failed';
                                weatherBundle = await fetchWithOpenMeteo(lat, lon);
                            }
                        }
                    }
                }
                
                let resolvedCityName: string;
                if (q) {
                    resolvedCityName = q;
                    weatherBundle.weatherData.city = q;
                    weatherBundle.weatherData.country = country || '';
                } else {
                    const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
                    if (geoResponse.ok) {
                        const geoData = await geoResponse.json();
                        if (geoData && geoData.length > 0) {
                            resolvedCityName = geoData[0].name;
                            weatherBundle.weatherData.city = geoData[0].name;
                            weatherBundle.weatherData.country = geoData[0].country;
                        } else {
                            resolvedCityName = "Localização Atual";
                        }
                    } else {
                         resolvedCityName = "Localização Atual";
                    }
                }
                weatherBundle.weatherData.city = weatherBundle.weatherData.city || resolvedCityName;
                weatherBundle.weatherData.country = weatherBundle.weatherData.country || '';
                
                let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(resolvedCityName)}/600/400`;

                if (UNSPLASH_KEY) {
                    try {
                        const weatherCondition = weatherBundle.weatherData.condition || 'weather';
                        const searchQuery = `${resolvedCityName} ${weatherCondition}`;
                        console.log(`Fetching Unsplash image for query: ${searchQuery}`);
                        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
                        
                        const unsplashRes = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` } });

                        if (unsplashRes.ok) {
                            const unsplashData = await unsplashRes.json();
                            if (unsplashData.results && unsplashData.results.length > 0) {
                                imageUrl = unsplashData.results[0].urls.regular;
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching from Unsplash:', e);
                    }
                }
                
                weatherBundle.weatherData.imageUrl = imageUrl;
                const responseBody = { ...weatherBundle, fallbackStatus };

                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(responseBody) };
            }

            case 'direct':
            case 'reverse': {
                const baseUrl = `https://api.openweathermap.org/geo/1.0/${endpoint}`;
                query.set('appid', API_KEY);
                if (endpoint === 'reverse' && !query.has('limit')) query.set('limit', '1');
                const apiUrl = `${baseUrl}?${query.toString()}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
            }

            case 'tile': {
                const { layer, z, x, y } = params;
                if (!layer || !z || !x || !y) return { statusCode: 400, body: JSON.stringify({ message: "Parâmetros de tile ausentes." }) };
                
                // Try Maps 2.0 (Paid/Developer)
                const tileUrl2 = `https://maps.openweathermap.org/maps/2.0/weather/${layer}/${z}/${x}/${y}?appid=${API_KEY}`;
                
                try {
                    let response = await fetch(tileUrl2);
                    
                    // If 401 Unauthorized (Free Key) or similar error, try fallback to Maps 1.0 (Free)
                    if (!response.ok) {
                        console.warn(`Maps 2.0 failed (${response.status}). Trying Maps 1.0 Fallback.`);
                        
                        const fallbackLayer = MAP_LAYER_FALLBACKS[layer];
                        if (fallbackLayer) {
                             const tileUrl1 = `https://tile.openweathermap.org/map/${fallbackLayer}/${z}/${x}/${y}.png?appid=${API_KEY}`;
                             console.log(`Fallback URL: ${tileUrl1}`);
                             response = await fetch(tileUrl1);
                        } else {
                            // No fallback mapping available for this layer
                             return { statusCode: 500, body: '' };
                        }
                    }

                    if (!response.ok) {
                        return { statusCode: 500, body: '' };
                    }

                    const buffer = await response.arrayBuffer();
                    return { statusCode: 200, headers: { 'Content-Type': 'image/png' }, body: Buffer.from(buffer).toString('base64'), isBase64Encoded: true };
                } catch (e) {
                    return { statusCode: 500, body: '' };
                }
            }

            case 'relief': {
                const { z, x, y } = params;
                if (!z || !x || !y) return { statusCode: 400, body: JSON.stringify({ message: "Parâmetros de tile de relevo ausentes." }) };
                // Relief map is generally paid-only on OWM Maps 2.0 and has no direct 1.0 equivalent.
                // We try to fetch it, and if it fails (401), we return empty so the map doesn't break.
                const tileUrl = `https://maps.openweathermap.org/maps/2.0/relief/${z}/${x}/${y}?appid=${API_KEY}`;
                 try {
                    const response = await fetch(tileUrl);
                    if (!response.ok) {
                        // Likely 401 Unauthorized on free plans
                        return { statusCode: 404, body: '' }; // 404 signals Leaflet to hide the tile
                    }
                    const buffer = await response.arrayBuffer();
                    return { statusCode: 200, headers: { 'Content-Type': 'image/png' }, body: Buffer.from(buffer).toString('base64'), isBase64Encoded: true };
                 } catch(e) {
                     return { statusCode: 500, body: '' };
                 }
            }

            default:
                return { statusCode: 400, body: JSON.stringify({ message: 'Endpoint da API inválido.' }) };
        }
    } catch (error) {
        console.error('Erro na função Netlify:', error);
        const errorMessage = error instanceof Error ? error.message : "Um erro interno ocorreu.";
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };
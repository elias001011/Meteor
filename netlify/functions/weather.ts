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
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        hourly: 'temperature_2m,weather_code,precipitation_probability',
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

    const weatherData = {
        dt: new Date(current.time).getTime() / 1000,
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature,
        condition: mapWmoCodeToDescription(current.weather_code),
        conditionIcon: mapOpenMeteoCodeToEmoji(current.weather_code, current.is_day),
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
    
    const hourlyForecast = forecastApiData.hourly.time.slice(0, 8).map((time: string, index: number) => ({
        dt: new Date(time).getTime() / 1000,
        temperature: forecastApiData.hourly.temperature_2m[index],
        conditionIcon: mapOpenMeteoCodeToEmoji(forecastApiData.hourly.weather_code[index]),
        pop: forecastApiData.hourly.precipitation_probability[index] / 100,
    }));
    
    const dailyForecast = daily.time.map((time: string, index: number) => ({
        dt: new Date(time).getTime() / 1000,
        temperature: daily.temperature_2m_max[index],
        conditionIcon: mapOpenMeteoCodeToEmoji(daily.weather_code[index]),
        pop: daily.precipitation_probability_max[index] / 100,
    }));

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

    const hourlyForecast = onecallApiData.hourly.slice(0, 8).map((item: any) => ({
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
    console.log("Attempting to fetch data from Developer Tier APIs");
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const hourlyUrl = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const dailyUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&units=metric&lang=pt_br&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    const [weatherRes, hourlyRes, dailyRes, airPollutionRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(hourlyUrl),
        fetch(dailyUrl),
        fetch(airPollutionUrl)
    ]);

    if (!weatherRes.ok || !hourlyRes.ok || !dailyRes.ok) {
        const error = !weatherRes.ok ? await weatherRes.json() : (!hourlyRes.ok ? await hourlyRes.json() : await dailyRes.json());
        throw new Error(error.message || 'Falha ao buscar dados essenciais do clima.');
    }
    console.log("Successfully fetched data from Developer Tier APIs");

    const [weatherApiData, hourlyApiData, dailyApiData] = await Promise.all([ weatherRes.json(), hourlyRes.json(), dailyRes.json() ]);
    
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
    
    const hourlyForecast = hourlyApiData.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: item.main.temp,
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        pop: item.pop,
    }));
    
    const dailyForecast = dailyApiData.list.map((item: any) => ({
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
        alerts: [],
        dataSource: 'free' as const,
    };
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
                
                if (source === 'onecall') {
                    weatherBundle = await fetchWithOneCall(lat, lon);
                } else if (source === 'free') {
                    weatherBundle = await fetchWithFreeTier(lat, lon);
                } else if (source === 'open-meteo') {
                    weatherBundle = await fetchWithOpenMeteo(lat, lon);
                } else {
                    // AUTO MODE (default fallback behavior)
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
                            console.warn(`One Call API failed: ${error.message}. Falling back to developer tier APIs.`);
                            try {
                                weatherBundle = await fetchWithFreeTier(lat, lon);
                            } catch (error2) {
                                console.warn(`Developer tier APIs also failed: ${error2.message}. Falling back to Open-Meteo.`);
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

                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(weatherBundle) };
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
                const tileUrl = `https://maps.openweathermap.org/maps/2.0/weather/${layer}/${z}/${x}/${y}?appid=${API_KEY}`;
                const response = await fetch(tileUrl);
                if (!response.ok) throw new Error(`Erro ao buscar tile: ${response.statusText}`);
                const buffer = await response.arrayBuffer();
                return { statusCode: 200, headers: { 'Content-Type': 'image/png' }, body: Buffer.from(buffer).toString('base64'), isBase64Encoded: true };
            }

            case 'relief': {
                const { z, x, y } = params;
                if (!z || !x || !y) return { statusCode: 400, body: JSON.stringify({ message: "Parâmetros de tile de relevo ausentes." }) };
                const tileUrl = `https://maps.openweathermap.org/maps/2.0/relief/${z}/${x}/${y}?appid=${API_KEY}`;
                 const response = await fetch(tileUrl);
                if (!response.ok) throw new Error(`Erro ao buscar tile de relevo: ${response.statusText}`);
                const buffer = await response.arrayBuffer();
                return { statusCode: 200, headers: { 'Content-Type': 'image/png' }, body: Buffer.from(buffer).toString('base64'), isBase64Encoded: true };
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
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

                if (!lat || !lon) return { statusCode: 400, body: JSON.stringify({ message: "Latitude e longitude são obrigatórias." }) };
                
                let weatherBundle;
                let useFallbackDirectly = false;

                // --- Rate Limiting Logic ---
                try {
                    const store = getStore("onecall-rate-limit");
                    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                    const counterKey = `onecall_requests_${today}`;
                    
                    const currentCount = (await store.get(counterKey)) as number | null;
                    
                    console.log(`[Rate Limit Check] Key: ${counterKey}. Current count: ${currentCount || 0}/${ONE_CALL_DAILY_LIMIT}.`);

                    if (currentCount && currentCount >= ONE_CALL_DAILY_LIMIT) {
                        console.warn(`[Rate Limit Action] One Call API daily limit reached. Forcing fallback.`);
                        useFallbackDirectly = true;
                    }
                } catch (blobError) {
                    console.warn(`[Rate Limit Info] Netlify Blobs (KV Store) could not be accessed, rate limiting is disabled for this execution. This is expected in unlinked local development. Error: ${blobError.message}`);
                    // Proceed without rate limiting, will fallback if API itself fails
                }

                if (useFallbackDirectly) {
                    weatherBundle = await fetchWithFreeTier(lat, lon);
                } else {
                    try {
                        weatherBundle = await fetchWithOneCall(lat, lon);
                        // On success, try to increment the counter.
                        try {
                            const store = getStore("onecall-rate-limit");
                            const today = new Date().toISOString().split('T')[0];
                            const counterKey = `onecall_requests_${today}`;
                            const currentCount = (await store.get(counterKey)) as number | null;
                            const newCount = (currentCount || 0) + 1;
                            await store.set(counterKey, newCount, { ttl: 86400 }); // TTL of 24 hours
                            console.log(`[Rate Limit Action] Incremented count for ${counterKey}. New count: ${newCount}.`);
                        } catch (blobError) {
                             console.warn(`[Rate Limit Info] Failed to increment rate limit counter. Error: ${blobError.message}`);
                        }
                    } catch (error) {
                        console.warn(`One Call API failed: ${error.message}. Falling back to developer tier APIs.`);
                        weatherBundle = await fetchWithFreeTier(lat, lon);
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
                            weatherBundle.weatherData.city = "Localização Atual";
                            weatherBundle.weatherData.country = "";
                        }
                    } else {
                         resolvedCityName = "Localização Atual";
                         weatherBundle.weatherData.city = "Localização Atual";
                         weatherBundle.weatherData.country = "";
                    }
                }
                
                let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(resolvedCityName)}/600/400`;

                if (UNSPLASH_KEY) {
                    try {
                        const weatherCondition = weatherBundle.weatherData.condition || 'weather';
                        const searchQuery = `${resolvedCityName} ${weatherCondition}`;
                        console.log(`Fetching Unsplash image for query: ${searchQuery}`);
                        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
                        
                        const unsplashRes = await fetch(unsplashUrl, {
                            headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
                        });

                        if (unsplashRes.ok) {
                            const unsplashData = await unsplashRes.json();
                            if (unsplashData.results && unsplashData.results.length > 0) {
                                imageUrl = unsplashData.results[0].urls.regular;
                                console.log(`Unsplash image found: ${imageUrl}`);
                            } else {
                                console.warn(`No Unsplash results for ${searchQuery}. Using fallback.`);
                            }
                        } else {
                            console.warn(`Unsplash API failed with status: ${unsplashRes.status}. Using fallback image.`);
                        }
                    } catch (e) {
                        console.error('Error fetching from Unsplash:', e);
                    }
                } else {
                    console.log("UNSPLASH_ACESS_KEY not configured. Using fallback image.");
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
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'image/png' },
                    body: Buffer.from(buffer).toString('base64'),
                    isBase64Encoded: true,
                };
            }

            case 'relief': {
                const { z, x, y } = params;
                if (!z || !x || !y) return { statusCode: 400, body: JSON.stringify({ message: "Parâmetros de tile de relevo ausentes." }) };
                const tileUrl = `https://maps.openweathermap.org/maps/2.0/relief/${z}/${x}/${y}?appid=${API_KEY}`;
                 const response = await fetch(tileUrl);
                if (!response.ok) throw new Error(`Erro ao buscar tile de relevo: ${response.statusText}`);
                const buffer = await response.arrayBuffer();
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'image/png' },
                    body: Buffer.from(buffer).toString('base64'),
                    isBase64Encoded: true,
                };
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
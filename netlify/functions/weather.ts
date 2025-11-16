import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Buffer } from "buffer";

const API_KEY = process.env.CLIMA_API;

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
        temperature: Math.round(onecallApiData.current.temp),
        condition: onecallApiData.current.weather[0].description.charAt(0).toUpperCase() + onecallApiData.current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(onecallApiData.current.weather[0].icon),
        windSpeed: Math.round(onecallApiData.current.wind_speed * 3.6),
        humidity: onecallApiData.current.humidity,
        pressure: onecallApiData.current.pressure,
    };

    const hourlyForecast = onecallApiData.hourly.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    const dailyForecast = onecallApiData.daily.slice(0, 7).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp.max),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
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
        temperature: Math.round(weatherApiData.main.temp),
        condition: weatherApiData.weather[0].description.charAt(0).toUpperCase() + weatherApiData.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(weatherApiData.weather[0].icon),
        windSpeed: Math.round(weatherApiData.wind.speed * 3.6),
        humidity: weatherApiData.main.humidity,
        pressure: weatherApiData.main.pressure,
    };
    
    const hourlyForecast = hourlyApiData.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.main.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));
    
    const dailyForecast = dailyApiData.list.map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp.max),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
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
                if (!lat || !lon) return { statusCode: 400, body: JSON.stringify({ message: "Latitude e longitude são obrigatórias." }) };
                
                try {
                    const data = await fetchWithOneCall(lat, lon);
                    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
                } catch (error) {
                    console.warn(`One Call API failed: ${error.message}. Falling back to developer tier APIs.`);
                    const data = await fetchWithFreeTier(lat, lon);
                    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
                }
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
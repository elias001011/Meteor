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

const fetchFreeTierData = async (lat: string, lon: string) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    const [weatherRes, forecastRes, airPollutionRes] = await Promise.all([
        fetch(weatherUrl), fetch(forecastUrl), fetch(airPollutionUrl)
    ]);

    if (!weatherRes.ok || !forecastRes.ok || !airPollutionRes.ok) {
        const error = !weatherRes.ok ? await weatherRes.json() : !forecastRes.ok ? await forecastRes.json() : await airPollutionRes.json();
        throw new Error(error.message || 'Falha ao buscar dados de uma das APIs do clima.');
    }

    const [weatherApiData, forecastApiData, airPollutionApiData] = await Promise.all([
        weatherRes.json(), forecastRes.json(), airPollutionRes.json()
    ]);
    
    const weatherData = {
        dt: weatherApiData.dt,
        temperature: Math.round(weatherApiData.main.temp),
        condition: weatherApiData.weather[0].description.charAt(0).toUpperCase() + weatherApiData.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(weatherApiData.weather[0].icon),
        windSpeed: Math.round(weatherApiData.wind.speed * 3.6),
        humidity: weatherApiData.main.humidity,
        pressure: weatherApiData.main.pressure,
    };
    
    const hourlyForecast = forecastApiData.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.main.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));
    
    const dailyAggregates: { [key: string]: { temps: number[], icons: { [icon: string]: number }, dts: number[] } } = {};
    forecastApiData.list.forEach((item: any) => {
        const dayKey = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyAggregates[dayKey]) dailyAggregates[dayKey] = { temps: [], icons: {}, dts: [] };
        dailyAggregates[dayKey].temps.push(item.main.temp);
        dailyAggregates[dayKey].dts.push(item.dt);
        dailyAggregates[dayKey].icons[item.weather[0].icon] = (dailyAggregates[dayKey].icons[item.weather[0].icon] || 0) + 1;
    });

    const dailyForecast = Object.entries(dailyAggregates).slice(0, 5).map(([dayKey]) => {
        const mostFrequentIcon = Object.keys(dailyAggregates[dayKey].icons).reduce((a, b) => dailyAggregates[dayKey].icons[a] > dailyAggregates[dayKey].icons[b] ? a : b, '');
        return {
            dt: dailyAggregates[dayKey].dts[0], // Use the first dt for the day
            temperature: Math.round(Math.max(...dailyAggregates[dayKey].temps)),
            conditionIcon: mapOwmIconToEmoji(mostFrequentIcon),
        };
    });

    return {
        weatherData,
        airQualityData: { aqi: airPollutionApiData.list[0].main.aqi, components: airPollutionApiData.list[0].components },
        hourlyForecast,
        dailyForecast,
        alerts: [], // Alerts not available in free tier
    };
};

const fetchOneCallData = async (lat: string, lon: string) => {
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&exclude=minutely&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    const [oneCallRes, airPollutionRes] = await Promise.all([
        fetch(oneCallUrl), fetch(airPollutionUrl)
    ]);
    
    if (!oneCallRes.ok) {
        const error = await oneCallRes.json().catch(() => ({ message: 'One Call API request failed.' }));
        throw new Error(`[${oneCallRes.status}] ${error.message}`);
    }

    if (!airPollutionRes.ok) {
        console.warn("Could not fetch air pollution data. It will be omitted.");
    }
    
    const [oneCallApiData, airPollutionApiData] = await Promise.all([
        oneCallRes.json(),
        airPollutionRes.ok ? airPollutionRes.json() : Promise.resolve(null)
    ]);

    const weatherData = {
        dt: oneCallApiData.current.dt,
        temperature: Math.round(oneCallApiData.current.temp),
        condition: oneCallApiData.current.weather[0].description.charAt(0).toUpperCase() + oneCallApiData.current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(oneCallApiData.current.weather[0].icon),
        windSpeed: Math.round(oneCallApiData.current.wind_speed * 3.6),
        humidity: oneCallApiData.current.humidity,
        pressure: oneCallApiData.current.pressure,
    };
    
    const hourlyForecast = oneCallApiData.hourly.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    const dailyForecast = oneCallApiData.daily.slice(0, 5).map((item: any) => ({
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
        alerts: oneCallApiData.alerts || [],
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
                    console.log("Attempting to fetch data from One Call API 3.0");
                    const oneCallData = await fetchOneCallData(lat, lon);
                    console.log("Successfully fetched data from One Call API 3.0");
                    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oneCallData) };
                } catch (error) {
                    console.warn(`One Call API failed: ${error.message}. Falling back to free tier APIs.`);
                    
                    console.log("Attempting to fetch data from Free Tier APIs");
                    const freeTierData = await fetchFreeTierData(lat, lon);
                    console.log("Successfully fetched data from Free Tier APIs");
                    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(freeTierData) };
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
                const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${API_KEY}`;
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
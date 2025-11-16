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

const fetchOneCallV3 = async (lat: string, lon: string) => {
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&lang=pt_br&appid=${API_KEY}`;
    const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [oneCallRes, airPollutionRes] = await Promise.all([
        fetch(oneCallUrl),
        fetch(airPollutionUrl)
    ]);

    if (!oneCallRes.ok) {
        const error = await oneCallRes.json().catch(() => ({ message: 'Falha ao buscar dados da API One Call 3.0.' }));
        console.error("One Call 3.0 API Error:", error);
        throw new Error(error.message || 'Falha ao buscar dados da API One Call 3.0.');
    }
    if (!airPollutionRes.ok) {
        const error = await airPollutionRes.json().catch(() => ({ message: 'Falha ao buscar dados de qualidade do ar.' }));
        console.error("Air Pollution API Error:", error);
        throw new Error(error.message || 'Falha ao buscar dados de qualidade do ar.');
    }

    const [oneCallData, airPollutionData] = await Promise.all([oneCallRes.json(), airPollutionRes.json()]);
    
    const weatherData = {
        dt: oneCallData.current.dt,
        temperature: Math.round(oneCallData.current.temp),
        condition: oneCallData.current.weather[0].description.charAt(0).toUpperCase() + oneCallData.current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(oneCallData.current.weather[0].icon),
        windSpeed: Math.round(oneCallData.current.wind_speed * 3.6),
        humidity: oneCallData.current.humidity,
        pressure: oneCallData.current.pressure,
    };
    
    const hourlyForecast = oneCallData.hourly.slice(1, 9).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));
    
    const dailyForecast = oneCallData.daily.slice(0, 5).map((item: any) => ({
        dt: item.dt,
        temperature: Math.round(item.temp.max),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    return {
        weatherData,
        airQualityData: { aqi: airPollutionData.list[0].main.aqi, components: airPollutionData.list[0].components },
        hourlyForecast,
        dailyForecast,
        alerts: oneCallData.alerts || [],
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

                const allData = await fetchOneCallV3(lat, lon);
                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allData) };
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
        if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.includes("401")) {
            return { statusCode: 401, body: JSON.stringify({ message: "Erro de autenticação. Verifique se sua chave CLIMA_API é válida, está configurada no Netlify e tem permissão para a API One Call 3.0." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };
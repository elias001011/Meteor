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

const processForecastData = (forecastList: any[]) => {
    const hourly = forecastList.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.main.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    const dailyAggregates: { [key: string]: { temps: number[], icons: { [icon: string]: number } } } = {};
    forecastList.forEach((item: any) => {
        const dayKey = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyAggregates[dayKey]) {
            dailyAggregates[dayKey] = { temps: [], icons: {} };
        }
        dailyAggregates[dayKey].temps.push(item.main.temp);
        const icon = item.weather[0].icon;
        dailyAggregates[dayKey].icons[icon] = (dailyAggregates[dayKey].icons[icon] || 0) + 1;
    });

    const daily = Object.entries(dailyAggregates).slice(0, 5).map(([dayKey, data], index) => {
        const date = new Date(dayKey + 'T12:00:00Z');
        let dayLabel: string;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date.setHours(0, 0, 0, 0) === today.getTime()) {
            dayLabel = 'Hoje';
        } else {
            dayLabel = new Date(dayKey + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short' });
            dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
        }

        const mostFrequentIcon = Object.keys(data.icons).reduce((a, b) => data.icons[a] > data.icons[b] ? a : b, '');

        return {
            day: dayLabel,
            temperature: Math.round(Math.max(...data.temps)),
            conditionIcon: mapOwmIconToEmoji(mostFrequentIcon),
        };
    });

    return { hourlyForecast: hourly, dailyForecast: daily };
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
                    temperature: Math.round(weatherApiData.main.temp),
                    condition: weatherApiData.weather[0].description.charAt(0).toUpperCase() + weatherApiData.weather[0].description.slice(1),
                    conditionIcon: mapOwmIconToEmoji(weatherApiData.weather[0].icon),
                    windSpeed: Math.round(weatherApiData.wind.speed * 3.6),
                    humidity: weatherApiData.main.humidity,
                    pressure: weatherApiData.main.pressure,
                };
                
                const airQualityData = {
                    aqi: airPollutionApiData.list[0].main.aqi,
                    components: airPollutionApiData.list[0].components
                };
                
                const { hourlyForecast, dailyForecast } = processForecastData(forecastApiData.list);

                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weatherData, airQualityData, hourlyForecast, dailyForecast, alerts: [], timezone: weatherApiData.timezone }),
                };
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
            return { statusCode: 401, body: JSON.stringify({ message: "Erro de autenticação. Verifique se sua chave CLIMA_API é válida e está corretamente configurada no Netlify." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };
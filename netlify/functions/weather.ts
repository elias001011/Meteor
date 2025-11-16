import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
// FIX: Explicitly import Buffer to resolve TypeScript error in Netlify environment.
import { Buffer } from "buffer";

const API_KEY = process.env.CLIMA_API;

// Helper to map OWM icon codes to emojis - Centralized here
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: "API key para clima não configurada no servidor." }) };
    }

    const { endpoint, ...params } = event.queryStringParameters;
    const query = new URLSearchParams(params as Record<string, string>);
    query.set('appid', API_KEY);

    try {
        switch (endpoint) {
            case 'onecall': {
                const lat = params.lat;
                const lon = params.lon;
                if (!lat || !lon) return { statusCode: 400, body: JSON.stringify({ message: "Latitude e longitude são obrigatórias." }) };

                // Fetch weather and air pollution data in parallel
                const onecallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&lang=pt_br&appid=${API_KEY}`;
                const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
                
                const [onecallRes, airPollutionRes] = await Promise.all([
                    fetch(onecallUrl),
                    fetch(airPollutionUrl)
                ]);

                if (!onecallRes.ok) throw new Error(`Erro na API OneCall: ${onecallRes.statusText}`);
                if (!airPollutionRes.ok) throw new Error(`Erro na API Air Pollution: ${airPollutionRes.statusText}`);

                const onecallData = await onecallRes.json();
                const airPollutionData = await airPollutionRes.json();

                // Process and combine data
                const weatherData = {
                    temperature: Math.round(onecallData.current.temp),
                    condition: onecallData.current.weather[0].description.charAt(0).toUpperCase() + onecallData.current.weather[0].description.slice(1),
                    conditionIcon: mapOwmIconToEmoji(onecallData.current.weather[0].icon),
                    windSpeed: Math.round(onecallData.current.wind_speed * 3.6),
                    humidity: onecallData.current.humidity,
                    pressure: onecallData.current.pressure,
                };
                
                const airQualityData = {
                    aqi: airPollutionData.list[0].main.aqi,
                    components: airPollutionData.list[0].components
                };
                
                const hourlyForecast = onecallData.hourly.slice(1, 9).map((item: any) => ({
                    time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    temperature: Math.round(item.temp),
                    conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
                }));

                const dailyForecast = onecallData.daily.slice(0, 5).map((item: any, index: number) => {
                    let dayLabel = new Date(item.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' });
                    if (index === 0) dayLabel = 'Hoje';
                    else dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
                    return {
                        day: dayLabel,
                        temperature: Math.round(item.temp.max),
                        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
                    };
                });
                
                const alerts = (onecallData.alerts || []).map((alert: any) => ({
                    event: alert.event,
                    description: alert.description,
                    sender_name: alert.sender_name,
                }));

                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weatherData, airQualityData, hourlyForecast, dailyForecast, alerts }),
                };
            }

            case 'direct':
            case 'reverse': {
                const baseUrl = `https://api.openweathermap.org/geo/1.0/${endpoint}`;
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
        // Custom error for auth issues
        if (errorMessage.includes("401")) {
            return { statusCode: 401, body: JSON.stringify({ message: "Erro de autenticação. Sua chave CLIMA_API pode ser inválida ou não estar ativa para o serviço solicitado." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };

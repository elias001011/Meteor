import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const API_KEY = process.env.CLIMA_API;
const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// Helper to map OWM icon codes to emojis
const mapOwmIconToEmoji = (icon: string): string => {
    const iconMap: { [key: string]: string } = {
        '01d': '☀️', '01n': '🌙',
        '02d': '🌤️', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '🌥️', '04n': '🌥️',
        '09d': '🌦️', '09n': '🌦️',
        '10d': '🌧️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[icon] || '-';
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key para clima não configurada no servidor." }),
        };
    }

    const { lat, lon, city, name: cityName, country: cityCountry } = event.queryStringParameters;
    const authErrorMessage = "Erro de autenticação. Verifique se a sua chave CLIMA_API é válida e está configurada corretamente no Netlify.";

    try {
        if (city) {
            // Geocoding request
            const response = await fetch(`${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=5&appid=${API_KEY}`);
            
            if (response.status === 401) {
                return { statusCode: 401, body: JSON.stringify({ error: authErrorMessage }) };
            }
            if (!response.ok) {
                 return { statusCode: response.status, body: JSON.stringify({ error: 'Cidade não encontrada.' }) };
            }
            const data = await response.json();
            
            const results = data.map((item: any) => ({
                name: item.name,
                country: item.country,
                state: item.state,
                lat: item.lat,
                lon: item.lon,
            }));

            return {
                statusCode: 200,
                body: JSON.stringify(results),
            };

        } else if (lat && lon) {
            // Weather data request using One Call API
            const fetches = [
                fetch(`${ONE_CALL_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br&exclude=minutely`),
                fetch(`${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
            ];

            // Only do reverse geocoding if name is not provided
            if (!cityName) {
                fetches.push(fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`));
            }

            const responses = await Promise.all(fetches);
            const [oneCallResponse, airQualityResponse, reverseGeoResponse] = responses;

            if (oneCallResponse.status === 401 || airQualityResponse.status === 401 || (reverseGeoResponse && reverseGeoResponse.status === 401)) {
                return { statusCode: 401, body: JSON.stringify({ error: authErrorMessage }) };
            }

            if (!oneCallResponse.ok) {
                return { statusCode: oneCallResponse.status, body: JSON.stringify({ error: 'Falha ao buscar previsão do tempo.' }) };
            }
            if (!airQualityResponse.ok) {
                return { statusCode: airQualityResponse.status, body: JSON.stringify({ error: 'Falha ao buscar qualidade do ar.' }) };
            }
             if (reverseGeoResponse && !reverseGeoResponse.ok) {
                // This is not critical, we can proceed without a name
                console.warn("Reverse geocoding failed.");
            }

            const oneCallData = await oneCallResponse.json();
            const airQualityData = await airQualityResponse.json();
            const reverseGeoData = reverseGeoResponse ? await reverseGeoResponse.json().catch(() => null) : null;
            
            // --- Transform data ---
            const locationName = cityName || reverseGeoData?.[0]?.name || 'Localização Desconhecida';
            const countryName = cityCountry || reverseGeoData?.[0]?.country || '';

            // Current Weather
            const current = oneCallData.current;
            const weatherData = {
                city: locationName,
                country: countryName,
                date: new Date(current.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
                temperature: Math.round(current.temp),
                condition: current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1),
                conditionIcon: mapOwmIconToEmoji(current.weather[0].icon),
                windSpeed: Math.round(current.wind_speed * 3.6), // m/s to km/h
                humidity: current.humidity,
                pressure: current.pressure,
            };
            
            // Air Quality
            const aqiValue = airQualityData.list[0].main.aqi;
            const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
            const mappedAqi = aqiMap[aqiValue as keyof typeof aqiMap] || 0;
            const aqiResult = { aqi: mappedAqi };

            // Hourly Forecast (next 8 hours)
            const hourlyForecast = oneCallData.hourly.slice(1, 9).map((item: any) => ({
                time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                temperature: Math.round(item.temp),
                conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
            }));

            // Daily Forecast (next 5 days)
            const dailyForecast = oneCallData.daily.slice(1, 6).map((item: any) => {
                const date = new Date(item.dt * 1000);
                const today = new Date();
                const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                
                let dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                if (isToday) {
                    dayLabel = 'Hoje';
                } else {
                    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
                }

                return {
                    day: dayLabel,
                    temperature: Math.round(item.temp.max),
                    conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
                }
            });

            // Alerts
            const alerts = (oneCallData.alerts || []).map((alert: any) => ({
                event: alert.event,
                description: alert.description,
                sender_name: alert.sender_name,
            }));

            return {
                statusCode: 200,
                body: JSON.stringify({ weatherData, airQualityData: aqiResult, hourlyForecast, dailyForecast, alerts }),
            };

        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Parâmetros inválidos. Forneça "city" ou "lat" e "lon".' }),
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : "Um erro interno ocorreu." }),
        };
    }
};

export { handler };
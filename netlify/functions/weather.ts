import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const API_KEY = process.env.CLIMA_API;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key para clima não configurada no servidor." }),
        };
    }

    const { lat, lon, city } = event.queryStringParameters;
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
            // Weather data request
            const [forecastResponse, airQualityResponse] = await Promise.all([
                fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`),
                fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
            ]);
            
            if (forecastResponse.status === 401 || airQualityResponse.status === 401) {
                return { statusCode: 401, body: JSON.stringify({ error: authErrorMessage }) };
            }

            if (!forecastResponse.ok) {
                return { statusCode: forecastResponse.status, body: JSON.stringify({ error: 'Falha ao buscar previsão do tempo.' }) };
            }
            if (!airQualityResponse.ok) {
                return { statusCode: airQualityResponse.status, body: JSON.stringify({ error: 'Falha ao buscar qualidade do ar.' }) };
            }

            const forecastData = await forecastResponse.json();
            const airQualityData = await airQualityResponse.json();
            
            return {
                statusCode: 200,
                body: JSON.stringify({ forecastData, airQualityData }),
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
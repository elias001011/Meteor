import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const API_KEY = process.env.CLIMA_API;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key para clima não configurada." }),
        };
    }

    const { lat, lon, city } = event.queryStringParameters;

    try {
        if (city) {
            // Geocoding request
            const response = await fetch(`${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`);
            if (!response.ok) {
                 return { statusCode: response.status, body: JSON.stringify({ error: 'Cidade não encontrada.' }) };
            }
            const data = await response.json();
            if (data.length === 0) {
                 return { statusCode: 404, body: JSON.stringify({ error: 'Cidade não encontrada.' }) };
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ lat: data[0].lat, lon: data[0].lon }),
            };
        } else if (lat && lon) {
            // Weather data request
            const [forecastResponse, airQualityResponse] = await Promise.all([
                fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`),
                fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
            ]);

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

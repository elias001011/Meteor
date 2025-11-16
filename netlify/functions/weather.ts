import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const API_KEY = process.env.CLIMA_API;
const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
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
            // Weather data request using One Call API
            const [oneCallResponse, airQualityResponse, reverseGeoResponse] = await Promise.all([
                fetch(`${ONE_CALL_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br&exclude=minutely`),
                fetch(`${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
                fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`)
            ]);
            
            if (oneCallResponse.status === 401 || airQualityResponse.status === 401 || reverseGeoResponse.status === 401) {
                return { statusCode: 401, body: JSON.stringify({ error: authErrorMessage }) };
            }

            if (!oneCallResponse.ok) {
                return { statusCode: oneCallResponse.status, body: JSON.stringify({ error: 'Falha ao buscar previsão do tempo.' }) };
            }
            if (!airQualityResponse.ok) {
                return { statusCode: airQualityResponse.status, body: JSON.stringify({ error: 'Falha ao buscar qualidade do ar.' }) };
            }
             if (!reverseGeoResponse.ok) {
                // This is not critical, we can proceed without a name
                console.warn("Reverse geocoding failed.");
            }

            const oneCallData = await oneCallResponse.json();
            const airQualityData = await airQualityResponse.json();
            const reverseGeoData = await reverseGeoResponse.json().catch(() => null);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ oneCallData, airQualityData, reverseGeoData }),
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
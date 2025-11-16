import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const API_KEY = process.env.CLIMA_API;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "API key para clima não configurada no servidor." }),
        };
    }

    const { endpoint, ...params } = event.queryStringParameters;
    
    // Create a new URLSearchParams object, filtering out null/undefined values
    const validParams: Record<string, string> = {};
    for (const key in params) {
        if (params[key] != null) {
            validParams[key] = params[key] as string;
        }
    }
    const query = new URLSearchParams(validParams);
    query.set('appid', API_KEY);
    
    let baseUrl = '';

    switch (endpoint) {
        case 'weather':
        case 'forecast':
        case 'air_pollution':
            baseUrl = `https://api.openweathermap.org/data/2.5/${endpoint}`;
            query.set('units', 'metric');
            query.set('lang', 'pt_br');
            break;
        case 'direct':
        case 'reverse':
            baseUrl = `https://api.openweathermap.org/geo/1.0/${endpoint}`;
            if (!query.has('limit')) {
                query.set('limit', '1');
            }
            break;
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Endpoint da API inválido.' }),
            };
    }
    
    const apiUrl = `${baseUrl}?${query.toString()}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            // Forward the error message from OWM
            return {
                statusCode: response.status,
                body: JSON.stringify({ 
                    message: data.message || `Falha ao buscar dados do endpoint '${endpoint}'.`,
                    owm_error: data 
                }),
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Erro na função Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error instanceof Error ? error.message : "Um erro interno ocorreu." }),
        };
    }
};

export { handler };
import type { AllWeatherData, CitySearchResult, DataSource } from '../types';

const CACHE_DURATION_MS = 50 * 60 * 1_000;
const MAX_STALE_CACHE_MS = 12 * 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 14_000;

interface StoredWeatherData {
    timestamp: number;
    data: AllWeatherData;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getStorage = (): Storage | null => {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
};

const readCachedWeather = (cacheKey: string): StoredWeatherData | null => {
    try {
        const serialized = getStorage()?.getItem(cacheKey);
        if (!serialized) return null;
        const parsed: unknown = JSON.parse(serialized);
        if (!isRecord(parsed) || typeof parsed.timestamp !== 'number' || !isRecord(parsed.data)) return null;
        if (!isRecord(parsed.data.weatherData) || !Array.isArray(parsed.data.hourlyForecast) || !Array.isArray(parsed.data.dailyForecast)) return null;
        return parsed as unknown as StoredWeatherData;
    } catch {
        return null;
    }
};

const writeCachedWeather = (cacheKey: string, data: AllWeatherData): void => {
    try {
        getStorage()?.setItem(cacheKey, JSON.stringify({ timestamp: data.lastUpdated, data } satisfies StoredWeatherData));
    } catch {
        // Storage can be unavailable or full; weather remains usable without it.
    }
};

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    const payload: unknown = await response.json().catch(() => null);
    return isRecord(payload) && typeof payload.message === 'string' && payload.message.trim()
        ? payload.message
        : fallback;
};

const fetchWithClientTimeout = async (url: string): Promise<Response> => {
    try {
        return await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    } catch (error) {
        if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            throw new Error('O serviço de clima demorou para responder. Tente novamente.');
        }
        throw new Error('Não foi possível conectar ao serviço de clima.');
    }
};

const normalizeCoordinate = (value: number, min: number, max: number, label: string): number => {
    if (!Number.isFinite(value) || value < min || value > max) {
        throw new Error(`${label} inválida.`);
    }
    return value;
};

// Fetches a list of cities matching the query from our secure Netlify function.
export const searchCities = async (city: string): Promise<CitySearchResult[]> => {
    const query = city.trim().slice(0, 120);
    if (query.length < 2) return [];

    const params = new URLSearchParams({ endpoint: 'direct', q: query, limit: '5' });
    const response = await fetchWithClientTimeout(`/.netlify/functions/weather?${params.toString()}`);
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'Não foi possível buscar cidades.'));
    }

    const data: unknown = await response.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('O serviço de cidades retornou uma resposta inválida.');

    return data.slice(0, 10).map((item): CitySearchResult | null => {
        if (!isRecord(item) || typeof item.name !== 'string' || typeof item.country !== 'string') return null;
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return null;
        return {
            name: item.name,
            country: item.country,
            state: typeof item.state === 'string' ? item.state : undefined,
            lat: item.lat,
            lon: item.lon,
        };
    }).filter((item): item is CitySearchResult => item !== null);
};

// Main function to fetch all weather-related data via the secure BFF.
export const fetchAllWeatherData = async (
    lat: number,
    lon: number,
    cityInfo?: { name: string; country: string },
    source?: DataSource | 'auto'
): Promise<AllWeatherData> => {
    const safeLat = normalizeCoordinate(lat, -90, 90, 'Latitude');
    const safeLon = normalizeCoordinate(lon, -180, 180, 'Longitude');
    const effectiveSource = source || 'auto';
    const cacheKey = `weather_data_${effectiveSource}_${safeLat.toFixed(4)}_${safeLon.toFixed(4)}`;
    const cached = readCachedWeather(cacheKey);
    const cacheAge = cached ? Date.now() - cached.timestamp : Number.POSITIVE_INFINITY;

    if (cached && cacheAge < CACHE_DURATION_MS) return cached.data;

    const params = new URLSearchParams({
        endpoint: 'all',
        lat: String(safeLat),
        lon: String(safeLon),
        units: 'metric',
        source: effectiveSource,
    });
    if (cityInfo) {
        const name = cityInfo.name.trim().slice(0, 120);
        const country = cityInfo.country.trim().slice(0, 8);
        if (name) params.set('q', name);
        if (country) params.set('country', country);
    }

    try {
        const response = await fetchWithClientTimeout(`/.netlify/functions/weather?${params.toString()}`);
        if (!response.ok) {
            throw new Error(await parseErrorMessage(response, 'Falha ao buscar dados do clima.'));
        }

        const data: unknown = await response.json().catch(() => null);
        if (
            !isRecord(data)
            || !isRecord(data.weatherData)
            || !Array.isArray(data.hourlyForecast)
            || !Array.isArray(data.dailyForecast)
            || !Array.isArray(data.alerts)
            || !['onecall', 'free', 'open-meteo'].includes(String(data.dataSource))
        ) {
            throw new Error('O serviço de clima retornou uma resposta inválida.');
        }

        const finalData = { ...data, lastUpdated: Date.now() } as unknown as AllWeatherData;
        writeCachedWeather(cacheKey, finalData);
        return finalData;
    } catch (error) {
        // A bounded stale response is better than an empty dashboard while the
        // upstream provider is briefly unavailable. lastUpdated remains intact
        // so the UI can accurately show the data age.
        if (cached && cacheAge < MAX_STALE_CACHE_MS) return cached.data;
        throw error;
    }
};

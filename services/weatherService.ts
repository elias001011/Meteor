import type { AllWeatherData, CitySearchResult, DataSource } from '../types';

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache

// Fetches a list of cities matching the query from our secure Netlify function
export const searchCities = async (city: string): Promise<CitySearchResult[]> => {
    const response = await fetch(`/.netlify/functions/weather?endpoint=direct&q=${encodeURIComponent(city)}&limit=5`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Cidade não encontrada.' }));
        throw new Error(errorData.message || 'Cidade não encontrada.');
    }
    const data = await response.json();
    return data.map((item: any) => ({
        name: item.name,
        country: item.country,
        state: item.state,
        lat: item.lat,
        lon: item.lon,
    }));
};

// Main function to fetch all weather-related data via our secure BFF Netlify function
export const fetchAllWeatherData = async (
    lat: number, 
    lon: number, 
    cityInfo?: { name: string, country: string },
    source?: DataSource | 'auto'
): Promise<AllWeatherData> => {
    const effectiveSource = source || 'auto';
    const cacheKey = `weather_data_${effectiveSource}_${lat.toFixed(4)}_${lon.toFixed(4)}`;

    // 1. Try to get data from cache
    try {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                return data as AllWeatherData; // Return fresh cached data
            }
        }
    } catch (error) {
        console.warn("Could not read from cache. Fetching new data.", error);
    }
    
    // 2. If no cache or cache is stale, fetch from the network
    const params = new URLSearchParams({ 
        endpoint: 'all', 
        lat: lat.toString(), 
        lon: lon.toString() 
    });

    if (cityInfo) {
        params.set('q', cityInfo.name);
        params.set('country', cityInfo.country);
    }

    if (source && source !== 'auto') {
        params.set('source', source);
    }

    const response = await fetch(`/.netlify/functions/weather?${params.toString()}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao buscar dados do clima.' }));
        throw new Error(errorData.message || 'Falha ao buscar dados do clima.');
    }
    
    const dataFromApi: Omit<AllWeatherData, 'lastUpdated'> = await response.json();

    const finalData: AllWeatherData = {
        ...dataFromApi,
        lastUpdated: Date.now(),
    };

    // 3. Save the newly fetched data to cache
    try {
        const itemToCache = {
            timestamp: finalData.lastUpdated,
            data: finalData
        };
        localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
    } catch (error) {
        console.warn("Could not write to cache.", error);
    }

    return finalData;
};
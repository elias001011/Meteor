import type { AllWeatherData, CitySearchResult } from '../types';

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache

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
export const fetchAllWeatherData = async (lat: number, lon: number, cityInfo?: { name: string, country: string }): Promise<AllWeatherData> => {
    const cacheKey = `weather_data_${lat.toFixed(4)}_${lon.toFixed(4)}`;

    // 1. Try to get data from cache
    try {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                console.log(`Returning cached weather data for ${data.weatherData.city || cacheKey}`);
                return data; // Return fresh cached data
            }
        }
    } catch (error) {
        console.warn("Could not read from cache. Fetching new data.", error);
    }
    
    console.log(`Fetching new weather data for lat:${lat}, lon:${lon}`);

    // 2. If no cache or cache is stale, fetch from the network
    const params = new URLSearchParams({ 
        endpoint: 'all', 
        lat: lat.toString(), 
        lon: lon.toString() 
    });

    const response = await fetch(`/.netlify/functions/weather?${params.toString()}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao buscar dados do clima.' }));
        throw new Error(errorData.message || 'Falha ao buscar dados do clima.');
    }
    
    const data: AllWeatherData = await response.json();

    const locationName = cityInfo?.name || 'Localização Atual';
    const countryName = cityInfo?.country || '';

    // If cityInfo is not provided by the search, perform a reverse lookup for geolocation
    if (!cityInfo) {
        try {
            const geoResponse = await fetch(`/.netlify/functions/weather?endpoint=reverse&lat=${lat}&lon=${lon}`);
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if(geoData.length > 0) {
                    data.weatherData.city = geoData[0].name;
                    data.weatherData.country = geoData[0].country;
                } else {
                    data.weatherData.city = locationName;
                    data.weatherData.country = countryName;
                }
            } else {
                 data.weatherData.city = locationName;
                 data.weatherData.country = countryName;
            }
        } catch (e) {
            console.warn("Reverse geocoding failed, using default name.", e);
            data.weatherData.city = locationName;
            data.weatherData.country = countryName;
        }
    } else {
        data.weatherData.city = locationName;
        data.weatherData.country = countryName;
    }

    const finalData = {
        weatherData: data.weatherData,
        airQualityData: data.airQualityData,
        hourlyForecast: data.hourlyForecast,
        dailyForecast: data.dailyForecast,
        alerts: data.alerts,
        dataSource: data.dataSource,
    };

    // 3. Save the newly fetched data to cache
    try {
        const itemToCache = {
            timestamp: Date.now(),
            data: finalData
        };
        localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
    } catch (error) {
        console.warn("Could not write to cache.", error);
    }

    return finalData;
};
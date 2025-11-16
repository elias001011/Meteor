import type { WeatherData, AirQualityData, HourlyForecast, DailyForecast, WeatherAlert, CitySearchResult } from '../types';

// Fetches a list of cities matching the query from our secure Netlify function
export const searchCities = async (city: string): Promise<CitySearchResult[]> => {
    const response = await fetch(`/.netlify/functions/weather?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Cidade não encontrada.' }));
        throw new Error(errorData.error || 'Cidade não encontrada.');
    }
    return await response.json();
};

// Main function to fetch all weather-related data via our secure Netlify function
export const fetchAllWeatherData = async (lat: number, lon: number, cityInfo?: { name: string, country: string }) => {
    let url = `/.netlify/functions/weather?lat=${lat}&lon=${lon}`;
    if (cityInfo) {
        url += `&name=${encodeURIComponent(cityInfo.name)}&country=${encodeURIComponent(cityInfo.country)}`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao buscar dados do clima.' }));
        throw new Error(errorData.error || 'Falha ao buscar dados do clima.');
    }
    
    // The Netlify function now returns the data in the exact format needed by the frontend.
    return await response.json();
};
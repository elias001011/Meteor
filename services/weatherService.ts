import type { WeatherData, AirQualityData, HourlyForecast, DailyForecast, CitySearchResult } from '../types';

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
export const fetchAllWeatherData = async (lat: number, lon: number, cityInfo?: { name: string, country: string }) => {
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
    
    const data = await response.json();

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
    
    // Add formatted date to weather data
    const now = new Date();
    now.toLocaleString('pt-BR', { timeZone: data.timezone }); // Adjust to city's timezone if available
    data.weatherData.date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return {
        weatherData: data.weatherData,
        airQualityData: data.airQualityData,
        hourlyForecast: data.hourlyForecast,
        dailyForecast: data.dailyForecast,
        alerts: data.alerts // Will be an empty array
    };
};
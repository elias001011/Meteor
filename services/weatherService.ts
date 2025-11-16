import type { WeatherData, AirQualityData, HourlyForecast, DailyForecast, WeatherAlert, CitySearchResult } from '../types';

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

// Main function to fetch all weather-related data via our secure Netlify function
export const fetchAllWeatherData = async (lat: number, lon: number, cityInfo?: { name: string, country: string }) => {
    const endpoints: string[] = [
        'weather',
        'forecast',
        'air_pollution'
    ];
    
    // Only fetch reverse geocoding if we don't have city info
    if (!cityInfo) {
        endpoints.push('reverse');
    }

    const requests = endpoints.map(endpoint => {
        const params = new URLSearchParams({ endpoint, lat: lat.toString(), lon: lon.toString() });
        return fetch(`/.netlify/functions/weather?${params.toString()}`);
    });

    const responses = await Promise.all(requests);
    const failedResponse = responses.find(res => !res.ok);
    if (failedResponse) {
        const errorData = await failedResponse.json().catch(() => ({ message: 'Falha ao buscar dados do clima.' }));
        // Provide a more user-friendly message for authentication errors
        if (failedResponse.status === 401) {
             throw new Error("Erro de autenticação. Verifique se a sua chave CLIMA_API é válida e está configurada corretamente no Netlify.");
        }
        throw new Error(errorData.message || 'Falha ao buscar dados do clima.');
    }
    
    const jsonPromises = responses.map(res => res.json());
    const [weatherRes, forecastRes, airPollutionRes, reverseGeoRes] = await Promise.all(jsonPromises);
    
    const locationName = cityInfo?.name || (reverseGeoRes && reverseGeoRes[0]?.name) || 'Localização Desconhecida';
    const countryName = cityInfo?.country || (reverseGeoRes && reverseGeoRes[0]?.country) || '';

    // 1. Process Current Weather
    const weatherData: WeatherData = {
        city: locationName,
        country: countryName,
        date: new Date(weatherRes.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        temperature: Math.round(weatherRes.main.temp),
        condition: weatherRes.weather[0].description.charAt(0).toUpperCase() + weatherRes.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(weatherRes.weather[0].icon),
        windSpeed: Math.round(weatherRes.wind.speed * 3.6), // m/s to km/h
        humidity: weatherRes.main.humidity,
        pressure: weatherRes.main.pressure,
    };

    // 2. Process Air Quality
    const aqiValue = airPollutionRes.list[0].main.aqi;
    const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
    const mappedAqi = aqiMap[aqiValue as keyof typeof aqiMap] || 0;
    const airQualityData: AirQualityData = { aqi: mappedAqi };

    // 3. Process Hourly Forecast
    const hourlyForecast: HourlyForecast[] = forecastRes.list.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.main.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    // 4. Process Daily Forecast
    const dailyForecastsMap = new Map<string, { temps: number[], icons: string[] }>();
    forecastRes.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecastsMap.has(date)) {
            dailyForecastsMap.set(date, { temps: [], icons: [] });
        }
        dailyForecastsMap.get(date)!.temps.push(item.main.temp);
        dailyForecastsMap.get(date)!.icons.push(item.weather[0].icon);
    });

    const dailyForecast: DailyForecast[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Slice to get the next 5 days including today
    Array.from(dailyForecastsMap.entries()).slice(0, 5).forEach(([dateStr, data]) => {
        const date = new Date(dateStr + 'T12:00:00Z'); // Use noon to avoid timezone issues
        const itemDate = new Date(date);
        itemDate.setHours(0,0,0,0);
        
        let dayLabel: string;
        if (itemDate.getTime() === today.getTime()) {
            dayLabel = 'Hoje';
        } else {
            dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
        }

        // Get max temperature for the day
        const maxTemp = Math.round(Math.max(...data.temps));
        // Get the icon that appears most frequently around noon for that day
        const icon = data.icons[Math.floor(data.icons.length / 2)] || data.icons[0];

        dailyForecast.push({
            day: dayLabel,
            temperature: maxTemp,
            conditionIcon: mapOwmIconToEmoji(icon),
        });
    });

    // 5. Alerts - No longer available with this API setup
    const alerts: WeatherAlert[] = [];

    return { weatherData, airQualityData, hourlyForecast, dailyForecast, alerts };
};
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
    const response = await fetch(`/.netlify/functions/weather?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Cidade não encontrada.' }));
        throw new Error(errorData.error || 'Cidade não encontrada.');
    }
    return await response.json();
};

// Main function to fetch all weather-related data via our secure Netlify function
export const fetchAllWeatherData = async (lat: number, lon: number, cityInfo?: { name: string, country: string }) => {
    const response = await fetch(`/.netlify/functions/weather?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao buscar dados do clima.' }));
        throw new Error(errorData.error || 'Falha ao buscar dados do clima.');
    }
    
    const { oneCallData, airQualityData, reverseGeoData } = await response.json();

    // --- Transform data ---
    
    const locationName = cityInfo?.name || reverseGeoData?.[0]?.name || 'Localização Desconhecida';
    const countryName = cityInfo?.country || reverseGeoData?.[0]?.country || '';

    // Current Weather
    const current = oneCallData.current;
    const weatherData: WeatherData = {
        city: locationName,
        country: countryName,
        date: new Date(current.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        temperature: Math.round(current.temp),
        condition: current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(current.weather[0].icon),
        windSpeed: Math.round(current.wind_speed * 3.6), // m/s to km/h
        humidity: current.humidity,
        pressure: current.pressure,
    };
    
    // Air Quality
    const aqiResult: AirQualityData = {
        aqi: airQualityData.list[0].main.aqi,
    };
    // The OWM AQI is 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor.
    // Map it to a more standard-looking scale for the UI component.
    const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
    aqiResult.aqi = aqiMap[aqiResult.aqi as keyof typeof aqiMap] || 0;

    // Hourly Forecast (next 8 hours)
    const hourlyForecast: HourlyForecast[] = oneCallData.hourly.slice(1, 9).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    // Daily Forecast (next 5 days)
    const dailyForecast: DailyForecast[] = oneCallData.daily.slice(1, 6).map((item: any) => {
        const date = new Date(item.dt * 1000);
        const today = new Date();
        const isToday = date.getDate() === today.getDate();
        
        let dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        if (isToday) {
            dayLabel = 'Hoje';
        } else {
            dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
        }

        return {
            day: dayLabel,
            temperature: Math.round(item.temp.max),
            conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
        }
    });

    // Alerts
    const alerts: WeatherAlert[] = (oneCallData.alerts || []).map((alert: any) => ({
        event: alert.event,
        description: alert.description,
        sender_name: alert.sender_name,
    }));
    
    return {
        weatherData,
        airQualityData: aqiResult,
        hourlyForecast,
        dailyForecast,
        alerts
    };
};
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
        throw new Error('Cidade não encontrada.');
    }
    return await response.json();
};

// Main function to fetch all weather-related data via our secure Netlify function
export const fetchAllWeatherData = async (lat: number, lon: number) => {
    const response = await fetch(`/.netlify/functions/weather?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao buscar dados do clima.' }));
        throw new Error(errorData.error || 'Falha ao buscar dados do clima.');
    }
    
    const { forecastData, airQualityData } = await response.json();

    // --- Transform data ---
    
    // Current Weather
    const current = forecastData.list[0];
    const weatherData: WeatherData = {
        city: forecastData.city.name,
        country: forecastData.city.country,
        date: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        temperature: Math.round(current.main.temp),
        condition: current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1),
        conditionIcon: mapOwmIconToEmoji(current.weather[0].icon),
        windSpeed: Math.round(current.wind.speed * 3.6), // m/s to km/h
        humidity: current.main.humidity,
        pressure: current.main.pressure,
    };
    
    // Air Quality
    const aqiResult: AirQualityData = {
        aqi: airQualityData.list[0].main.aqi,
    };
    // The OWM AQI is 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor.
    // Map it to a more standard-looking scale for the UI component.
    const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
    aqiResult.aqi = aqiMap[aqiResult.aqi as keyof typeof aqiMap] || 0;


    // Hourly Forecast (next 5 entries, 15 hours)
    const hourlyForecast: HourlyForecast[] = forecastData.list.slice(0, 5).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.main.temp),
        conditionIcon: mapOwmIconToEmoji(item.weather[0].icon),
    }));

    // Daily Forecast (process the full list)
    const dailyForecasts: { [key: string]: { temps: number[], icons: string[] } } = {};
    forecastData.list.forEach((item: any) => {
        const day = new Date(item.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' });
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = { temps: [], icons: [] };
        }
        dailyForecasts[day].temps.push(item.main.temp);
        // We'll grab the icon around midday for a representative weather condition
        if (new Date(item.dt * 1000).getHours() >= 12 && new Date(item.dt * 1000).getHours() <= 15) {
             dailyForecasts[day].icons.push(item.weather[0].icon);
        }
    });

    const dailyForecast: DailyForecast[] = Object.keys(dailyForecasts).slice(0, 5).map(day => {
        const dayData = dailyForecasts[day];
        const maxTemp = Math.round(Math.max(...dayData.temps));
        // Find the most frequent icon, or default to the first one
        const mostFrequentIcon = dayData.icons.sort((a,b) =>
              dayData.icons.filter(v => v===a).length
            - dayData.icons.filter(v => v===b).length
        ).pop() || dayData.icons[0] || forecastData.list[0].weather[0].icon;

        // Use 'Hoje' for today
        const todayShort = new Date().toLocaleDateString('pt-BR', { weekday: 'short' });

        return {
            day: day === todayShort ? 'Hoje' : day.charAt(0).toUpperCase() + day.slice(1, 3),
            temperature: maxTemp,
            conditionIcon: mapOwmIconToEmoji(mostFrequentIcon),
        };
    });

    // Alerts (mocked as empty since it's a paid feature)
    const alerts: WeatherAlert[] = [];
    
    return {
        weatherData,
        airQualityData: aqiResult,
        hourlyForecast,
        dailyForecast,
        alerts
    };
};

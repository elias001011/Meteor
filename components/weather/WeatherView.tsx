import React, { useState, useEffect, useCallback } from 'react';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData } from '../../types';
import SearchBar from './SearchBar';
import CurrentWeather from './CurrentWeather';
import AdditionalInfo from './AdditionalInfo';
import HourlyForecastComponent from './HourlyForecast';
import DailyForecastComponent from './DailyForecast';
import AirQuality from './AirQuality';
import LoadingSpinner from '../common/LoadingSpinner';

// Mock data, in a real app this would come from a weather service API
const mockWeatherData: WeatherData = {
  city: 'Porto Alegre',
  country: 'BR',
  date: 'Sexta-feira, 24 de Maio',
  temperature: 22,
  condition: 'Parcialmente Nublado',
  conditionIcon: '🌤️', // Using emoji for simplicity, would be an icon component
  windSpeed: 15,
  humidity: 75,
  pressure: 1012,
};

const mockAirQualityData: AirQualityData = {
    aqi: 42, // AQI value (e.g., from OpenWeatherMap)
};

const mockHourlyForecast: HourlyForecast[] = [
  { time: '14:00', temperature: 23, conditionIcon: '🌤️' },
  { time: '15:00', temperature: 23, conditionIcon: '☁️' },
  { time: '16:00', temperature: 22, conditionIcon: '☁️' },
  { time: '17:00', temperature: 21, conditionIcon: '🌥️' },
  { time: '18:00', temperature: 20, conditionIcon: '🌙' },
];

const mockDailyForecast: DailyForecast[] = [
  { day: 'Hoje', temperature: 23, conditionIcon: '🌤️' },
  { day: 'Sáb', temperature: 24, conditionIcon: '☀️' },
  { day: 'Dom', temperature: 21, conditionIcon: '🌦️' },
  { day: 'Seg', temperature: 20, conditionIcon: '🌧️' },
  { day: 'Ter', temperature: 22, conditionIcon: '☀️' },
];

const WeatherView: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
    const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
    const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
    const [status, setStatus] = useState<'loading' | 'success'>('loading');

    const fetchData = useCallback(() => {
        setStatus('loading');
        // Simulate API fetch 
        setTimeout(() => {
            setWeatherData(mockWeatherData);
            setAirQualityData(mockAirQualityData);
            setHourlyForecast(mockHourlyForecast);
            setDailyForecast(mockDailyForecast);
            setStatus('success');
        }, 1500); // Simulate 1.5 second delay
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center py-10">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (status === 'success' && weatherData && airQualityData) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <SearchBar />
                <CurrentWeather data={weatherData} />
                <AdditionalInfo data={weatherData} />
                <AirQuality data={airQualityData} />
                <HourlyForecastComponent data={hourlyForecast} />
                <DailyForecastComponent data={dailyForecast} />
            </div>
        );
    }

    return null; // Should not happen
};

export default WeatherView;
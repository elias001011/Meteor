
import React from 'react';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData, CitySearchResult, WeatherAlert, DataSource } from '../../types';
import SearchBar from './SearchBar';
import CurrentWeather from './CurrentWeather';
import AdditionalInfo from './AdditionalInfo';
import HourlyForecastComponent from './HourlyForecast';
import DailyForecastComponent from './DailyForecast';
import AirQuality from './AirQuality';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';
import Alerts from './Alerts';
import DataSourceInfo from './DataSourceInfo';
import { SparklesIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface DesktopWeatherProps {
    weatherData: WeatherData | null;
    airQualityData: AirQualityData | null;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    alerts: WeatherAlert[];
    dataSource: DataSource | null;
    lastUpdated: number | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    onCitySelect: (city: CitySearchResult) => void;
    onGeolocate: () => void;
    onRetry: () => void;
    onDataSourceInfoClick: () => void;
}

const DesktopWeather: React.FC<DesktopWeatherProps> = ({
    weatherData,
    airQualityData,
    hourlyForecast,
    dailyForecast,
    alerts,
    dataSource,
    lastUpdated,
    status,
    error,
    onCitySelect,
    onGeolocate,
    onRetry,
    onDataSourceInfoClick
}) => {
    const { classes } = useTheme();

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (status === 'error') {
        return (
            <div className="space-y-6">
                 <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                 <ErrorDisplay message={error || "Não foi possível buscar os dados."} onRetry={onRetry} />
            </div>
        );
    }

    if (status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gray-800/30 rounded-3xl border border-gray-700/30">
                 <div className="bg-gray-800 p-6 rounded-full shadow-xl">
                    <SparklesIcon className={`w-16 h-16 ${classes.text}`} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo ao Meteor</h2>
                    <p className="text-lg text-gray-400 max-w-md mx-auto">
                        Sua central de inteligência climática. Comece pesquisando uma cidade.
                    </p>
                </div>
                <div className="w-full max-w-lg">
                    <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                </div>
            </div>
        );
    }
    
    if (status === 'success' && weatherData) {
        return (
            <div className="space-y-6">
                <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                <CurrentWeather data={weatherData} />
                {dataSource !== 'open-meteo' && <Alerts alerts={alerts} />}
                <AdditionalInfo data={weatherData} />
                {airQualityData && <AirQuality data={airQualityData} />}
                <HourlyForecastComponent data={hourlyForecast} />
                <DailyForecastComponent data={dailyForecast} />
                <DataSourceInfo source={dataSource} lastUpdated={lastUpdated} onClick={onDataSourceInfoClick} />
            </div>
        );
    }

    return null;
};

export default DesktopWeather;



import React from 'react';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData, CitySearchResult, WeatherAlert, DataSource, ClockDisplayMode } from '../../types';
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

interface WeatherViewProps {
    weatherData: WeatherData | null;
    airQualityData: AirQualityData | null;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    alerts: WeatherAlert[];
    dataSource: DataSource | null;
    lastUpdated: number | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    clockDisplayMode: ClockDisplayMode;
    onCitySelect: (city: CitySearchResult) => void;
    onGeolocate: () => void;
    onRetry: () => void;
    onDataSourceInfoClick: () => void;
}

const WeatherView: React.FC<WeatherViewProps> = ({
    weatherData,
    airQualityData,
    hourlyForecast,
    dailyForecast,
    alerts,
    dataSource,
    lastUpdated,
    status,
    error,
    clockDisplayMode,
    onCitySelect,
    onGeolocate,
    onRetry,
    onDataSourceInfoClick
}) => {
    const { classes, density } = useTheme();

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={`p-4 sm:${density.padding}`}>
                <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                <div className="mt-6">
                    <ErrorDisplay message={error || "Não foi possível buscar os dados."} onRetry={onRetry} />
                </div>
            </div>
        );
    }

    if (status === 'idle') {
        return (
            <div className="flex flex-col h-full p-6">
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                     <div className="bg-gray-800/50 p-4 rounded-full mb-2">
                        <SparklesIcon className={`w-12 h-12 ${classes.text}`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Meteor</h2>
                        <p className="text-gray-400 max-w-xs mx-auto">
                            Selecione um local ou use sua localização para ver a previsão do tempo detalhada.
                        </p>
                    </div>
                    <div className="w-full max-w-md">
                        <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                    </div>
                </div>
            </div>
        );
    }
    
    if (status === 'success' && weatherData) {
        return (
            <div className={`p-4 sm:${density.padding} ${density.gap} flex flex-col`}>
                <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
                <CurrentWeather data={weatherData} clockDisplayMode={clockDisplayMode} />
                {dataSource !== 'open-meteo' && <Alerts alerts={alerts} />}
                <AdditionalInfo data={weatherData} />
                {airQualityData && <AirQuality data={airQualityData} />}
                <HourlyForecastComponent data={hourlyForecast} timezoneOffset={weatherData.timezoneOffset} />
                <DailyForecastComponent data={dailyForecast} timezoneOffset={weatherData.timezoneOffset} />
                <DataSourceInfo source={dataSource} lastUpdated={lastUpdated} onClick={onDataSourceInfoClick} />
            </div>
        );
    }

    return null; 
};

export default WeatherView;
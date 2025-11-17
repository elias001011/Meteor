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

interface DesktopWeatherProps {
    weatherData: WeatherData | null;
    airQualityData: AirQualityData | null;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    alerts: WeatherAlert[];
    dataSource: DataSource | null;
    lastUpdated: number | null;
    status: 'loading' | 'success' | 'error';
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
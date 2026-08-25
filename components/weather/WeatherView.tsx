import React from 'react';
import type { AirQualityData, CitySearchResult, ClockDisplayMode, DailyForecast, DataSource, HourlyForecast, UnitSystem, WeatherAlert, WeatherData } from '../../types';
import { useTheme } from '../context/ThemeContext';
import AirQuality from './AirQuality';
import Alerts from './Alerts';
import AdditionalInfo from './AdditionalInfo';
import CurrentWeather from './CurrentWeather';
import DailyForecastComponent from './DailyForecast';
import DataSourceInfo from './DataSourceInfo';
import ErrorDisplay from '../common/ErrorDisplay';
import HourlyForecastComponent from './HourlyForecast';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchBar from './SearchBar';
import WeatherInsights from './WeatherInsights';
import SunriseSunset from './SunriseSunset';

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
  unitSystem: UnitSystem;
  showDetailLabel: boolean;
  onCitySelect: (city: CitySearchResult) => void;
  onGeolocate: () => void;
  onRetry: () => void;
  onDataSourceInfoClick: () => void;
}

const WeatherView: React.FC<WeatherViewProps> = ({
  weatherData, airQualityData, hourlyForecast, dailyForecast, alerts, dataSource, lastUpdated,
  status, error, clockDisplayMode, unitSystem, showDetailLabel, onCitySelect, onGeolocate,
  onRetry, onDataSourceInfoClick
}) => {
  const { isAmoled } = useTheme();

  if (status === 'loading') {
    return <div className="flex min-h-[65dvh] items-center justify-center"><LoadingSpinner /></div>;
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex min-h-[65dvh] max-w-xl flex-col justify-center gap-5 px-4">
        <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
        <ErrorDisplay message={error || 'Não foi possível buscar os dados.'} onRetry={onRetry} />
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-4xl items-center px-4 py-10 sm:px-6">
        <section className={`w-full rounded-2xl border border-white/[0.08] px-5 py-12 text-center sm:px-12 sm:py-16 ${isAmoled ? 'bg-black' : 'bg-[#111419]'}`}>
          <img src="/favicon.svg" alt="" className="mx-auto mb-5 h-12 w-12" />
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Consulte o clima da sua cidade.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">Previsão por hora, próximos dias e informações para planejar sua rotina.</p>
          <div className="mx-auto mt-8 max-w-xl text-left"><SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} /></div>
        </section>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="mx-auto max-w-[1320px] space-y-3 px-3 py-4 sm:space-y-4 sm:px-5 sm:py-5 lg:px-6">
      <div className="relative z-30 max-w-xl">
        <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5 lg:row-span-2">
          <CurrentWeather data={weatherData} clockDisplayMode={clockDisplayMode} unitSystem={unitSystem} />
        </div>
        <div className="lg:col-span-7">
          <WeatherInsights current={weatherData} hourly={hourlyForecast} daily={dailyForecast} airQuality={airQualityData} alerts={alerts} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <HourlyForecastComponent data={hourlyForecast} timezoneOffset={weatherData.timezoneOffset} unitSystem={unitSystem} showDetailLabel={showDetailLabel} />
        </div>
      </div>

      {dataSource !== 'open-meteo' && <Alerts alerts={alerts} />}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 lg:col-span-7">
          <DailyForecastComponent data={dailyForecast} timezoneOffset={weatherData.timezoneOffset} unitSystem={unitSystem} showDetailLabel={showDetailLabel} />
        </div>
        <div className="space-y-3 sm:space-y-4 lg:col-span-5">
          <SunriseSunset sunrise={weatherData.sunrise} sunset={weatherData.sunset} timezoneOffset={weatherData.timezoneOffset} />
          <AdditionalInfo data={weatherData} unitSystem={unitSystem} />
        </div>
      </div>
      {airQualityData && <AirQuality data={airQualityData} />}
      <DataSourceInfo source={dataSource} lastUpdated={lastUpdated} onClick={onDataSourceInfoClick} />
    </div>
  );
};

export default WeatherView;

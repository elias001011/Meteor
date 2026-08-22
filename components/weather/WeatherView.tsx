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
      <div className="mx-auto flex min-h-[74dvh] max-w-5xl items-center px-4 py-12 sm:px-6">
        <section className={`relative w-full overflow-hidden rounded-[2rem] border border-white/10 px-5 py-14 text-center sm:px-12 sm:py-20 ${isAmoled ? 'bg-black' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.15),transparent_23rem),linear-gradient(145deg,rgba(18,33,51,0.96),rgba(4,10,18,0.98))]'}`}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045]">
            <img src="/favicon.svg" alt="" className="h-11 w-11" />
          </div>
          <p className="meteor-eyebrow mb-3">Previsão clara, decisões melhores</p>
          <h2 className="mx-auto max-w-2xl text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">O clima do seu dia, sem ruído.</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">Pesquise uma cidade ou use sua localização para acessar previsão, mapa e um resumo automático das condições.</p>
          <div className="mx-auto mt-9 max-w-xl text-left"><SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} /></div>
        </section>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="mx-auto max-w-[1480px] space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="relative z-30 mx-auto max-w-3xl lg:mx-0 lg:max-w-xl">
        <SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:items-start">
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

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12 xl:items-start">
        <div className="min-w-0 xl:col-span-7">
          <DailyForecastComponent data={dailyForecast} timezoneOffset={weatherData.timezoneOffset} unitSystem={unitSystem} showDetailLabel={showDetailLabel} />
        </div>
        <div className="xl:col-span-5"><AdditionalInfo data={weatherData} unitSystem={unitSystem} /></div>
      </div>

      {airQualityData && <AirQuality data={airQualityData} />}
      <DataSourceInfo source={dataSource} lastUpdated={lastUpdated} onClick={onDataSourceInfoClick} />
    </div>
  );
};

export default WeatherView;

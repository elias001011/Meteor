import React from 'react';
import type { AirQualityData, CitySearchResult, ClockDisplayMode, DailyForecast, DataSource, HourlyForecast, UnitSystem, WeatherAlert, WeatherData } from '../../types';
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
      <div className="meteor-welcome mx-auto max-w-[1320px] px-5 py-12 sm:px-8 sm:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div>
            <p className="meteor-kicker mb-8"><span className="meteor-dot" /> METEOR / INTELIGÊNCIA CLIMÁTICA</p>
            <h2 className="text-[clamp(3.3rem,6.5vw,6.2rem)] font-medium leading-[0.95] tracking-[-0.065em] text-ink">Lá fora muda.<br /><span className="text-slate-400">Você se prepara.</span></h2>
            <p className="mt-7 max-w-md text-base leading-relaxed text-slate-400">Entenda o céu, acompanhe o tempo e encontre o melhor momento para o seu dia.</p>
            <div className="mt-9 max-w-lg"><SearchBar onCitySelect={onCitySelect} onGeolocate={onGeolocate} /></div>
          </div>
          <div className="meteor-orbit" aria-hidden="true"><div className="meteor-orbit-sun" /><span className="meteor-orbit-label">UM NOVO OLHAR PARA O TEMPO</span></div>
        </section>
        <div className="mt-16 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3">
          {[['01 / PREVISÃO', 'Seu dia, em perspectiva.', 'Previsão por hora e para os próximos dias.'], ['02 / CONTEXTO', 'Além da temperatura.', 'Qualidade do ar, vento e alertas em um só lugar.'], ['03 / INTELIGÊNCIA', 'Menos dúvida. Mais clareza.', 'Converse com a Meteor IA sobre o clima.']].map(([label, title, text]) => <div key={label}><p className="meteor-kicker">{label}</p><h3 className="mb-2 mt-4 text-lg font-medium text-ink">{title}</h3><p className="text-sm leading-relaxed text-slate-400">{text}</p></div>)}
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div><p className="meteor-kicker mb-3">METEOR / VISÃO GERAL</p><h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-5xl">O seu tempo, agora.</h1></div>
        <p className="meteor-kicker">PREVISÃO · CONTEXTO · INTELIGÊNCIA</p>
      </div>
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

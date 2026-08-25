
import React, { useState } from 'react';
import type { DailyForecast, UnitSystem } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';
import { getSettings } from '../../services/settingsService';
import WeatherConditionIcon from './WeatherConditionIcon';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
  unitSystem?: UnitSystem;
  showDetailLabel?: boolean;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0, unitSystem = 'metric', showDetailLabel = true }) => {
  const { classes, cardClass } = useTheme();
  const settings = getSettings();
  
  // Complexity Check
  const isComplexEnabled = settings.forecastComplexity === 'advanced';
  const showComplexHere = isComplexEnabled && (settings.forecastDetailView === 'both' || settings.forecastDetailView === 'daily_only');

  const [selectedItem, setSelectedItem] = useState<{
        title: string;
        temp: number;
        temp_min?: number;
        icon: string;
        description: string;
        pop?: number;
        // Extended
        humidity?: number;
        wind_speed?: number;
        wind_gust?: number;
        uvi?: number;
        clouds?: number;
        pressure?: number;
        sunrise?: number;
        sunset?: number;
        rain?: number;
        dew_point?: number;
        moon_phase?: number;
        summary?: string;
    } | null>(null);
  
  const getDayLabel = (dt: number) => {
    const localDate = new Date((dt + timezoneOffset) * 1000);
    const nowUtc = Date.now();
    const todayTarget = new Date(nowUtc + (timezoneOffset * 1000));

    const isToday = localDate.getUTCFullYear() === todayTarget.getUTCFullYear() &&
                    localDate.getUTCMonth() === todayTarget.getUTCMonth() &&
                    localDate.getUTCDate() === todayTarget.getUTCDate();

    if (isToday) return 'Hoje';
    
    let dayName = localDate.toLocaleString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1, -1); 
  };

  const formatTemp = (t: number) => {
      if (unitSystem === 'imperial') {
          return Math.round((t * 9/5) + 32);
      }
      return Math.round(t);
  };

  const range = data.reduce((acc, item) => ({
      min: Math.min(acc.min, item.temperature_min ?? item.temperature),
      max: Math.max(acc.max, item.temperature),
  }), { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY });
  const rangeSpan = Math.max(1, range.max - range.min);
  const getRangeStyle = (item: DailyForecast) => {
      const low = item.temperature_min ?? item.temperature;
      const rawLeft = ((low - range.min) / rangeSpan) * 100;
      const rawWidth = ((item.temperature - low) / rangeSpan) * 100;
      const width = Math.max(10, rawWidth);
      const left = Math.min(rawLeft, 100 - width);
      return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` };
  };

  const handleItemClick = (item: DailyForecast) => {
      setSelectedItem({
          title: getDayLabel(item.dt) + (getDayLabel(item.dt) === 'Hoje' ? '' : ` (${new Date((item.dt + timezoneOffset) * 1000).toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric', timeZone: 'UTC'})})`),
          temp: item.temperature, // Max
          temp_min: item.temperature_min, // Min
          icon: item.conditionIcon,
          description: item.description || '',
          pop: item.pop,
          humidity: item.humidity,
          wind_speed: item.wind_speed,
          wind_gust: item.wind_gust,
          uvi: item.uvi,
          clouds: item.clouds,
          pressure: item.pressure,
          sunrise: item.sunrise,
          sunset: item.sunset,
          rain: item.rain,
          dew_point: item.dew_point,
          moon_phase: item.moon_phase,
          summary: item.summary
      });
  };

  return (
    <>
        <section className={`relative rounded-2xl p-4 sm:p-5 ${cardClass} animate-enter`}>
        <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold text-white">Próximos dias</h3>
        </div>
        
        <div className="space-y-0.5">
            {data.map((item, index) => (
            <button 
                key={index}
                onClick={() => handleItemClick(item)}
                onMouseDown={event => event.preventDefault()}
                className="group grid min-h-12 w-full items-center gap-2 rounded-lg px-1.5 py-2 text-sm transition-colors hover:bg-white/[0.03]"
                style={{ gridTemplateColumns: 'minmax(54px, .75fr) 46px 38px minmax(132px, 1.6fr)' }}
            >
                {/* Day */}
                <span className="truncate text-left font-medium text-slate-200 group-hover:text-white">{getDayLabel(item.dt)}</span>
                
                {/* Precip */}
                <div className={`flex items-center justify-center gap-1 text-xs ${classes.text}`}>
                    {typeof item.pop === 'number' && item.pop > 0.05 ? (
                        <>
                            <UmbrellaIcon className="w-3 h-3" />
                            <span>{Math.round(item.pop * 100)}%</span>
                        </>
                    ) : (
                        <span className="w-3 h-3"></span> // Spacer to keep alignment
                    )}
                </div>

                {/* Icon */}
                <div className="flex h-8 w-8 items-center justify-center">
                     <WeatherConditionIcon icon={item.conditionIcon} description={item.description} className="h-7 w-7" />
                </div>
                
                {/* Daily low/high range, normalized against the seven-day forecast. */}
                <div
                    className="grid min-w-0 grid-cols-[2rem_minmax(60px,1fr)_2rem] items-center gap-2"
                    aria-label={`Mínima de ${formatTemp(item.temperature_min ?? item.temperature)} graus e máxima de ${formatTemp(item.temperature)} graus`}
                >
                    <span className="text-right text-xs tabular-nums text-slate-500">{formatTemp(item.temperature_min ?? item.temperature)}°</span>
                    <span className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <span
                            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
                            style={getRangeStyle(item)}
                        />
                    </span>
                    <span className="text-left text-xs font-semibold tabular-nums text-slate-200">{formatTemp(item.temperature)}°</span>
                </div>
            </button>
            ))}
        </div>
        </section>

        <ForecastDetailModal 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            data={selectedItem} 
            isComplex={showComplexHere}
            isDaily={true} // Helper to show Min/Max
        />
    </>
  );
};

export default DailyForecastComponent;

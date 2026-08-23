
import React, { useEffect, useRef, useState } from 'react';
import type { HourlyForecast, UnitSystem } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';
import { getSettings } from '../../services/settingsService';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
  unitSystem?: UnitSystem;
  showDetailLabel?: boolean;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0, unitSystem = 'metric', showDetailLabel = true }) => {
  const { classes, cardClass } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = getSettings();
  
  // Complexity Check
  const isComplexEnabled = settings.forecastComplexity === 'advanced';
  const showComplexHere = isComplexEnabled && (settings.forecastDetailView === 'both' || settings.forecastDetailView === 'forecast_only');

  const [selectedItem, setSelectedItem] = useState<{
      title: string;
      temp: number;
      icon: string;
      description: string;
      pop?: number;
      // Extended
      feels_like?: number;
      humidity?: number;
      wind_speed?: number;
      wind_gust?: number;
      wind_deg?: number;
      pressure?: number;
      clouds?: number;
      uvi?: number;
      dew_point?: number;
  } | null>(null);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
      }
  }, [data]);

  const formatHour = (dt: number) => {
      const date = new Date((dt + timezoneOffset) * 1000);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  const formatTemp = (t: number) => {
      if (unitSystem === 'imperial') {
          return Math.round((t * 9/5) + 32);
      }
      return Math.round(t);
  };

  const handleItemClick = (item: HourlyForecast) => {
      setSelectedItem({
          title: formatHour(item.dt),
          temp: item.temperature,
          icon: item.conditionIcon,
          description: item.description || '',
          pop: item.pop,
          feels_like: item.feels_like,
          humidity: item.humidity,
          wind_speed: item.wind_speed,
          wind_gust: item.wind_gust,
          wind_deg: item.wind_deg,
          pressure: item.pressure,
          clouds: item.clouds,
          uvi: item.uvi,
          dew_point: item.dew_point
      });
  };

  return (
    <>
        <section className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${cardClass} animate-enter`}>
        <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold text-white">Próximas horas</h3>
        </div>
        
        <div ref={scrollRef} className="-mx-1 flex divide-x divide-white/[0.07] overflow-x-auto scroll-smooth px-1 no-scrollbar">
            {data.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => handleItemClick(item)}
                    className="group flex w-[4.5rem] flex-none flex-col items-center justify-between space-y-1.5 px-2 py-2.5 text-center transition-colors hover:bg-white/[0.035]"
                >
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-300">{formatHour(item.dt)}</span>
                    <span className="my-1 text-2xl">{item.conditionIcon}</span>
                    <span className="text-sm font-semibold">{formatTemp(item.temperature)}°</span>
                    
                    {/* Container de Chuva */}
                    <div className="h-4 w-full flex items-center justify-center">
                        {typeof item.pop === 'number' && item.pop > 0.05 ? (
                            <div className={`flex items-center gap-0.5 text-[9px] ${classes.text} font-bold`}>
                                <UmbrellaIcon className="w-2.5 h-2.5" />
                                <span>{Math.round(item.pop * 100)}%</span>
                            </div>
                        ) : (
                            <div className="w-2.5 h-2.5" /> 
                        )}
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
        />
    </>
  );
};

export default HourlyForecastComponent;

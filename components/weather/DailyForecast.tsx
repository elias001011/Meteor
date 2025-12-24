
import React, { useState } from 'react';
import type { DailyForecast, UnitSystem } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';
import { getSettings } from '../../services/settingsService';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
  unitSystem?: UnitSystem;
  showDetailLabel?: boolean;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0, unitSystem = 'metric', showDetailLabel = true }) => {
  const { classes, cardClass, density } = useTheme();
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
        <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3 px-2">
            <h3 className={`${density.sectionTitle} font-medium text-gray-300 uppercase tracking-wide m-0`}>Próximos Dias</h3>
             {showComplexHere && showDetailLabel && (
                <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">Detalhes</span>
            )}
        </div>
        
        <div className="space-y-1">
            {data.map((item, index) => (
            <button 
                key={index}
                onClick={() => handleItemClick(item)}
                className={`w-full grid items-center p-3 rounded-xl hover:bg-white/5 transition-colors group active:scale-[0.98] gap-2`}
                style={{ gridTemplateColumns: 'minmax(60px, 1fr) 50px 50px minmax(80px, auto)' }}
            >
                {/* Day */}
                <span className={`font-medium text-gray-200 group-hover:text-white ${density.text} text-left truncate`}>{getDayLabel(item.dt)}</span>
                
                {/* Precip */}
                <div className={`flex justify-center items-center gap-1 ${density.subtext} ${classes.text} font-medium`}>
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
                <div className="flex justify-center">
                     <span className="text-xl transform group-hover:scale-110 transition-transform">{item.conditionIcon}</span>
                </div>
                
                {/* Temp */}
                <div className="flex justify-end gap-3">
                    <span className={`font-bold text-right ${density.text}`}>{formatTemp(item.temperature)}°</span>
                    {item.temperature_min !== undefined && (
                        <span className={`font-medium text-right text-gray-500 ${density.text}`}>{formatTemp(item.temperature_min)}°</span>
                    )}
                </div>
            </button>
            ))}
        </div>
        </div>

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

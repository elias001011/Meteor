
import React, { useState } from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';
import { getSettings } from '../../services/settingsService';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0 }) => {
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
        uvi?: number;
        clouds?: number;
        pressure?: number;
        sunrise?: number;
        sunset?: number;
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
      if (settings.unitSystem === 'imperial') {
          return Math.round((t * 9/5) + 32);
      }
      return Math.round(t);
  };

  const handleItemClick = (item: DailyForecast) => {
      setSelectedItem({
          title: getDayLabel(item.dt) + (getDayLabel(item.dt) === 'Hoje' ? '' : ` (${new Date((item.dt + timezoneOffset) * 1000).toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric', timeZone: 'UTC'})})`),
          temp: item.temperature,
          temp_min: item.temperature_min,
          icon: item.conditionIcon,
          description: item.description || '',
          pop: item.pop,
          humidity: item.humidity,
          wind_speed: item.wind_speed,
          uvi: item.uvi,
          clouds: item.clouds,
          pressure: item.pressure,
          sunrise: item.sunrise,
          sunset: item.sunset
      });
  };

  return (
    <>
        <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3 px-2">
            <h3 className={`${density.sectionTitle} font-medium text-gray-300 uppercase tracking-wide m-0`}>Próximos Dias</h3>
             {showComplexHere && (
                <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">Detalhes</span>
            )}
        </div>
        
        <div className="space-y-1">
            {data.map((item, index) => (
            <button 
                key={index}
                onClick={() => handleItemClick(item)}
                className={`w-full grid grid-cols-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors group active:scale-[0.98]`}
                style={{ gridTemplateColumns: 'minmax(60px, 1fr) auto auto minmax(50px, auto)' }}
            >
                <span className={`font-medium text-gray-200 group-hover:text-white ${density.text} text-left truncate pr-2`}>{getDayLabel(item.dt)}</span>
                <div className={`flex justify-center items-center gap-1 ${density.subtext} ${classes.text} font-medium`}>
                    {typeof item.pop === 'number' && item.pop > 0.05 && (
                        <>
                            <UmbrellaIcon className="w-3 h-3" />
                            <span>{Math.round(item.pop * 100)}%</span>
                        </>
                    )}
                </div>
                <span className="text-xl text-center transform group-hover:scale-110 transition-transform">{item.conditionIcon}</span>
                <span className={`font-bold text-right ${density.text}`}>{formatTemp(item.temperature)}°</span>
            </button>
            ))}
        </div>
        </div>

        <ForecastDetailModal 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            data={selectedItem} 
            isComplex={showComplexHere}
        />
    </>
  );
};

export default DailyForecastComponent;

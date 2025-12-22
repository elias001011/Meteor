
import React, { useState } from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  
  const [selectedItem, setSelectedItem] = useState<{
        title: string;
        temp: number;
        icon: string;
        description: string;
        pop?: number;
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

  const handleItemClick = (item: DailyForecast) => {
      setSelectedItem({
          title: getDayLabel(item.dt) + (getDayLabel(item.dt) === 'Hoje' ? '' : ` (${new Date((item.dt + timezoneOffset) * 1000).toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric', timeZone: 'UTC'})})`),
          temp: item.temperature,
          icon: item.conditionIcon,
          description: item.description || '',
          pop: item.pop
      });
  };

  return (
    <>
        <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3 px-2">
            <h3 className={`${density.sectionTitle} font-medium text-gray-300 uppercase tracking-wide m-0`}>Próximos Dias</h3>
        </div>
        
        <div className="space-y-1">
            {data.map((item, index) => (
            <button 
                key={index}
                onClick={() => handleItemClick(item)}
                className={`w-full grid grid-cols-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors group active:scale-[0.98]`}
            >
                <span className={`font-medium text-gray-200 group-hover:text-white ${density.text} text-left`}>{getDayLabel(item.dt)}</span>
                <div className={`flex justify-center items-center gap-1 ${density.subtext} ${classes.text} font-medium`}>
                    {typeof item.pop === 'number' && item.pop > 0.05 && (
                        <>
                            <UmbrellaIcon className="w-3 h-3" />
                            <span>{Math.round(item.pop * 100)}%</span>
                        </>
                    )}
                </div>
                <span className="text-xl text-center transform group-hover:scale-110 transition-transform">{item.conditionIcon}</span>
                <span className={`font-bold text-right ${density.text}`}>{Math.round(item.temperature)}°</span>
            </button>
            ))}
        </div>
        </div>

        <ForecastDetailModal 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            data={selectedItem} 
        />
    </>
  );
};

export default DailyForecastComponent;


import React, { useEffect, useRef, useState } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedItem, setSelectedItem] = useState<{
      title: string;
      temp: number;
      icon: string;
      description: string;
      pop?: number;
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

  const handleItemClick = (item: HourlyForecast) => {
      setSelectedItem({
          title: formatHour(item.dt),
          temp: item.temperature,
          icon: item.conditionIcon,
          description: item.description || '',
          pop: item.pop
      });
  };

  return (
    <>
        <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter overflow-hidden transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3 px-2">
            <h3 className={`${density.sectionTitle} font-medium text-gray-300 uppercase tracking-wide m-0`}>Previsão por hora</h3>
        </div>
        
        <div ref={scrollRef} className="flex space-x-3 overflow-x-auto -mx-2 px-2 scroll-smooth no-scrollbar pb-1">
            {data.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => handleItemClick(item)}
                    className={`flex flex-col items-center justify-between space-y-1 flex-shrink-0 w-16 py-3 text-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group`}
                >
                    <span className={`${density.subtext} text-gray-400 font-medium group-hover:text-white`}>{formatHour(item.dt)}</span>
                    <span className="text-2xl my-1 transform group-hover:scale-110 transition-transform">{item.conditionIcon}</span>
                    <span className={`font-bold ${density.text}`}>{Math.round(item.temperature)}°</span>
                    
                    {/* Container de Chuva: Se não tiver chuva, fica vazio mantendo a altura */}
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
        </div>

        <ForecastDetailModal 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            data={selectedItem} 
        />
    </>
  );
};

export default HourlyForecastComponent;


import React, { useEffect, useRef, useState } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon, InfoIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
      }
  }, [data]);

  const handleItemClick = (description?: string) => {
      if (!description) return;
      setActiveInfo(description);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setActiveInfo(null), 3000);
  };

  const formatHour = (dt: number) => {
      const date = new Date((dt + timezoneOffset) * 1000);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  return (
    <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter overflow-hidden transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3 px-2">
          <h3 className={`${density.sectionTitle} font-medium text-gray-300 uppercase tracking-wide m-0`}>Previsão por hora</h3>
          {activeInfo && (
              <span className="text-[10px] text-cyan-400 font-bold animate-fade-in truncate ml-4 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                {activeInfo}
              </span>
          )}
      </div>
      
      <div ref={scrollRef} className="flex space-x-3 overflow-x-auto -mx-2 px-2 scroll-smooth no-scrollbar pb-1">
        {data.map((item, index) => (
            <button 
                key={index}
                onClick={() => handleItemClick(item.description)}
                className={`flex flex-col items-center justify-between space-y-1 flex-shrink-0 w-16 py-3 text-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-95`}
            >
                <span className={`${density.subtext} text-gray-400 font-medium`}>{formatHour(item.dt)}</span>
                <span className="text-2xl my-1">{item.conditionIcon}</span>
                <span className={`font-bold ${density.text}`}>{Math.round(item.temperature)}°</span>
                <div className="h-4 flex items-center justify-center">
                    {typeof item.pop === 'number' && item.pop > 0.05 ? (
                        <div className={`flex items-center gap-0.5 text-[9px] ${classes.text} font-bold`}>
                            <UmbrellaIcon className="w-2.5 h-2.5" />
                            <span>{Math.round(item.pop * 100)}%</span>
                        </div>
                    ) : (
                        <InfoIcon className="w-2.5 h-2.5 text-gray-600 opacity-20" />
                    )}
                </div>
            </button>
        ))}
      </div>
    </div>
  );
};

export default HourlyForecastComponent;


import React, { useEffect, useRef } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when data (city) changes
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
      }
  }, [data]);

  const formatHour = (dt: number) => {
      // Create a date object shifted by the offset
      const date = new Date((dt + timezoneOffset) * 1000);
      // Use getUTC methods because we shifted the time to simulate local time on the UTC timeline
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  return (
    <div className={`rounded-3xl p-5 ${cardClass} animate-enter delay-200`}>
      <h3 className="text-sm font-medium text-gray-300 mb-4 px-2 uppercase tracking-wide">Previsão por hora</h3>
      <div ref={scrollRef} className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2 scroll-smooth no-scrollbar">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-between space-y-2 flex-shrink-0 w-20 py-3 text-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
            <span className="text-xs text-gray-400 font-medium">{formatHour(item.dt)}</span>
            <span className="text-3xl my-1 filter drop-shadow-sm">{item.conditionIcon}</span>
            <span className="font-bold text-lg">{Math.round(item.temperature)}°</span>
            <div className="h-4 flex items-end">
                 {typeof item.pop === 'number' && item.pop > 0 && (
                    <div className={`flex items-center gap-1 text-[10px] ${classes.text} font-bold`}>
                        <UmbrellaIcon className="w-3 h-3" />
                        <span>{Math.round(item.pop * 100)}%</span>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyForecastComponent;
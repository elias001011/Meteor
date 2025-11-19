
import React, { useEffect, useRef } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes } = useTheme();
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
    <div className="bg-gray-800 rounded-3xl p-4">
      <h3 className="text-sm text-gray-400 mb-3 px-2">Previsão por hora (Local)</h3>
      <div ref={scrollRef} className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-1 flex-shrink-0 w-20 text-center bg-gray-700/40 rounded-2xl p-3">
            <span className="text-sm font-medium">{formatHour(item.dt)}</span>
            <span className="text-2xl">{item.conditionIcon}</span>
            <span className="font-bold">{Math.round(item.temperature)}°C</span>
            {typeof item.pop === 'number' && item.pop > 0 && (
                <div className={`flex items-center gap-1 text-xs ${classes.text} pt-1`}>
                    <UmbrellaIcon className="w-3 h-3" />
                    <span>{Math.round(item.pop * 100)}%</span>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyForecastComponent;

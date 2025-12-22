

import React, { useState, useRef, useEffect } from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const getDayLabel = (dt: number) => {
    // Apply offset to get the target location's day
    const localDate = new Date((dt + timezoneOffset) * 1000);
    
    // We need to compare with "Today" in the Target Location's timezone, not Browser's timezone.
    // Get current UTC time
    const nowUtc = Date.now();
    const todayTarget = new Date(nowUtc + (timezoneOffset * 1000));

    // Compare UTC day/month/year because we shifted both times to same relative epoch
    const isToday = localDate.getUTCFullYear() === todayTarget.getUTCFullYear() &&
                    localDate.getUTCMonth() === todayTarget.getUTCMonth() &&
                    localDate.getUTCDate() === todayTarget.getUTCDate();

    if (isToday) {
      return 'Hoje';
    }
    
    // Render based on UTC
    let dayName = localDate.toLocaleString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1, -1); 
  };

  const handleItemClick = (description?: string) => {
      if (!description) return;
      
      setToastMessage(description);
      
      if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
      }
      
      toastTimeoutRef.current = setTimeout(() => {
          setToastMessage(null);
      }, 2000);
  };

  useEffect(() => {
      return () => {
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
  }, []);

  return (
    <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter delay-300`}>
      <h3 className={`${density.sectionTitle} font-medium text-gray-300 px-2 uppercase tracking-wide`}>Próximos Dias</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <button 
            key={index} 
            onClick={() => handleItemClick(item.description)}
            className="w-full grid grid-cols-4 items-center p-2 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus:ring-1 focus:ring-white/10"
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
            <span className="text-xl text-center">{item.conditionIcon}</span>
            <span className={`font-bold text-right ${density.text}`}>{Math.round(item.temperature)}°</span>
          </button>
        ))}
      </div>

      {/* Toast Notification (Center Bottom, Higher to clear Nav) */}
      {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-enter-pop pointer-events-none">
              <div className="bg-gray-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/10 whitespace-nowrap">
                  {toastMessage}
              </div>
          </div>
      )}
    </div>
  );
};

export default DailyForecastComponent;
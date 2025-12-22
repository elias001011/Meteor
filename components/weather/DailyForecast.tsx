
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
  
  // Track active index instead of global message string
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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

  const handleItemClick = (index: number) => {
      if (activeIndex === index) {
          setActiveIndex(null);
          return;
      }

      setActiveIndex(index);
      
      if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
      }
      
      toastTimeoutRef.current = setTimeout(() => {
          setActiveIndex(null);
      }, 3000);
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
          <div key={index} className="relative z-10">
              <button 
                onClick={() => handleItemClick(index)}
                className={`w-full grid grid-cols-4 items-center p-2 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus:ring-1 focus:ring-white/10 focus:ring-inset ${activeIndex === index ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
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
              
               {/* Local Popup - Solid and Clear */}
               {activeIndex === index && item.description && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 animate-enter-pop w-full flex justify-center pointer-events-none">
                      <div className="bg-[#111827] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl border border-gray-700 whitespace-nowrap relative">
                           {/* Tiny arrow pointing up */}
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111827] border-l border-t border-gray-700 transform rotate-45"></div>
                          <span className="relative z-10">{item.description}</span>
                      </div>
                  </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyForecastComponent;

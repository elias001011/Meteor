
import React, { useEffect, useRef, useState } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track active index instead of global message string
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset scroll position when data (city) changes
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
      }
  }, [data]);

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

  const formatHour = (dt: number) => {
      // Create a date object shifted by the offset
      const date = new Date((dt + timezoneOffset) * 1000);
      // Use getUTC methods because we shifted the time to simulate local time on the UTC timeline
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  return (
    <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter delay-200`}>
      <h3 className={`${density.sectionTitle} font-medium text-gray-300 px-2 uppercase tracking-wide`}>Previsão por hora</h3>
      {/* Reduced padding bottom slightly, just enough for the small popup */}
      <div ref={scrollRef} className="flex space-x-3 overflow-x-auto pb-4 -mx-2 px-2 scroll-smooth no-scrollbar">
        {data.map((item, index) => {
          // Dynamic positioning logic to prevent overflow
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isLast = index === data.length - 1;
          const isSecondToLast = index === data.length - 2;

          let containerAlign = "left-1/2 -translate-x-1/2";
          
          // Adjust alignment for edge items
          if (isFirst || isSecond) {
              containerAlign = "left-0 translate-x-0";
          } else if (isLast || isSecondToLast) {
              containerAlign = "right-0 translate-x-0 left-auto";
          }

          return (
            <div key={index} className="relative group">
                <button 
                  onClick={() => handleItemClick(index)}
                  className={`flex flex-col items-center justify-between space-y-1 flex-shrink-0 w-16 py-2 text-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-inset ${activeIndex === index ? 'bg-white/10 ring-2 ring-white/20 ring-inset' : ''}`}
                >
                  <span className={`${density.subtext} text-gray-400 font-medium`}>{formatHour(item.dt)}</span>
                  <span className="text-2xl my-1 filter drop-shadow-sm">{item.conditionIcon}</span>
                  <span className={`font-bold ${density.text}`}>{Math.round(item.temperature)}°</span>
                  <div className="h-4 flex items-end">
                      {typeof item.pop === 'number' && item.pop > 0 && (
                          <div className={`flex items-center gap-1 text-[9px] ${classes.text} font-bold`}>
                              <UmbrellaIcon className="w-3 h-3" />
                              <span>{Math.round(item.pop * 100)}%</span>
                          </div>
                      )}
                  </div>
                </button>
                
                {/* Local Popup - PILL SHAPE, NO ARROW, SOLID */}
                {activeIndex === index && item.description && (
                    <div className={`absolute top-full mt-1 ${containerAlign} z-50 animate-enter-pop min-w-[120px] pointer-events-none`}>
                        <div className="bg-[#111827] text-white text-[10px] font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-white/10 whitespace-nowrap text-center">
                            {item.description}
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyForecastComponent;

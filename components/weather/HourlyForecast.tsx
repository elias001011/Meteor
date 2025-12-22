
import React, { useEffect, useRef, useState } from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface HourlyForecastProps {
  data: HourlyForecast[];
  timezoneOffset?: number;
}

interface PopupState {
    show: boolean;
    x: number;
    y: number;
    text: string;
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset scroll position when data changes
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
      }
  }, [data]);

  const handleItemClick = (e: React.MouseEvent<HTMLButtonElement>, description?: string) => {
      if (!description) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      
      setPopup({
          show: true,
          x: centerX,
          y: rect.top, // We will position slightly above this y
          text: description
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
          setPopup(null);
      }, 2500); // 2.5 seconds visibility
  };

  useEffect(() => {
      // Clear popup on scroll to prevent detached visuals
      const handleScroll = () => {
          if (popup) setPopup(null);
      };
      // Attach to window and the specific container
      window.addEventListener('scroll', handleScroll, { passive: true });
      const el = scrollRef.current;
      if (el) el.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
          window.removeEventListener('scroll', handleScroll);
          if (el) el.removeEventListener('scroll', handleScroll);
          if (timerRef.current) clearTimeout(timerRef.current);
      };
  }, [popup]);

  const formatHour = (dt: number) => {
      const date = new Date((dt + timezoneOffset) * 1000);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  return (
    <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter delay-200`}>
      <h3 className={`${density.sectionTitle} font-medium text-gray-300 px-2 uppercase tracking-wide`}>Previsão por hora</h3>
      <div ref={scrollRef} className="flex space-x-3 overflow-x-auto -mx-2 px-2 scroll-smooth no-scrollbar">
        {data.map((item, index) => (
            <button 
                key={index}
                onClick={(e) => handleItemClick(e, item.description)}
                className={`flex flex-col items-center justify-between space-y-1 flex-shrink-0 w-16 py-2 text-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-95`}
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
        ))}
      </div>

      {/* Fixed Popup Portal-like */}
      {popup && popup.show && (
          <div 
            className="fixed z-[9999] bg-[#111827] border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl animate-enter-pop pointer-events-none whitespace-nowrap"
            style={{ 
                left: popup.x, 
                top: popup.y - 12, // Position slightly above the element
                transform: 'translate(-50%, -100%)' // Center horizontally, move up
            }}
          >
              {popup.text}
          </div>
      )}
    </div>
  );
};

export default HourlyForecastComponent;

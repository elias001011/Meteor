
import React, { useState, useRef, useEffect } from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
}

interface PopupState {
    show: boolean;
    x: number;
    y: number;
    text: string;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes, cardClass, density } = useTheme();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

  const handleItemClick = (e: React.MouseEvent<HTMLButtonElement>, description?: string) => {
      if (!description) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      
      setPopup({
          show: true,
          x: centerX,
          y: rect.top,
          text: description
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
          setPopup(null);
      }, 2500);
  };

  useEffect(() => {
      const handleScroll = () => { if (popup) setPopup(null); };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
          window.removeEventListener('scroll', handleScroll);
          if (timerRef.current) clearTimeout(timerRef.current);
      };
  }, [popup]);

  return (
    <div className={`relative rounded-3xl ${density.padding} ${cardClass} animate-enter delay-300`}>
      <h3 className={`${density.sectionTitle} font-medium text-gray-300 px-2 uppercase tracking-wide`}>Próximos Dias</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <button 
            key={index}
            onClick={(e) => handleItemClick(e, item.description)}
            className={`w-full grid grid-cols-4 items-center p-2 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus:ring-1 focus:ring-white/10`}
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

      {/* Fixed Popup Portal-like */}
      {popup && popup.show && (
          <div 
            className="fixed z-[9999] bg-[#111827] border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl animate-enter-pop pointer-events-none whitespace-nowrap"
            style={{ 
                left: popup.x, 
                top: popup.y - 12, 
                transform: 'translate(-50%, -100%)' 
            }}
          >
              {popup.text}
          </div>
      )}
    </div>
  );
};

export default DailyForecastComponent;

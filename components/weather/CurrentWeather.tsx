
import React, { useState, useEffect } from 'react';
import type { WeatherData, ClockDisplayMode, UnitSystem } from '../../types';
import { useTheme } from '../context/ThemeContext';

interface CurrentWeatherProps {
  data: WeatherData;
  clockDisplayMode: ClockDisplayMode;
  unitSystem: UnitSystem;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, clockDisplayMode, unitSystem }) => {
  const [formattedLocalTime, setFormattedLocalTime] = useState('');
  const { cardClass, miniClass, density } = useTheme();

  useEffect(() => {
      const updateTime = () => {
          const nowUtc = Date.now(); 
          const offsetMs = (data.timezoneOffset || 0) * 1000;
          const targetTime = new Date(nowUtc + offsetMs);
          const hours = targetTime.getUTCHours().toString().padStart(2, '0');
          const minutes = targetTime.getUTCMinutes().toString().padStart(2, '0');
          setFormattedLocalTime(`${hours}:${minutes}`);
      };

      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
  }, [data.timezoneOffset]);


  const formattedDate = new Date((data.dt + (data.timezoneOffset || 0)) * 1000).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC' 
  });

  const shouldShowClock = () => {
    if (clockDisplayMode === 'never') return false;
    if (clockDisplayMode === 'always') return true;
    if (clockDisplayMode === 'different_zone') {
        const userOffsetSeconds = new Date().getTimezoneOffset() * -60;
        const cityOffsetSeconds = data.timezoneOffset || 0;
        return Math.abs(userOffsetSeconds - cityOffsetSeconds) > 120; 
    }
    return true;
  };

  const formatTemp = (t: number) => {
      if (unitSystem === 'imperial') {
          return Math.round((t * 9/5) + 32);
      }
      return Math.round(t);
  };

  return (
    <div className={`relative rounded-3xl ${density.padding} text-white overflow-hidden ${cardClass} animate-enter`}>
        <div className="absolute inset-0 z-0">
             <img 
                key={data.imageUrl}
                src={data.imageUrl} 
                alt="Weather" 
                className="w-full h-full object-cover opacity-40 transition-opacity duration-500" 
            />
             <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 to-transparent"></div>
        </div>

        <div className={`relative z-10 flex flex-col justify-between h-full min-h-[180px] ${density.gap}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className={`${density.titleText} font-bold tracking-tight drop-shadow-lg`}>{data.city}</h2>
                    <div className={`flex items-center gap-2 ${density.subtext} text-gray-200 font-medium drop-shadow-md`}>
                        <span className="capitalize">{formattedDate}</span>
                    </div>
                </div>
                {shouldShowClock() && (
                    <div className={`${miniClass} px-3 py-1 rounded-full shadow-lg transition-all duration-300`}>
                        <span className={`font-mono text-white font-medium tracking-wide ${density.subtext}`}>
                            {formattedLocalTime} <span className={`text-[10px] text-gray-400 ml-1`}>Local</span>
                        </span>
                    </div>
                )}
            </div>
            <div className="text-right mt-4">
                <p className={`${density.tempText} font-bold tracking-tighter drop-shadow-xl leading-none`}>{formatTemp(data.temperature)}°</p>
                {typeof data.feels_like === 'number' && (
                    <p className={`text-gray-200 font-medium drop-shadow-md ${density.text} mt-1`}>Sensação {formatTemp(data.feels_like)}°</p>
                )}
                <p className={`${density.text} capitalize font-semibold text-white drop-shadow-md`}>{data.condition}</p>
            </div>
        </div>
    </div>
  );
};

export default CurrentWeather;

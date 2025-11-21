

import React, { useState, useEffect } from 'react';
import type { WeatherData, ClockDisplayMode } from '../../types';
import { useTheme } from '../context/ThemeContext';

interface CurrentWeatherProps {
  data: WeatherData;
  clockDisplayMode: ClockDisplayMode;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, clockDisplayMode }) => {
  const [formattedLocalTime, setFormattedLocalTime] = useState('');
  const { cardClass, density } = useTheme();

  useEffect(() => {
      // Function to calculate local time in the target city
      const updateTime = () => {
          const nowUtc = Date.now(); // current UTC timestamp in ms
          const offsetMs = (data.timezoneOffset || 0) * 1000;
          const targetTime = new Date(nowUtc + offsetMs);
          
          // When creating a Date object with shifted time, getUTCHours/Minutes gives us the correct "wall clock" time for that zone.
          const hours = targetTime.getUTCHours().toString().padStart(2, '0');
          const minutes = targetTime.getUTCMinutes().toString().padStart(2, '0');
          setFormattedLocalTime(`${hours}:${minutes}`);
      };

      updateTime();
      const interval = setInterval(updateTime, 60000); // Update every minute
      return () => clearInterval(interval);
  }, [data.timezoneOffset]);


  const formattedDate = new Date((data.dt + (data.timezoneOffset || 0)) * 1000).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC' // Important: treat the shifted timestamp as UTC to avoid double shifting
  });

  // Logic to determine if we should show the clock based on user setting and timezone difference
  const shouldShowClock = () => {
    if (clockDisplayMode === 'never') return false;
    if (clockDisplayMode === 'always') return true;
    
    if (clockDisplayMode === 'different_zone') {
        // Browser offset is in minutes (positive if local is behind UTC). Convert to seconds and invert sign to match API format.
        // Example: GMT-3 => offset is 180. API expects -10800 (-3h). 180 * 60 * -1 = -10800.
        const userOffsetSeconds = new Date().getTimezoneOffset() * -60;
        const cityOffsetSeconds = data.timezoneOffset || 0;
        
        // We use a small tolerance of 120 seconds to handle potential minor discrepancies
        return Math.abs(userOffsetSeconds - cityOffsetSeconds) > 120; 
    }
    return true;
  };

  return (
    <div className={`relative rounded-3xl ${density.padding} text-white overflow-hidden ${cardClass} animate-enter`}>
        {/* Image with gradient overlay for readability */}
        <div className="absolute inset-0 z-0">
             <img 
                key={data.imageUrl}
                src={data.imageUrl} 
                alt="Weather background" 
                className="w-full h-full object-cover opacity-40 transition-opacity duration-500" 
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
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
                    <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                        <span className={`font-mono text-white font-medium tracking-wide ${density.subtext}`}>
                            {formattedLocalTime} <span className={`text-[10px] text-gray-400`}>Local</span>
                        </span>
                    </div>
                )}
            </div>
            <div className="text-right mt-4">
                <p className={`${density.tempText} font-bold tracking-tighter drop-shadow-xl leading-none`}>{Math.round(data.temperature)}°</p>
                {typeof data.feels_like === 'number' && (
                    <p className={`text-gray-200 font-medium drop-shadow-md ${density.text} mt-1`}>Sensação {Math.round(data.feels_like)}°C</p>
                )}
                <p className={`${density.text} capitalize font-semibold text-white drop-shadow-md`}>{data.condition}</p>
            </div>
        </div>
    </div>
  );
};

export default CurrentWeather;
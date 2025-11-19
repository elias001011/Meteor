
import React, { useState, useEffect } from 'react';
import type { WeatherData, ClockDisplayMode } from '../../types';

interface CurrentWeatherProps {
  data: WeatherData;
  clockDisplayMode: ClockDisplayMode;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, clockDisplayMode }) => {
  const [formattedLocalTime, setFormattedLocalTime] = useState('');

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
    <div className="relative rounded-3xl p-6 text-white overflow-hidden bg-gray-800">
        <img 
            key={data.imageUrl}
            src={data.imageUrl} 
            alt="Weather background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{data.city}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span>{formattedDate}</span>
                    </div>
                </div>
                {shouldShowClock() && (
                    <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
                        <span className="text-sm font-mono text-white font-medium tracking-wide">
                            {formattedLocalTime} <span className="text-xs text-gray-400">Local</span>
                        </span>
                    </div>
                )}
            </div>
            <div className="text-right mt-8">
                <p className="text-7xl font-bold">{Math.round(data.temperature)}°C</p>
                {typeof data.feels_like === 'number' && (
                    <p className="text-md -mt-1 text-gray-300">Sensação {Math.round(data.feels_like)}°C</p>
                )}
                <p className="text-lg capitalize">{data.condition}</p>
            </div>
        </div>
    </div>
  );
};

export default CurrentWeather;
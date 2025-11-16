
import React from 'react';
import type { WeatherData } from '../../types';

interface CurrentWeatherProps {
  data: WeatherData;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data }) => {
  const formattedDate = new Date(data.dt * 1000).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
  });

  return (
    <div className="relative rounded-3xl p-6 text-white overflow-hidden bg-black/30">
        <img src="https://picsum.photos/seed/portoalegre/600/400" alt="Weather background" className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" />
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
                <h2 className="text-2xl font-bold">{data.city}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{formattedDate}</span>
                </div>
            </div>
            <div className="text-right mt-8">
                <p className="text-7xl font-bold">{data.temperature}°C</p>
                <p className="text-lg -mt-2">{data.condition}</p>
            </div>
        </div>
    </div>
  );
};

export default CurrentWeather;

import React from 'react';
import type { WeatherData } from '../../types';
import { InfoIcon } from '../icons';

interface CurrentWeatherProps {
  data: WeatherData;
}

const DataSourceInfo: React.FC<{ source: 'onecall' | 'fallback' }> = ({ source }) => {
    const message = source === 'onecall' 
        ? "Dados da API One Call (Alertas Ativos)" 
        : "Dados da API de Fallback (Alertas Indisponíveis)";

    return (
        <div className="group relative flex items-center">
            <InfoIcon className="w-4 h-4 text-gray-400" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs scale-0 transform rounded-lg bg-gray-700 px-3 py-2 text-center text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                <span className="whitespace-nowrap">{message}</span>
            </div>
        </div>
    );
};


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
                    <DataSourceInfo source={data.dataSource} />
                </div>
            </div>
            <div className="text-right mt-8">
                <p className="text-7xl font-bold">{data.temperature}°</p>
                <p className="text-lg -mt-2">{data.condition}</p>
            </div>
        </div>
    </div>
  );
};

export default CurrentWeather;
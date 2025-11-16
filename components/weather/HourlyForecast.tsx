
import React from 'react';
import type { HourlyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';

interface HourlyForecastProps {
  data: HourlyForecast[];
}

const HourlyForecastComponent: React.FC<HourlyForecastProps> = ({ data }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
      <h3 className="text-sm text-gray-400 mb-3 px-2">Previsão por hora</h3>
      <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-1 flex-shrink-0 w-20 text-center bg-gray-700/40 rounded-2xl p-3">
            <span className="text-sm">{new Date(item.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-2xl">{item.conditionIcon}</span>
            <span className="font-bold">{Math.round(item.temperature)}°C</span>
            {typeof item.pop === 'number' && item.pop > 0 && (
                <div className="flex items-center gap-1 text-xs text-cyan-300 pt-1">
                    <UmbrellaIcon className="w-3 h-3" />
                    <span>{Math.round(item.pop * 100)}%</span>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyForecastComponent;
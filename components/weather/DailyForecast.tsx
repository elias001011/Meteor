import React from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';

interface DailyForecastProps {
  data: DailyForecast[];
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data }) => {
  const getDayLabel = (dt: number) => {
    const date = new Date(dt * 1000);
    const today = new Date();
    
    // Check if the date is today
    if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
      return 'Hoje';
    }
    
    // Otherwise, return abbreviated day name
    let dayName = date.toLocaleString('pt-BR', { weekday: 'short' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1, -1); // Capitalize and remove dot (e.g., "sáb.")
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
      <h3 className="text-sm text-gray-400 mb-2 px-2">Próximos Dias</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="grid grid-cols-4 items-center p-2 rounded-lg hover:bg-gray-700/50">
            <span className="font-medium">{getDayLabel(item.dt)}</span>
            <div className="flex justify-center items-center gap-1 text-xs text-cyan-300">
                {typeof item.pop === 'number' && item.pop > 0.05 && (
                    <>
                        <UmbrellaIcon className="w-4 h-4" />
                        <span>{Math.round(item.pop * 100)}%</span>
                    </>
                )}
            </div>
            <span className="text-2xl text-center">{item.conditionIcon}</span>
            <span className="font-bold text-right">{Math.round(item.temperature)}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyForecastComponent;
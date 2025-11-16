import React from 'react';
import type { DailyForecast } from '../../types';

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
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50">
            <span className="font-medium w-1/3">{getDayLabel(item.dt)}</span>
            <span className="text-2xl w-1/3 text-center">{item.conditionIcon}</span>
            <span className="font-bold w-1/3 text-right">{item.temperature}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyForecastComponent;
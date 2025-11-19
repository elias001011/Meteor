
import React from 'react';
import type { DailyForecast } from '../../types';
import { UmbrellaIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface DailyForecastProps {
  data: DailyForecast[];
  timezoneOffset?: number;
}

const DailyForecastComponent: React.FC<DailyForecastProps> = ({ data, timezoneOffset = 0 }) => {
  const { classes } = useTheme();
  
  const getDayLabel = (dt: number) => {
    // Apply offset to get the target location's day
    const localDate = new Date((dt + timezoneOffset) * 1000);
    
    // We need to compare with "Today" in the Target Location's timezone, not Browser's timezone.
    // Get current UTC time
    const nowUtc = Date.now();
    const todayTarget = new Date(nowUtc + (timezoneOffset * 1000));

    // Compare UTC day/month/year because we shifted both times to same relative epoch
    const isToday = localDate.getUTCFullYear() === todayTarget.getUTCFullYear() &&
                    localDate.getUTCMonth() === todayTarget.getUTCMonth() &&
                    localDate.getUTCDate() === todayTarget.getUTCDate();

    if (isToday) {
      return 'Hoje';
    }
    
    // Render based on UTC
    let dayName = localDate.toLocaleString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1, -1); 
  };

  return (
    <div className="bg-gray-800 rounded-3xl p-4">
      <h3 className="text-sm text-gray-400 mb-2 px-2">Próximos Dias</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="grid grid-cols-4 items-center p-2 rounded-lg hover:bg-gray-700/50">
            <span className="font-medium">{getDayLabel(item.dt)}</span>
            <div className={`flex justify-center items-center gap-1 text-xs ${classes.text}`}>
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

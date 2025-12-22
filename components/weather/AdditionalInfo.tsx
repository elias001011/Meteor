

import React from 'react';
import type { WeatherData } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, EyeIcon, CloudIcon, ThermometerIcon, CloudRainIcon, CloudSnowIcon, SunriseIcon, SunsetIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AdditionalInfoProps {
  data: WeatherData;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; iconSize: string; textSize: string; subtextSize: string }> = ({ icon, label, value, iconSize, textSize, subtextSize }) => (
    <div className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5 min-w-0">
        <div className={`bg-white/10 rounded-full p-2 shadow-inner flex-shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className={`text-gray-400 font-medium uppercase tracking-wide truncate ${subtextSize}`}>{label}</p>
            <p className={`font-bold text-slate-100 truncate ${textSize}`}>{value}</p>
        </div>
    </div>
);

const degreesToCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
};

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ data }) => {
  const { classes, cardClass, density } = useTheme();

  const formatTime = (timestamp: number) => {
      // Shift by timezone offset to get local time
      const offset = data.timezoneOffset || 0;
      const date = new Date((timestamp + offset) * 1000);
      // Use UTC methods since we shifted the epoch
      return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC'
      });
  };

  const getUviInfo = (uvi: number) => {
    const uviValue = Math.round(uvi);
    if (uviValue <= 2) return { level: 'Baixo', value: `${uviValue}` };
    if (uviValue <= 5) return { level: 'Moderado', value: `${uviValue}` };
    if (uviValue <= 7) return { level: 'Alto', value: `${uviValue}` };
    if (uviValue <= 10) return { level: 'Muito Alto', value: `${uviValue}` };
    return { level: 'Extremo', value: `${uviValue}` };
  };
  
  const uviInfo = typeof data.uvi === 'number' && !isNaN(data.uvi) ? getUviInfo(data.uvi) : null;
  const windDirection = typeof data.wind_deg === 'number' ? ` ${degreesToCardinal(data.wind_deg)}` : '';
  
  // Dynamic Icon sizing
  const iconClass = `${density.iconSize} ${classes.text}`;

  // Common props for Items
  const itemProps = {
      iconSize: density.iconSize,
      textSize: density.text,
      subtextSize: density.subtext
  };

  return (
    <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter delay-100 flex flex-col justify-center`}>
        {/* Adjusted grid to avoid forcing 3 cols on XL screens where the container might be narrow (25/75 layout) */}
        <div className={`grid grid-cols-2 ${density.gap} gap-y-2`}>
            <InfoItem icon={<SunriseIcon className={iconClass} />} label="Nascer" value={formatTime(data.sunrise)} {...itemProps} />
            <InfoItem icon={<SunsetIcon className={iconClass} />} label="Pôr" value={formatTime(data.sunset)} {...itemProps} />
            <InfoItem icon={<WindIcon className={iconClass} />} label="Vento" value={`${data.windSpeed} km/h${windDirection}`} {...itemProps} />
            {typeof data.wind_gust === 'number' && <InfoItem icon={<WindIcon className={iconClass} />} label="Rajadas" value={`${Math.round(data.wind_gust)} km/h`} {...itemProps} />}
            <InfoItem icon={<DropletsIcon className={iconClass} />} label="Umidade" value={`${data.humidity}%`} {...itemProps} />
            <InfoItem icon={<GaugeIcon className={iconClass} />} label="Pressão" value={`${data.pressure} hPa`} {...itemProps} />
            {typeof data.visibility === 'number' && <InfoItem icon={<EyeIcon className={iconClass} />} label="Visibilidade" value={`${(data.visibility / 1000).toFixed(1)} km`} {...itemProps} />}
            {typeof data.clouds === 'number' && <InfoItem icon={<CloudIcon className={iconClass} />} label="Nuvens" value={`${data.clouds}%`} {...itemProps} />}
            {typeof data.dew_point === 'number' && <InfoItem icon={<ThermometerIcon className={iconClass} />} label="P. Orvalho" value={`${Math.round(data.dew_point)}°C`} {...itemProps} />}
            {typeof data.rain_1h === 'number' && data.rain_1h > 0 && <InfoItem icon={<CloudRainIcon className={iconClass} />} label="Chuva (1h)" value={`${data.rain_1h} mm`} {...itemProps} />}
            {typeof data.snow_1h === 'number' && data.snow_1h > 0 && <InfoItem icon={<CloudSnowIcon className={iconClass} />} label="Neve (1h)" value={`${data.snow_1h} mm`} {...itemProps} />}
            {uviInfo && (
                <InfoItem icon={<SunIcon className={iconClass} />} label={`UV (${uviInfo.level})`} value={uviInfo.value} {...itemProps} />
            )}
        </div>
    </div>
  );
};

export default AdditionalInfo;
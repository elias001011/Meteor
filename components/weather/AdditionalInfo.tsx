
import React from 'react';
import type { WeatherData } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, EyeIcon, CloudIcon, ThermometerIcon, CloudRainIcon, CloudSnowIcon, SunriseIcon, SunsetIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AdditionalInfoProps {
  data: WeatherData;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; iconSize: string; textSize: string; subtextSize: string }> = ({ icon, label, value, iconSize, textSize, subtextSize }) => (
    <div className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5 min-w-0">
        <div className={`bg-white/5 rounded-full p-2 flex-shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className={`text-gray-500 font-bold uppercase tracking-wider truncate ${subtextSize}`}>{label}</p>
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
      const offset = data.timezoneOffset || 0;
      const date = new Date((timestamp + offset) * 1000);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const getUviInfo = (uvi: number) => {
    const u = Math.round(uvi);
    if (u <= 2) return { level: 'Baixo', val: u };
    if (u <= 5) return { level: 'Mod.', val: u };
    return { level: 'Alto', val: u };
  };
  
  const uviInfo = typeof data.uvi === 'number' ? getUviInfo(data.uvi) : null;
  const iconClass = `${density.iconSize} ${classes.text}`;
  const itemProps = { iconSize: density.iconSize, textSize: density.text, subtextSize: 'text-[10px]' };

  return (
    <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
        <div className={`grid grid-cols-2 ${density.gap} gap-y-2`}>
            <InfoItem icon={<SunriseIcon className={iconClass} />} label="Nascer" value={formatTime(data.sunrise)} {...itemProps} />
            <InfoItem icon={<SunsetIcon className={iconClass} />} label="Pôr" value={formatTime(data.sunset)} {...itemProps} />
            <InfoItem icon={<WindIcon className={iconClass} />} label="Vento" value={`${data.windSpeed} km/h ${degreesToCardinal(data.wind_deg || 0)}`} {...itemProps} />
            <InfoItem icon={<DropletsIcon className={iconClass} />} label="Umidade" value={`${data.humidity}%`} {...itemProps} />
            <InfoItem icon={<GaugeIcon className={iconClass} />} label="Pressão" value={`${data.pressure} hPa`} {...itemProps} />
            <InfoItem icon={<SunIcon className={iconClass} />} label="Índice UV" value={uviInfo ? `${uviInfo.val} (${uviInfo.level})` : '-'} {...itemProps} />
        </div>
    </div>
  );
};

export default AdditionalInfo;

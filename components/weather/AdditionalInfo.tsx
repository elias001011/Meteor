
import React from 'react';
import type { WeatherData } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, EyeIcon, CloudIcon, ThermometerIcon, CloudRainIcon, CloudSnowIcon, SunriseIcon, SunsetIcon } from '../icons';

interface AdditionalInfoProps {
  data: WeatherData;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="bg-gray-700/50 rounded-full p-2">
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="font-bold">{value}</p>
        </div>
    </div>
);

const degreesToCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
};

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ data }) => {
  const getUviInfo = (uvi: number) => {
    const uviValue = Math.round(uvi);
    if (uviValue <= 2) return { level: 'Baixo', value: `${uviValue} de 11+` };
    if (uviValue <= 5) return { level: 'Moderado', value: `${uviValue} de 11+` };
    if (uviValue <= 7) return { level: 'Alto', value: `${uviValue} de 11+` };
    if (uviValue <= 10) return { level: 'Muito Alto', value: `${uviValue} de 11+` };
    return { level: 'Extremo', value: `${uviValue} de 11+` };
  };
  
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const uviInfo = typeof data.uvi === 'number' && !isNaN(data.uvi) ? getUviInfo(data.uvi) : null;
  const windDirection = typeof data.wind_deg === 'number' ? ` ${degreesToCardinal(data.wind_deg)}` : '';

  return (
    <div className="bg-gray-800 rounded-3xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoItem icon={<SunriseIcon className="w-5 h-5 text-cyan-400" />} label="Nascer do Sol" value={formatTime(data.sunrise)} />
            <InfoItem icon={<SunsetIcon className="w-5 h-5 text-cyan-400" />} label="Pôr do Sol" value={formatTime(data.sunset)} />
            <InfoItem icon={<WindIcon className="w-5 h-5 text-cyan-400" />} label="Vento" value={`${data.windSpeed} km/h${windDirection}`} />
            {typeof data.wind_gust === 'number' && <InfoItem icon={<WindIcon className="w-5 h-5 text-cyan-400" />} label="Rajadas" value={`${Math.round(data.wind_gust)} km/h`} />}
            <InfoItem icon={<DropletsIcon className="w-5 h-5 text-cyan-400" />} label="Umidade" value={`${data.humidity}%`} />
            <InfoItem icon={<GaugeIcon className="w-5 h-5 text-cyan-400" />} label="Pressão" value={`${data.pressure} hPa`} />
            {typeof data.visibility === 'number' && <InfoItem icon={<EyeIcon className="w-5 h-5 text-cyan-400" />} label="Visibilidade" value={`${(data.visibility / 1000).toFixed(1)} km`} />}
            {typeof data.clouds === 'number' && <InfoItem icon={<CloudIcon className="w-5 h-5 text-cyan-400" />} label="Nuvens" value={`${data.clouds}%`} />}
            {typeof data.dew_point === 'number' && <InfoItem icon={<ThermometerIcon className="w-5 h-5 text-cyan-400" />} label="Ponto de Orvalho" value={`${Math.round(data.dew_point)}°C`} />}
            {typeof data.rain_1h === 'number' && data.rain_1h > 0 && <InfoItem icon={<CloudRainIcon className="w-5 h-5 text-cyan-400" />} label="Chuva (1h)" value={`${data.rain_1h} mm`} />}
            {typeof data.snow_1h === 'number' && data.snow_1h > 0 && <InfoItem icon={<CloudSnowIcon className="w-5 h-5 text-cyan-400" />} label="Neve (1h)" value={`${data.snow_1h} mm`} />}
            {uviInfo && (
                <InfoItem icon={<SunIcon className="w-5 h-5 text-cyan-400" />} label={`UV (${uviInfo.level})`} value={uviInfo.value} />
            )}
        </div>
    </div>
  );
};

export default AdditionalInfo;
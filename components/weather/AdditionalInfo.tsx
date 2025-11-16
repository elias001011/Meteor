
import React from 'react';
import type { WeatherData } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, SunriseIcon, SunsetIcon } from '../icons';

interface AdditionalInfoProps {
  data: WeatherData;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
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

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ data }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUviInfo = (uvi: number) => {
    const uviValue = Math.round(uvi);
    if (uviValue <= 2) return { level: 'Baixo', value: `${uviValue} de 11+` };
    if (uviValue <= 5) return { level: 'Moderado', value: `${uviValue} de 11+` };
    if (uviValue <= 7) return { level: 'Alto', value: `${uviValue} de 11+` };
    if (uviValue <= 10) return { level: 'Muito Alto', value: `${uviValue} de 11+` };
    return { level: 'Extremo', value: `${uviValue} de 11+` };
  };

  const uviInfo = typeof data.uvi === 'number' && !isNaN(data.uvi) ? getUviInfo(data.uvi) : null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoItem icon={<WindIcon className="w-5 h-5 text-cyan-400" />} label="Vento" value={`${data.windSpeed} km/h`} />
            <InfoItem icon={<DropletsIcon className="w-5 h-5 text-cyan-400" />} label="Umidade" value={`${data.humidity}%`} />
            <InfoItem icon={<GaugeIcon className="w-5 h-5 text-cyan-400" />} label="Pressão" value={`${data.pressure} hPa`} />
            <InfoItem icon={<SunriseIcon className="w-5 h-5 text-cyan-400" />} label="Nascer do Sol" value={formatTime(data.sunrise)} />
            <InfoItem icon={<SunsetIcon className="w-5 h-5 text-cyan-400" />} label="Pôr do Sol" value={formatTime(data.sunset)} />
            {uviInfo && (
                <InfoItem icon={<SunIcon className="w-5 h-5 text-cyan-400" />} label={`UV (${uviInfo.level})`} value={uviInfo.value} />
            )}
        </div>
    </div>
  );
};

export default AdditionalInfo;
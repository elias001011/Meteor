
import React from 'react';
import type { WeatherData } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon } from '../icons';

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
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
        <div className="grid grid-cols-3 gap-4">
            <InfoItem icon={<WindIcon className="w-5 h-5 text-cyan-400" />} label="Vento" value={`${data.windSpeed} km/h`} />
            <InfoItem icon={<DropletsIcon className="w-5 h-5 text-cyan-400" />} label="Umidade" value={`${data.humidity}%`} />
            <InfoItem icon={<GaugeIcon className="w-5 h-5 text-cyan-400" />} label="Pressão" value={`${data.pressure} hPa`} />
        </div>
    </div>
  );
};

export default AdditionalInfo;

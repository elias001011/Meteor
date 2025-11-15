
import React from 'react';
import type { AirQualityData } from '../../types';

interface AirQualityProps {
    data: AirQualityData;
}

interface AqiInfo {
    level: string;
    colorClass: string;
    textColorClass: string;
    percentage: number;
}

const getAqiInfo = (aqi: number): AqiInfo => {
    const percentage = Math.min((aqi / 200) * 100, 100); // Cap at 200 for simplicity in the progress bar
    if (aqi <= 50) {
        return { level: 'Boa', colorClass: 'bg-green-500', textColorClass: 'text-green-400', percentage };
    }
    if (aqi <= 100) {
        return { level: 'Moderada', colorClass: 'bg-yellow-500', textColorClass: 'text-yellow-400', percentage };
    }
    if (aqi <= 150) {
        return { level: 'Ruim', colorClass: 'bg-orange-500', textColorClass: 'text-orange-400', percentage };
    }
    if (aqi <= 200) {
        return { level: 'Insalubre', colorClass: 'bg-red-500', textColorClass: 'text-red-400', percentage };
    }
    return { level: 'Perigosa', colorClass: 'bg-purple-500', textColorClass: 'text-purple-400', percentage };
};


const AirQuality: React.FC<AirQualityProps> = ({ data }) => {
    const aqiInfo = getAqiInfo(data.aqi);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
            <h3 className="text-sm text-gray-400 mb-2 px-2">Qualidade do Ar</h3>
            <div className="flex items-center justify-between px-2">
                <span className={`font-bold text-lg ${aqiInfo.textColorClass}`}>{aqiInfo.level}</span>
                <span className="font-bold text-lg bg-gray-700/60 px-2 py-1 rounded-md">{data.aqi} AQI</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3 mx-auto">
                <div className={`${aqiInfo.colorClass} h-2 rounded-full`} style={{ width: `${aqiInfo.percentage}%` }}></div>
            </div>
        </div>
    );
};

export default AirQuality;
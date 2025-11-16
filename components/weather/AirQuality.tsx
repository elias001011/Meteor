
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
    const levels = ['Boa', 'Razoável', 'Moderada', 'Ruim', 'Muito Ruim'];
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];
    const textColors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-purple-400'];
    const index = Math.max(0, aqi - 1);
    const percentage = (aqi / 5) * 100;
    
    return {
        level: levels[index] || 'Desconhecido',
        colorClass: colors[index] || 'bg-gray-500',
        textColorClass: textColors[index] || 'text-gray-400',
        percentage,
    };
};

const Pollutant: React.FC<{ name: string; value: number | undefined; unit: string }> = ({ name, value, unit }) => (
    <div className="text-center bg-gray-700/40 rounded-lg p-2">
        <p className="text-xs text-gray-400">{name}</p>
        <p className="font-semibold">{typeof value === 'number' ? value.toFixed(1) : '-'}</p>
        <p className="text-xs text-gray-500">{unit}</p>
    </div>
);


const AirQuality: React.FC<AirQualityProps> = ({ data }) => {
    const aqiInfo = typeof data.aqi === 'number' ? getAqiInfo(data.aqi) : null;

    return (
        <div className="bg-gray-800 rounded-3xl p-4 space-y-3">
            <div>
                <h3 className="text-sm text-gray-400 mb-2 px-2">Qualidade do Ar</h3>
                 {aqiInfo && (
                    <>
                        <div className="flex items-center justify-between px-2">
                            <span className={`font-bold text-lg ${aqiInfo.textColorClass}`}>{aqiInfo.level}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-3 mx-auto">
                            <div className={`${aqiInfo.colorClass} h-2 rounded-full`} style={{ width: `${aqiInfo.percentage}%` }}></div>
                        </div>
                    </>
                )}
            </div>
            <div>
                <h4 className="text-xs text-gray-400 mb-2 px-2">Componentes (μg/m³)</h4>
                <div className="grid grid-cols-4 gap-2">
                    <Pollutant name="PM2.5" value={data.components.pm2_5} unit="fino" />
                    <Pollutant name="O₃" value={data.components.o3} unit="ozônio" />
                    <Pollutant name="NO₂" value={data.components.no2} unit="nitro." />
                    <Pollutant name="SO₂" value={data.components.so2} unit="enxof." />
                </div>
            </div>
        </div>
    );
};

export default AirQuality;
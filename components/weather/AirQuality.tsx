



import React from 'react';
import type { AirQualityData } from '../../types';
import { useTheme } from '../context/ThemeContext';

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
    <div className="text-center bg-white/5 border border-white/5 rounded-xl p-3 backdrop-blur-sm">
        <p className="text-xs text-gray-400 mb-1">{name}</p>
        <p className="font-bold text-lg">{typeof value === 'number' ? value.toFixed(1) : '-'}</p>
        <p className="text-[10px] text-gray-500 uppercase">{unit}</p>
    </div>
);


const AirQuality: React.FC<AirQualityProps> = ({ data }) => {
    const { cardClass, density } = useTheme();
    const aqiInfo = typeof data.aqi === 'number' ? getAqiInfo(data.aqi) : null;

    return (
        <div className={`rounded-3xl ${density.padding} space-y-4 ${cardClass} animate-enter delay-100`}>
            <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3 px-1 uppercase tracking-wide">Qualidade do Ar</h3>
                 {aqiInfo && (
                    <>
                        <div className="flex items-center justify-between px-1">
                            <span className={`font-bold text-2xl ${aqiInfo.textColorClass}`}>{aqiInfo.level}</span>
                            <span className="text-xs text-gray-500">Índice: {data.aqi}</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-3 mt-3 mx-auto overflow-hidden">
                            <div className={`${aqiInfo.colorClass} h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)]`} style={{ width: `${aqiInfo.percentage}%` }}></div>
                        </div>
                    </>
                )}
            </div>
            <div>
                <h4 className="text-xs text-gray-400 mb-3 px-1 mt-4">Componentes (μg/m³)</h4>
                <div className="grid grid-cols-4 gap-3">
                    <Pollutant name="PM2.5" value={data.components.pm2_5} unit="partíc." />
                    <Pollutant name="O₃" value={data.components.o3} unit="ozônio" />
                    <Pollutant name="NO₂" value={data.components.no2} unit="nitro." />
                    <Pollutant name="SO₂" value={data.components.so2} unit="enxof." />
                </div>
            </div>
        </div>
    );
};

export default AirQuality;